import mongoose from "mongoose";
import Payment from "../models/payment.modal.js";
import User from "../models/userModal.js";
import Course from "../models/courseModal.js";
import CourseProgress from "../models/courseProgressModal.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import razorpay from "../config/razorpay.js";
import { sendSuccess } from "../utils/response.js";
import { enrollmentEmailTemplate } from "../template/enrollmentEmailTemplate.js";
import { paymentFailedEmailTemplate } from "../template/paymentFailedEmailTemplate.js";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

const PAYMENT_STATUS = { SUCCESS: "success", FAILED: "failed" };
const isValidObjectId = (id: string) =>
  /^[0-9a-fA-F]{24}$/.test(id?.toString() || "");

// Create Order
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }
    const { courseIds: rawCourseIds } = req.body;
    const userId = req.user.id;

    if (
      !rawCourseIds ||
      !Array.isArray(rawCourseIds) ||
      rawCourseIds.length === 0
    ) {
      return next(new AppError(400, "Please select at least one course"));
    }

    const courseIds: string[] = [...new Set(rawCourseIds)];

    if (!courseIds.every(isValidObjectId)) {
      return next(new AppError(400, "Invalid course IDs format"));
    }

    const user = await User.findById(userId);
    if (!user) return next(new AppError(401, "User not found"));

    const courses = await Course.find({ _id: { $in: courseIds } }).lean();
    if (courses.length !== courseIds.length) {
      return next(new AppError(404, "One or more courses not found"));
    }

    const unapproved = courses.find((c) => c.status !== "approved");
    if (unapproved) {
      return next(
        new AppError(
          400,
          `"${unapproved.title}" is not available for purchase`,
        ),
      );
    }

    const enrolledIds = new Set(
      (user.enrolledCourses || []).map((id) => id.toString()),
    );
    let totalAmount = 0;

    for (const course of courses) {
      if (enrolledIds.has(course._id.toString())) {
        return next(new AppError(400, `Already enrolled in ${course.title}`));
      }
      totalAmount += course.price;
    }

    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { userId, courseIds: JSON.stringify(courseIds) },
    });

    return sendSuccess(res, 200, "Order created", { order });
  } catch (error) {
    return next(error);
  }
};

//  Webhook helpers
const verifySignature = (
  bodyBuffer: Buffer,
  signature: unknown,
  secret: string,
) => {
  if (typeof signature !== "string" || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(bodyBuffer)
    .digest("hex");
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  return (
    expectedBuf.length === signatureBuf.length &&
    crypto.timingSafeEqual(expectedBuf, signatureBuf)
  );
};

const parseNotes = (payment: any) => {
  try {
    const notes = payment.notes || {};
    const userId = notes.userId;
    const courseIds = JSON.parse(notes.courseIds || "[]");
    if (!userId || !Array.isArray(courseIds) || !courseIds.length)
      throw new Error();
    return { userId, courseIds } as { userId: string; courseIds: string[] };
  } catch {
    return null;
  }
};

const getUserFullName = (user: any) =>
  `${user.firstName || ""} ${user.lastName || ""}`.trim();

const enrollStudent = async (
  notes: { userId: string; courseIds: string[] },
  courses: any[],
  session: mongoose.ClientSession,
) => {
  const { userId, courseIds } = notes;

  const user = await User.findById(userId).session(session);
  if (!user) throw new Error("User not found");

  const enrolledSet = new Set(
    (user.enrolledCourses || []).map((cid) => cid.toString()),
  );
  const newIds = courseIds.filter((cid) => !enrolledSet.has(cid.toString()));

  if (!newIds.length) {
    return { alreadyEnrolled: true, enrolledTitles: [] as string[] };
  }

  const titles = courses
    .filter((c) => newIds.includes(c._id.toString()))
    .map((c) => c.title);

  await User.updateOne(
    { _id: userId },
    { $addToSet: { enrolledCourses: { $each: newIds } } },
    { session },
  );

  await Promise.all(
    newIds.map((cid) =>
      Course.updateOne(
        { _id: cid },
        { $addToSet: { enrolledStudents: userId } },
        { session },
      ),
    ),
  );

  await Course.updateMany(
    { _id: { $in: newIds } },
    { $inc: { totalStudentsCount: 1 } },
    { session },
  );

  const progressDocs = newIds.map((cid) => {
    const course = courses.find((c) => c._id.toString() === cid.toString());
    return {
      userId,
      courseId: cid,
      completedVideos: [],
      totalVideos: course?.totalLessons || 0,
      progressPercentage: 0,
    };
  });

  if (progressDocs.length) {
    await CourseProgress.insertMany(progressDocs, { session }).catch((err) => {
      console.error("[Webhook] CourseProgress insert issue:", err.message);
    });
  }

  return { alreadyEnrolled: false, enrolledTitles: titles };
};

const sendEnrollmentEmail = (user: any, payment: any, titles: string[]) =>
  setImmediate(async () => {
    try {
      const html = enrollmentEmailTemplate(
        getUserFullName(user),
        payment.amount / 100,
        payment.order_id,
        payment.id,
        titles,
      );
      await sendEmail(
        user.email,
        "Course Purchase & Enrollment Confirmation - StudyHub",
        html,
      );
    } catch (e: any) {
      console.error("[Webhook] Enrollment email failed", {
        order_id: payment.order_id,
        error: e.message,
      });
    }
  });

const sendFailureEmail = (
  user: any,
  payment: any,
  titles: string[],
  reason: string,
) =>
  setImmediate(async () => {
    try {
      const html = paymentFailedEmailTemplate(
        getUserFullName(user),
        payment.amount / 100,
        payment.order_id,
        titles,
        reason,
      );
      await sendEmail(user.email, "Payment Failed - StudyHub", html);
    } catch (e: any) {
      console.error("[Webhook] Failure email failed", {
        order_id: payment.order_id,
        error: e.message,
      });
    }
  });

export const razorpayWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[Webhook] Missing RAZORPAY_WEBHOOK_SECRET");
    return res
      .status(500)
      .json({ success: false, message: "Server configuration error" });
  }

  if (!verifySignature(req.body, signature, secret)) {
    console.warn("[Webhook] Signature mismatch");
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  let event, payload;
  try {
    ({ event, payload } = JSON.parse(req.body.toString("utf8")));
  } catch {
    return res
      .status(400)
      .json({ success: false, message: "Malformed payload" });
  }

  if (event === "payment.captured") {
    const payment = payload.payment.entity;

    if (!payment?.id) return res.status(200).json({ success: true });

    const already = await Payment.findOne({ transactionId: payment.id });
    if (already) return res.status(200).json({ success: true });

    const notes = parseNotes(payment);
    if (!notes) return res.status(200).json({ success: true });

    const { userId, courseIds } = notes;
    if (!isValidObjectId(userId)) {
      return res.status(200).json({ success: true });
    }

    const courses = await Course.find({ _id: { $in: courseIds } })
      .select("price instructor title totalLessons")
      .lean();

    if (courses.length !== courseIds.length) {
      console.error(
        "[Webhook] payment.captured: course mismatch — payment captured but courses missing",
        { transactionId: payment.id, userId, courseIds },
      );
      return res.status(200).json({ success: true });
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const paymentDocs = courses.map((course) => ({
        user: userId,
        course: course._id,
        instructor: course.instructor,
        amount: course.price,
        currency: payment.currency,
        status: PAYMENT_STATUS.SUCCESS,
        paymentMethod: "razorpay",
        transactionId: payment.id,
        paymentGatewayOrderId: payment.order_id,
      }));

      try {
        await Payment.insertMany(paymentDocs, { session, ordered: true });
      } catch (err: any) {
        if (err.code === 11000) {
          await session.abortTransaction();
          return res.status(200).json({ success: true });
        }
        throw err;
      }
      const { alreadyEnrolled, enrolledTitles } = await enrollStudent(
        notes,
        courses,
        session,
      );

      await session.commitTransaction();

      if (!alreadyEnrolled) {
        const user = await User.findById(userId).lean();
        if (user) sendEnrollmentEmail(user, payment, enrolledTitles);
      }

      return res.status(200).json({ success: true });
    } catch (err: any) {
      await session.abortTransaction();
      console.error("[Webhook] payment.captured error", err.message);
      return res.status(500).json({ success: false });
    } finally {
      session.endSession();
    }
  }

  if (event === "payment.failed") {
    const payment = payload.payment.entity;

    try {
      if (!payment?.id) return res.status(200).json({ success: true });

      const already = await Payment.findOne({ transactionId: payment.id });
      if (already) return res.status(200).json({ success: true });

      const notes = parseNotes(payment);
      if (notes) {
        const { userId, courseIds } = notes;
        if (!isValidObjectId(userId)) {
          return res.status(200).json({ success: true });
        }

        const courses = await Course.find({ _id: { $in: courseIds } })
          .select("price instructor title")
          .lean();

        const reason =
          payment.error_description ||
          payment.error_reason ||
          "Payment processing failed";

        if (courses.length) {
          await Payment.insertMany(
            courses.map((course) => ({
              user: userId,
              course: course._id,
              instructor: course.instructor,
              amount: course.price,
              currency: payment.currency,
              status: PAYMENT_STATUS.FAILED,
              paymentMethod: "razorpay",
              transactionId: payment.id,
              paymentGatewayOrderId: payment.order_id,
            })),
            { ordered: false },
          );
        }

        const user = await User.findById(userId)
          .lean()
          .catch(() => null);
        if (user) {
          sendFailureEmail(
            user,
            payment,
            courses.map((c) => c.title),
            reason,
          );
        }
      }
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error("[Webhook] payment.failed error", err.message);
      return res.status(200).json({ success: true });
    }
  }

  return res.status(200).json({ success: true });
};

import Payment from "../models/payment.modal.js";
import User from "../models/userModal.js";
import Course from "../models/courseModal.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import enrollmentEmailTemplate from "../template/enrollmentEmailTemplate.js";
import paymentFailedEmailTemplate from "../template/paymentFailedEmailTemplate.js";
import razorpay from "../config/razorpay.js";
import mongoose from "mongoose";

// create Razorpay order
const createOrder = async (req, res) => {
  try {
    const { courseIds } = req.body;
    const userId = req.user.id;

    if (!courseIds || courseIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Please select at least one course" });
    }

    const user = await User.findById(userId);

    let totalAmount = 0;
    const validCourses = [];

    for (const cid of courseIds) {
      const course = await Course.findById(cid);

      if (!course) {
        return res.status(404).json({ message: `Course ${cid} not found` });
      }

      if (user.enrolledCourses.includes(cid)) {
        return res
          .status(400)
          .json({ message: `Already enrolled in ${course.title}` });
      }

      validCourses.push(course);
      totalAmount += course.price;
    }

    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId,
        courseIds: JSON.stringify(courseIds),
      },
    });

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Order error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// verify Razorpay signature
const verifySignature = (bodyBuffer, signature, secret) => {
  if (!signature) return false;
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

// extract userId & courseIds from payment notes
const parseNotes = (payment) => {
  try {
    const notes = payment.notes || {};
    const userId = notes.userId;
    const courseIds = JSON.parse(notes.courseIds || "[]");
    if (!userId || !Array.isArray(courseIds) || !courseIds.length)
      throw new Error();
    return { userId, courseIds };
  } catch {
    return null;
  }
};

const getUserFullName = (user) =>
  `${user.firstName || ""} ${user.lastName || ""}`.trim();

const enrollStudent = async (payment) => {
  const notes = parseNotes(payment);
  if (!notes) throw new Error("Invalid notes");

  const { userId, courseIds } = notes;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [user, courses] = await Promise.all([
      User.findById(userId).session(session),
      Course.find({ _id: { $in: courseIds } }).session(session),
    ]);

    if (!user) throw new Error("User not found");
    if (courses.length !== courseIds.length) throw new Error("Course mismatch");

    // skip already enrolled courses
    const enrolledSet = new Set(
      (user.enrolledCourses || []).map((id) => id.toString()),
    );
    const newIds = courseIds.filter((id) => !enrolledSet.has(id.toString()));
    if (!newIds.length)
      return { alreadyEnrolled: true, enrolledTitles: [], userId };

    const titles = courses
      .filter((c) => newIds.includes(c._id.toString()))
      .map((c) => c.title);

    // atomic writes
    await Promise.all([
      User.updateOne(
        { _id: userId },
        { $addToSet: { enrolledCourses: { $each: newIds } } },
        { session },
      ),
      ...newIds.map((id) =>
        Course.updateOne(
          { _id: id },
          { $addToSet: { enrolledStudents: userId } },
          { session },
        ),
      ),
    ]);

    await session.commitTransaction();
    return { alreadyEnrolled: false, enrolledTitles: titles, userId };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// Email senders

const sendEnrollmentEmail = (user, payment, titles) =>
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
    } catch (e) {
      console.error("[Webhook] Enrollment email failed", {
        order_id: payment.order_id,
        error: e.message,
      });
    }
  });

const sendFailureEmail = (user, payment) =>
  setImmediate(async () => {
    try {
      const reason =
        payment.error_description ||
        payment.error_reason ||
        "Payment processing failed";
      const html = paymentFailedEmailTemplate(
        getUserFullName(user),
        payment.amount / 100,
        payment.order_id,
        reason,
      );
      await sendEmail(user.email, "Payment Failed - StudyHub", html);
    } catch (e) {
      console.error("[Webhook] Failure email failed", {
        order_id: payment.order_id,
        error: e.message,
      });
    }
  });

const razorpayWebhook = async (req, res) => {
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
    console.warn("[Webhook] Bad JSON payload");
    return res
      .status(400)
      .json({ success: false, message: "Malformed payload" });
  }

  console.log("[Webhook] Event received", {
    event,
    order_id: payload?.payment?.entity?.order_id,
  });

  // Payment success
  if (event === "payment.captured") {
    const payment = payload.payment.entity;

    try {
      // check duplicate
      const already = await Payment.findOne({
        transactionId: payment.id,
      });

      if (already) {
        console.log("[Webhook] Duplicate payment ignored", payment.id);
        return res.status(200).json({ success: true });
      }

      // payment record creation
      const notes = parseNotes(payment);
      const { userId, courseIds } = notes;

      const courses = await Course.find({
        _id: { $in: courseIds },
      }).select("price instructor");

      for (const course of courses) {
        await Payment.create({
          user: userId,
          course: course._id,
          instructor: course.instructor,
          amount: course.price,
          currency: payment.currency,
          status: "success",
          paymentMethod: "razorpay",
          transactionId: payment.id,
          paymentGatewayOrderId: payment.order_id,
        });
      }

      // enroll student
      const { alreadyEnrolled, enrolledTitles } = await enrollStudent(payment);

      if (!alreadyEnrolled) {
        const user = await User.findById(userId).lean();
        if (user) sendEnrollmentEmail(user, payment, enrolledTitles);
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[Webhook] payment.captured error", err.message);
      return res.status(500).json({ success: false });
    }
  }

  // payment failed
  if (event === "payment.failed") {
    const payment = payload.payment.entity;

    try {
      const notes = parseNotes(payment);

      if (notes) {
        const { userId, courseIds } = notes;

        // record failed payment
        await Payment.create({
          user: userId,
          course: courseIds[0],
          amount: payment.amount / 100,
          currency: payment.currency,
          status: "failed",
          paymentMethod: "razorpay",
          transactionId: payment.id,
          paymentGatewayOrderId: payment.order_id,
        });

        // send failure email
        const user = await User.findById(userId)
          .lean()
          .catch(() => null);

        if (user) sendFailureEmail(user, payment);
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[Webhook] payment.failed error", err.message);
      return res.status(200).json({ success: true });
    }
  }

  //unhandled
  console.log("[Webhook] Unhandled event", { event });
  return res.status(200).json({ success: true });
};

export { createOrder, razorpayWebhook };

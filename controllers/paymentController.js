import Payment from "../models/payment.modal.js";
import User from "../models/userModal.js";
import Course from "../models/courseModal.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import enrollmentEmailTemplate from "../template/enrollmentEmailTemplate.js";
import paymentFailedEmailTemplate from "../template/paymentFailedEmailTemplate.js";
import razorpay from "../config/razorpay.js";

// Environment & Constants
const isDevelopment = process.env.NODE_ENV !== "production";

const PAYMENT_STATUS = {
  SUCCESS: "success",
  FAILED: "failed",
};

// Validate MongoDB ObjectId format
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id?.toString() || "");

// create Razorpay order
const createOrder = async (req, res, next) => {
  try {
    const { courseIds } = req.body;
    const userId = req.user.id;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Please select at least one course" });
    }

    // Validate courseIds format
    if (!courseIds.every(isValidObjectId)) {
      return res.status(400).json({ message: "Invalid course IDs format" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    let totalAmount = 0;

    const courses = await Course.find({ _id: { $in: courseIds } });

    if (courses.length !== courseIds.length) {
      return res.status(404).json({ message: "One or more courses not found" });
    }

    for (const course of courses) {
      if (user.enrolledCourses.includes(course._id)) {
        return res
          .status(400)
          .json({ message: `Already enrolled in ${course.title}` });
      }
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
    return next(error);
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

  // fetch user and courses
  const [user, courses] = await Promise.all([
    User.findById(userId),
    Course.find({ _id: { $in: courseIds } }),
  ]);

  if (!user) throw new Error("User not found");
  if (courses.length !== courseIds.length) throw new Error("Course mismatch");

  // skip if already enrolled in courses
  const enrolledSet = new Set(
    (user.enrolledCourses || []).map((id) => id.toString()),
  );

  const newIds = courseIds.filter((id) => !enrolledSet.has(id.toString()));

  if (!newIds.length) {
    return { alreadyEnrolled: true, enrolledTitles: [], userId };
  }

  const titles = courses
    .filter((c) => newIds.includes(c._id.toString()))
    .map((c) => c.title);

  // enroll user in new courses
  await Promise.all([
    User.updateOne(
      { _id: userId },
      { $addToSet: { enrolledCourses: { $each: newIds } } },
    ),
    ...newIds.map((id) =>
      Course.updateOne(
        { _id: id },
        { $addToSet: { enrolledStudents: userId } },
      ),
    ),
  ]);

  return { alreadyEnrolled: false, enrolledTitles: titles, userId };
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
      if (isDevelopment) {
        console.error("[Webhook] Enrollment email failed", {
          order_id: payment.order_id,
          error: e.message,
        });
      }
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
      if (isDevelopment) {
        console.error("[Webhook] Failure email failed", {
          order_id: payment.order_id,
          error: e.message,
        });
      }
    }
  });

const razorpayWebhook = async (req, res, next) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    if (isDevelopment)
      console.error("[Webhook] Missing RAZORPAY_WEBHOOK_SECRET");
    return res
      .status(500)
      .json({ success: false, message: "Server configuration error" });
  }

  if (!verifySignature(req.body, signature, secret)) {
    if (isDevelopment) console.warn("[Webhook] Signature mismatch");
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  let event, payload;
  try {
    ({ event, payload } = JSON.parse(req.body.toString("utf8")));
  } catch {
    if (isDevelopment) console.warn("[Webhook] Bad JSON payload");
    return res
      .status(400)
      .json({ success: false, message: "Malformed payload" });
  }

  if (isDevelopment) {
    console.log("[Webhook] Event received", {
      event,
      order_id: payload?.payment?.entity?.order_id,
    });
  }

  // Payment success
  if (event === "payment.captured") {
    const payment = payload.payment.entity;

    try {
      // Validate payment entity structure
      if (!payment || !payment.id) {
        if (isDevelopment) console.warn("[Webhook] Invalid payment entity");
        return res.status(200).json({ success: true });
      }

      // check duplicate
      const already = await Payment.findOne({
        transactionId: payment.id,
      });

      if (already) {
        if (isDevelopment)
          console.log("[Webhook] Duplicate payment ignored", payment.id);
        return res.status(200).json({ success: true });
      }

      // payment record creation
      const notes = parseNotes(payment);
      if (!notes) {
        if (isDevelopment) console.warn("[Webhook] Invalid notes", payment.id);
        return res.status(200).json({ success: true });
      }

      const { userId, courseIds } = notes;

      // Validate userId
      if (!isValidObjectId(userId)) {
        if (isDevelopment)
          console.warn("[Webhook] Invalid userId format", userId);
        return res.status(200).json({ success: true });
      }

      const courses = await Course.find({
        _id: { $in: courseIds },
      }).select("price instructor");

      if (courses.length !== courseIds.length) {
        if (isDevelopment) console.warn("[Webhook] Course mismatch", courseIds);
        return res.status(200).json({ success: true });
      }

      for (const course of courses) {
        await Payment.create({
          user: userId,
          course: course._id,
          instructor: course.instructor,
          amount: course.price,
          currency: payment.currency,
          status: PAYMENT_STATUS.SUCCESS,
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
      if (isDevelopment)
        console.error("[Webhook] payment.captured error", err.message);
      return res.status(500).json({ success: false });
    }
  }

  // payment failed
  if (event === "payment.failed") {
    const payment = payload.payment.entity;

    try {
      if (!payment || !payment.id) {
        if (isDevelopment) console.warn("[Webhook] Invalid payment entity");
        return res.status(200).json({ success: true });
      }

      const notes = parseNotes(payment);

      if (notes) {
        const { userId, courseIds } = notes;

        // Validate userId
        if (!isValidObjectId(userId)) {
          if (isDevelopment)
            console.warn("[Webhook] Invalid userId format", userId);
          return res.status(200).json({ success: true });
        }

        // record failed payment
        await Payment.create({
          user: userId,
          course: courseIds[0],
          amount: payment.amount / 100,
          currency: payment.currency,
          status: PAYMENT_STATUS.FAILED,
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
      if (isDevelopment)
        console.error("[Webhook] payment.failed error", err.message);
      return res.status(200).json({ success: true });
    }
  }

  //unhandled
  if (isDevelopment) {
    console.log("[Webhook] Unhandled event", { event });
  }
  return res.status(200).json({ success: true });
};

export { createOrder, razorpayWebhook };

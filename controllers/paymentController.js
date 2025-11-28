import User from "../models/userModal.js";
import Course from "../models/courseModal.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import enrollmentEmailTemplate from "../template/enrollmentEmailTemplate.js";
import paymentFailedEmailTemplate from "../template/paymentFailedEmailTemplate.js";
import razorpay from "../config/razorpay.js";
import mongoose from "mongoose";

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

// extract userId & courseIds from payment.notes
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
      (user.enrolledCourses || []).map((id) => id.toString())
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
        { session }
      ),
      ...newIds.map((id) =>
        Course.updateOne(
          { _id: id },
          { $addToSet: { enrolledStudents: userId } },
          { session }
        )
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
        titles
      );
      await sendEmail(
        user.email,
        "Course Purchase & Enrollment Confirmation - StudyHub",
        html
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
        reason
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

  // Paymenet success
  if (event === "payment.captured") {
    const payment = payload.payment.entity;
    try {
      const { alreadyEnrolled, enrolledTitles, userId } = await enrollStudent(
        payment
      );
      if (alreadyEnrolled) {
        console.log("[Webhook] Already enrolled", {
          order_id: payment.order_id,
        });
        return res
          .status(200)
          .json({ success: true, message: "Already enrolled" });
      }
      const user = await User.findById(userId).lean();
      if (user) sendEnrollmentEmail(user, payment, enrolledTitles);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[Webhook] Enrollment error", {
        order_id: payment.order_id,
        error: err.message,
      });
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // payment failed
  if (event === "payment.failed") {
    const payment = payload.payment.entity;
    const notes = parseNotes(payment);
    if (notes) {
      const user = await User.findById(notes.userId)
        .lean()
        .catch(() => null);
      if (user) sendFailureEmail(user, payment);
    }
    return res.status(200).json({ success: true });
  }

  //unhandled
  console.log("[Webhook] Unhandled event", { event });
  return res.status(200).json({ success: true });
};

// const razorpayWebhook = async (req, res) => {
//   try {
//     const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
//     const signature = req.headers["x-razorpay-signature"];

//     // Verify secret exists
//     if (!secret) {
//       return res
//         .status(500)
//         .json({ success: false, message: "Server configuration error" });
//     }

//     const rawBody = req.body.toString("utf8");

//     const expected = crypto
//       .createHmac("sha256", secret)
//       .update(rawBody)
//       .digest("hex");

//     if (expected !== signature) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid signature" });
//     }

//     // Parse the JSON after verification
//     const { event, payload } = JSON.parse(rawBody);

//     if (event === "payment.captured") {
//       const payment = payload.payment.entity;

//       let userId, courseIds;
//       try {
//         userId = payment.notes.userId;
//         courseIds = JSON.parse(payment.notes.courseIds);

//         // Validate data
//         if (!userId || !Array.isArray(courseIds) || courseIds.length === 0) {
//           throw new Error("Invalid notes data");
//         }
//       } catch (err) {
//         console.error("Notes parsing error:", err);
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid notes format" });
//       }

//       const session = await mongoose.startSession();
//       session.startTransaction();

//       try {
//         // Find user
//         const user = await User.findById(userId).session(session);
//         if (!user) {
//           throw new Error("User not found");
//         }

//         // Find courses and validate they all exist
//         const courses = await Course.find({ _id: { $in: courseIds } }).session(
//           session
//         );

//         if (courses.length !== courseIds.length) {
//           throw new Error("Some courses not found");
//         }

//         // Filter out courses user is already enrolled in
//         const newCourseIds = courseIds.filter(
//           (id) => !user.enrolledCourses.includes(id.toString())
//         );

//         if (newCourseIds.length === 0) {
//           console.log("User already enrolled in all courses");
//           await session.commitTransaction();
//           return res
//             .status(200)
//             .json({ success: true, message: "Already enrolled" });
//         }

//         const enrolledTitles = [];

//         // Update courses with new enrollment
//         await Promise.all(
//           courses.map((c) => {
//             if (newCourseIds.includes(c._id.toString())) {
//               enrolledTitles.push(c.title);
//               return Course.findByIdAndUpdate(
//                 c._id,
//                 { $addToSet: { enrolledStudents: userId } },
//                 { new: true, session }
//               );
//             }
//             return Promise.resolve();
//           })
//         );

//         // Add new courses to user's enrolled list
//         user.enrolledCourses.push(...newCourseIds);
//         await user.save({ session });

//         await session.commitTransaction();

//         // Send enrollment email (non-blocking)
//         setImmediate(async () => {
//           try {
//             const htmlBody = enrollmentEmailTemplate(
//               user.name,
//               payment.amount / 100,
//               payment.order_id,
//               payment.id,
//               enrolledTitles
//             );

//             const emailResponse = await sendEmail(
//               user.email,
//               "Course Purchase & Enrollment Confirmation - StudyHub",
//               htmlBody
//             );
//             console.log("emailResponse", emailResponse);
//           } catch (error) {
//             console.error("Email send error:", error);
//           }
//         });

//         return res.status(200).json({ success: true });
//       } catch (err) {
//         await session.abortTransaction();
//         console.error("Transaction error:", err);
//         return res.status(500).json({ success: false, message: err.message });
//       } finally {
//         session.endSession();
//       }
//     }

//     if (event === "payment.failed") {
//       const payment = payload.payment.entity;

//       try {
//         const user = await User.findById(payment.notes.userId);

//         if (user) {
//           // Send failure email
//           setImmediate(async () => {
//             try {
//               const reason =
//                 payment.error_description ||
//                 payment.error_reason ||
//                 "Payment processing failed";

//               const htmlBody = paymentFailedEmailTemplate(
//                 user.name,
//                 payment.amount / 100,
//                 payment.order_id,
//                 reason
//               );

//               await sendEmail(
//                 user?.email,
//                 "Payment Failed - StudyHub",
//                 htmlBody
//               );
//             } catch (error) {
//               console.error("Email send error:", error);
//             }
//           });
//         }
//       } catch (err) {
//         console.error("Error handling payment.failed event:", err);
//       }

//       return res.status(200).json({ success: true });
//     }

//     return res.status(200).json({ success: true });
//   } catch (error) {
//     console.error("WEBHOOK ERROR:", error);
//     return res.status(500).json({ success: false, message: "Webhook error" });
//   }
// };
export { createOrder, razorpayWebhook };

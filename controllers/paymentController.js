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

const razorpayWebhook = async (req, res) => {
  console.log("=== WEBHOOK HIT ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body type:", typeof req.body);
  console.log("Body is Buffer:", Buffer.isBuffer(req.body));
  console.log("All headers:", req.headers);

  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    // Verify secret exists
    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return res
        .status(500)
        .json({ success: false, message: "Server configuration error" });
    }

    const rawBody = req.body.toString("utf8");

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expected !== signature) {
      console.log("Signature verification failed");
      console.log("Expected:", expected);
      console.log("Received:", signature);
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    // Parse the JSON after verification
    const { event, payload } = JSON.parse(rawBody);

    if (event === "payment.captured") {
      const payment = payload.payment.entity;

      let userId, courseIds;
      try {
        userId = payment.notes.userId;
        courseIds = JSON.parse(payment.notes.courseIds);

        // Validate data
        if (!userId || !Array.isArray(courseIds) || courseIds.length === 0) {
          throw new Error("Invalid notes data");
        }
      } catch (err) {
        console.error("Notes parsing error:", err);
        return res
          .status(400)
          .json({ success: false, message: "Invalid notes format" });
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Find user
        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new Error("User not found");
        }

        // Find courses and validate they all exist
        const courses = await Course.find({ _id: { $in: courseIds } }).session(
          session
        );

        if (courses.length !== courseIds.length) {
          throw new Error("Some courses not found");
        }

        // Filter out courses user is already enrolled in
        const newCourseIds = courseIds.filter(
          (id) => !user.enrolledCourses.includes(id.toString())
        );

        if (newCourseIds.length === 0) {
          console.log("User already enrolled in all courses");
          await session.commitTransaction();
          return res
            .status(200)
            .json({ success: true, message: "Already enrolled" });
        }

        const enrolledTitles = [];

        // Update courses with new enrollment
        await Promise.all(
          courses.map((c) => {
            if (newCourseIds.includes(c._id.toString())) {
              enrolledTitles.push(c.title);
              return Course.findByIdAndUpdate(
                c._id,
                { $addToSet: { enrolledStudents: userId } }, // Use $addToSet to avoid duplicates
                { new: true, session }
              );
            }
            return Promise.resolve();
          })
        );

        // Add new courses to user's enrolled list
        user.enrolledCourses.push(...newCourseIds);
        await user.save({ session });

        await session.commitTransaction();

        // Send enrollment email (non-blocking)
        setImmediate(async () => {
          try {
            const htmlBody = enrollmentEmailTemplate(
              user.name,
              payment.amount / 100,
              payment.order_id,
              payment.id,
              enrolledTitles
            );

            await sendEmail(
              user.email,
              "Course Purchase & Enrollment Confirmation - StudyHub",
              htmlBody
            );
          } catch (emailError) {
            console.error("Email send error:", emailError);
          }
        });

        return res.status(200).json({ success: true });
      } catch (err) {
        await session.abortTransaction();
        console.error("Transaction error:", err);
        return res.status(500).json({ success: false, message: err.message });
      } finally {
        session.endSession();
      }
    }

    if (event === "payment.failed") {
      const payment = payload.payment.entity;

      try {
        const user = await User.findById(payment.notes.userId);

        if (user) {
          // Send failure email
          setImmediate(async () => {
            try {
              const reason =
                payment.error_description ||
                payment.error_reason ||
                "Payment processing failed";

              const htmlBody = paymentFailedEmailTemplate(
                user.name,
                payment.amount / 100,
                payment.order_id,
                reason
              );

              await sendEmail(
                user.email,
                "Payment Failed - StudyHub",
                htmlBody
              );
            } catch (emailError) {
              console.error("Email send error:", emailError);
            }
          });
        }
      } catch (err) {
        console.error("Error handling payment.failed event:", err);
      }

      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return res.status(500).json({ success: false, message: "Webhook error" });
  }
};
export { createOrder, razorpayWebhook };

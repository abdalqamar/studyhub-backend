import User from "../models/userModal.js";
import Course from "../models/courseModal.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import enrollmentEmailTemplate from "../template/enrollmentEmailTemplate.js";
import paymentFailedEmailTemplate from "../template/paymentFailedEmailTemplate.js";
import razorpay from "../config/razorpay.js";

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
  try {
    // Verify Razorpay webhook secret
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(req.body.toString());
    const digest = shasum.digest("hex");

    const signature = req.headers["x-razorpay-signature"];

    if (digest !== signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    console.log("Webhook verified:", req.body.event);

    const event = req.body.event;
    const payload = req.body.payload;

    // Only handle successful payments
    if (event === "payment.captured") {
      const payment = payload.payment.entity;

      const notes = payment.notes;
      const userId = notes.userId;
      const courseIds = JSON.parse(notes.courseIds);

      console.log("Enroll User:", userId, "Courses:", courseIds);

      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Enroll user in selected courses
      for (let cid of courseIds) {
        if (!user.enrolledCourses.includes(cid)) {
          user.enrolledCourses.push(cid);

          await Course.findByIdAndUpdate(
            cid,
            { $push: { enrolledStudents: userId } },
            { new: true }
          );
        }
      }

      await user.save();

      console.log("Enrollment success!");

      // Send payment confirmation email
      try {
        const htmlBody = enrollmentEmailTemplate(
          user.name,
          payment.amount / 100,
          payment.order_id,
          payment.id
        );

        await sendEmail(
          user.email,
          "Course Payment Confirmation - StudyHub",
          htmlBody
        );

        console.log("Email sent successfully");
      } catch (emailError) {
        console.log("Email sending failed:", emailError);
      }

      return res.status(200).json({ success: true });
    }

    if (event === "payment.failed") {
      const payment = payload.payment.entity;
      const notes = payment.notes;

      if (notes && notes.userId) {
        const userId = notes.userId;
        const user = await User.findById(userId);

        if (user) {
          console.log(` Payment failed for User: ${user.email}`);

          // Send payment failed email
          try {
            const failureReason =
              payment.error_description || "Payment processing failed";

            const htmlBody = paymentFailedEmailTemplate(
              user.name,
              payment.amount / 100,
              payment.order_id,
              failureReason
            );

            await sendEmail(user.email, "Payment Failed - StudyHub", htmlBody);

            console.log(" Payment failure email sent to:", user.email);
          } catch (emailError) {
            console.error("Failed email sending error:", emailError.message);
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: "Payment failure recorded",
      });
    }

    // Acknowledge other events
    return res.status(200).json({
      success: true,
      message: "Event received",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ success: false });
  }
};

export { createOrder, razorpayWebhook };

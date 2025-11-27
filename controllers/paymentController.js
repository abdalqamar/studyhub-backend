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
  console.log("WEBHOOK HIT");

  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expected = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (expected !== signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const { event, payload } = JSON.parse(req.body);

    if (event === "payment.captured") {
      const payment = payload.payment.entity;

      let userId, courseIds;
      try {
        userId = payment.notes.userId;
        courseIds = JSON.parse(payment.notes.courseIds);
      } catch {
        return res.status(400).json({ message: "Invalid notes format" });
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const user = await User.findById(userId).session(session);
        if (!user) throw new Error("User not found");

        const courses = await Course.find({ _id: { $in: courseIds } }).session(
          session
        );

        const enrolledTitles = [];

        await Promise.all(
          courses.map((c) => {
            enrolledTitles.push(c.title);
            return Course.findByIdAndUpdate(
              c._id,
              { $push: { enrolledStudents: userId } },
              { new: true, session }
            );
          })
        );

        user.enrolledCourses.push(...courseIds);
        await user.save({ session });

        await session.commitTransaction();

        (async () => {
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
          } catch {}
        })();

        return res.status(200).json({ success: true });
      } catch (err) {
        await session.abortTransaction();
        return res.status(500).json({ success: false });
      }
    }

    if (event === "payment.failed") {
      const payment = payload.payment.entity;
      const user = await User.findById(payment.notes.userId);

      if (user) {
        (async () => {
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

          await sendEmail(user.email, "Payment Failed - StudyHub", htmlBody);
        })();
      }

      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ success: false });
  }
};

export { createOrder, razorpayWebhook };

import Razorpay from "razorpay";
import User from "../models/userModal.js";
import Course from "../models/courseModal.js";
import crypto from "crypto";

const createOrder = async (req, res) => {
  try {
    const { courseIds } = req.body;
    const userId = req.user.id;

    // 1. Course validation
    if (!courseIds || courseIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Please select at least one course." });
    }

    const user = await User.findById(userId);

    let totalAmount = 0;
    const validCourses = [];

    for (let cid of courseIds) {
      const course = await Course.findById(cid);
      if (!course) {
        return res.status(404).json({ message: `Course ${cid} not found.` });
      }

      // 2. Already enrolled check
      if (user.enrolledCourses.includes(cid)) {
        return res
          .status(400)
          .json({ message: `Already enrolled in ${course.title}.` });
      }

      validCourses.push(course);
      totalAmount += course.price;
    }

    // 3. Razorpay Order Create
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: totalAmount * 100, // INR → paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId,
        courseIds: JSON.stringify(courseIds),
      },
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: totalAmount,
      currency: "INR",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export { createOrder };

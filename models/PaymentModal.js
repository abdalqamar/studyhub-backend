import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["stripe", "paypal", "razorpay", "manual"],
      default: "razorpay",
    },
    transactionId: {
      type: String,
      default: null,
    },
    paymentGatewayOrderId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;

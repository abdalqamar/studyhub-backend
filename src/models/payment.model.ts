import mongoose from "mongoose";
import { IPayment } from "../types/payment.types.js";

const paymentSchema = new mongoose.Schema(
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
      unique: true,
      sparse: true,
    },
    paymentGatewayOrderId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
export default Payment;

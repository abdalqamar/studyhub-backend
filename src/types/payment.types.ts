import mongoose from "mongoose";

export interface IPayment {
  user: mongoose.Types.ObjectId;
  instructor: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "refunded";
  paymentMethod: "stripe" | "paypal" | "razorpay" | "manual";
  transactionId: string;
  paymentGatewayOrderId: string;
  createdAt: Date;
  updatedAt: Date;
}

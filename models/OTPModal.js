import mongoose from "mongoose";
import sendEmail from "../utils/sendEmail.js";
import emailVerificationTemplate from "../template/emailVerificationTemplate.js";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000),
      index: { expires: 0 },
    },
  },
  { timestamps: true },
);

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;

import mongoose, { Document } from "mongoose";

export interface IPendingSignup extends Document {
  email: string;
  firstName: string;
  lastName?: string;
  password: string;
  createdAt: Date;
}

const pendingSignupSchema = new mongoose.Schema<IPendingSignup>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  firstName: { type: String, required: true },
  lastName: { type: String },
  password: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now, expires: 600 },
});

export default mongoose.model<IPendingSignup>(
  "PendingSignup",
  pendingSignupSchema,
);

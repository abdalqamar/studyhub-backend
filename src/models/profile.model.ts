import mongoose from "mongoose";
import { IProfile } from "../types/profile.types.js";

const profileSchema = new mongoose.Schema({
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },
  dateOfBirth: {
    type: String,
  },
  contactNumber: {
    type: Number,
    trim: true,
  },
  about: {
    type: String,
    trim: true,
  },
  profileImage: {
    type: String,
  },
});

const Profile = mongoose.model<IProfile>("Profile", profileSchema);
export default Profile;

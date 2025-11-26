import mongoose from "mongoose";

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

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;

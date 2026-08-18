import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import {
  uploadWithRollback,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { AppError } from "../utils/AppError.js";
import { UpdateProfileDTO } from "../types/profile.types.js";

export const updateProfile = async (
  userId: string,
  fields: UpdateProfileDTO,
) => {
  const { firstName, lastName, dateOfBirth, contactNumber, about, gender } =
    fields;

  const hasUpdate = [
    firstName,
    lastName,
    dateOfBirth,
    contactNumber,
    about,
    gender,
  ].some(Boolean);
  if (!hasUpdate)
    throw new AppError(400, "At least one field is required to update");

  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");

  if (firstName || lastName) {
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    await user.save();
  }

  const updatedProfile = await Profile.findByIdAndUpdate(
    user.additionalInformation,
    { gender, dateOfBirth, contactNumber, about },
    { new: true },
  );
  if (!updatedProfile) throw new AppError(404, "Profile not found");

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    profileImage: updatedProfile.profileImage,
    gender: updatedProfile.gender,
    dateOfBirth: updatedProfile.dateOfBirth,
    contactNumber: updatedProfile.contactNumber,
    about: updatedProfile.about,
  };
};

export const updateProfileImage = async (
  userId: string,
  imageFile: Express.Multer.File | null,
) => {
  if (!imageFile) throw new AppError(400, "Profile image is required");

  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");

  const profile = await Profile.findById(user.additionalInformation);
  const oldUrl = profile?.profileImage;
  // Don't delete dicebear default avatars
  const isCustomImage = oldUrl && !oldUrl.includes("dicebear.com");

  const { uploadResult, rollback } = await uploadWithRollback(imageFile.path);

  let updatedProfile;
  try {
    updatedProfile = await Profile.findByIdAndUpdate(
      user.additionalInformation,
      { profileImage: uploadResult.secure_url },
      { new: true },
    );
  } catch (dbErr) {
    await rollback();
    throw dbErr;
  }

  // Delete old custom image after successful DB save
  if (isCustomImage) {
    deleteFromCloudinary(oldUrl).catch(() => null);
  }

  return updatedProfile;
};

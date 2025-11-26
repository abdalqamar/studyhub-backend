import OTP from "../models/OTPModal.js";
import otpGenerator from "otp-generator";

const generateUniqueOTP = async (email) => {
  const maxRetries = 3;
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    try {
      // Atomic operation: Create only if OTP doesn't exist
      const otpPayload = {
        email,
        otp,
      };

      // This will throw error if OTP already exists (unique index on otp field)
      const otpBody = await OTP.create(otpPayload);

      console.log(`Unique OTP generated: ${otp} (Attempt ${attempts})`);
      return { otp, otpBody };
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key error
        console.log(
          `OTP ${otp} already exists. Retrying... (Attempt ${attempts})`
        );
        continue; // Try again with new OTP
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Failed to generate unique OTP after ${maxRetries} attempts`);
};

export default generateUniqueOTP;

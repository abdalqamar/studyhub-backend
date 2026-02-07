import OTP from "../models/OTPModal.js";
import otpGenerator from "otp-generator";

const isDevelopment = process.env.NODE_ENV !== "production";

const generateUniqueOTP = async (
  email,
  otpLength = parseInt(process.env.OTP_LENGTH || "6"),
  expirationMinutes = parseInt(process.env.OTP_EXPIRATION_MINUTES || "5"),
) => {
  // Input validation
  if (!email || typeof email !== "string") {
    throw new Error("Invalid email provided");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new Error("Invalid email format");
  }

  if (otpLength < 4 || otpLength > 8) {
    throw new Error("OTP length must be between 4 and 8");
  }

  const maxRetries = 3;
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;

    // Generate OTP
    const otp = otpGenerator.generate(otpLength, {
      digits: true,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    try {
      // Calculate expiration time
      const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

      // Create only if OTP doesn't exist
      const otpPayload = {
        email: email.toLowerCase().trim(),
        otp,
        expiresAt,
        createdAt: new Date(),
      };

      // This will throw error if OTP already exists
      const otpBody = await OTP.create(otpPayload);

      if (isDevelopment) {
        console.log(
          `Unique OTP generated for ${email}: OTP length ${otpLength} (Attempt ${attempts})`,
        );
      }
      return { otp, otpBody };
    } catch (error) {
      if (error.code === 11000) {
        // OTP already exists for this email
        if (isDevelopment) {
          console.log(
            `OTP already exists for ${email}. Retrying... (Attempt ${attempts}/${maxRetries})`,
          );
        }
        continue; // Try again with new OTP
      } else {
        if (isDevelopment) {
          console.error(`Error generating OTP for ${email}:`, error.message);
        }
        throw error;
      }
    }
  }

  throw new Error(
    `Failed to generate unique OTP after ${maxRetries} attempts for ${email}. Please try again later.`,
  );
};

export default generateUniqueOTP;

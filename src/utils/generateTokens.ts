import jwt, { SignOptions } from "jsonwebtoken";
import { TokenPayload } from "../types/auth.types.js";

const generateTokens = (payload: TokenPayload) => {
  const accessOptions: SignOptions = {
    expiresIn: process.env.JWT_ACCESS_EXPIRE as SignOptions["expiresIn"],
  };

  const refreshOptions: SignOptions = {
    expiresIn: process.env.JWT_REFRESH_EXPIRE as SignOptions["expiresIn"],
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET!,
    accessOptions,
  );
  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET!,
    refreshOptions,
  );

  return { accessToken, refreshToken };
};

export default generateTokens;

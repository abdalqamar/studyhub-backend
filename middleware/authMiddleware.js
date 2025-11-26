import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    console.log("token", token);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, Authorization denied",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired, please login again",
        expired: true,
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

const isStudent = async (req, res, next) => {
  if (!req.user?.role === "student") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Students only",
    });
  }
  next();
};
const isInstructor = async (req, res, next) => {
  if (!req.user?.role === "instructor") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Instructor only",
    });
  }
  next();
};
const isAdmin = async (req, res, next) => {
  if (!req.user?.role === "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin only",
    });
  }
  next();
};

export { isAuthenticated, isStudent, isInstructor, isAdmin };

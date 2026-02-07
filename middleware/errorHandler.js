const isDevelopment = process.env.NODE_ENV !== "production";

export default function errorHandler(err, req, res, next) {
  if (isDevelopment) {
    console.error("Unhandled route error:", err);
  } else {
    console.error(err && err.message ? err.message : err);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  const payload = {
    success: false,
    message: status === 500 ? "Internal server error" : message,
  };

  if (isDevelopment) {
    payload.error = {
      message: err.message,
      stack: err.stack,
    };
  }

  res.status(status).json(payload);
}

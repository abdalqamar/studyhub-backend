const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : [];

const isProd = process.env.NODE_ENV === "production";

// Local dev me localhost allow.
if (!isProd) {
  allowedOrigins.push("http://localhost:5173");
}

export default {
  origin: (origin, callback) => {
    // Postman.
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const err = new Error("CORS_NOT_ALLOWED");
    err.status = 403;
    return callback(err);
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: [
    "Authorization",
    "Content-Type",
    "Accept",
    "Origin",
    "X-Requested-With",
    "X-CSRF-Token",
    "X-Request-Id",
  ],
  maxAge: 86400,
};

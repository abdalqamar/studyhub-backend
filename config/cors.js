console.log("CORS ENV:", process.env.CORS_ORIGINS);

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : [];

const isProd = process.env.NODE_ENV === "production";

// Local dev me localhost allow
if (!isProd) {
  allowedOrigins.push("http://localhost:5173");
}

export default {
  origin: (origin, callback) => {
    // Postman
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS_NOT_ALLOWED"));
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Authorization", "Content-Type"],
  maxAge: 86400,
};

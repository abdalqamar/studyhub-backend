import { CorsOptions } from "cors";

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : [];

const isProd = process.env.NODE_ENV === "production";

if (!isProd) {
  allowedOrigins.push("http://localhost:5173");
}

if (isProd && allowedOrigins.length === 0) {
  console.warn(
    "[CORS] WARNING: CORS_ORIGINS env var is not set in production. " +
      "All cross-origin browser requests will be blocked. " +
      "Set CORS_ORIGINS to a comma-separated list of allowed origins (e.g. https://studyhubedu.online).",
  );
}

const corsConfig: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS_NOT_ALLOWED"));
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
  maxAge: 7200,
};

export default corsConfig;

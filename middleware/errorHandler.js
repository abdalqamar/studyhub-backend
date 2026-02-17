const isDevelopment = process.env.NODE_ENV !== "production";

const DEFAULT_TYPE = "about:blank";
const STATUS_TITLES = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
};

const normalizeStatus = (rawStatus) => {
  const status = Number(rawStatus);
  if (!Number.isInteger(status) || status < 400 || status > 599) {
    return 500;
  }
  return status;
};

export default function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (isDevelopment) {
    console.error("Unhandled route error:", err);
  } else {
    console.error(err && err.message ? err.message : err);
  }

  const status = normalizeStatus(err?.status || err?.statusCode);
  const title = err?.title || STATUS_TITLES[status] || "Error";
  const detail =
    status === 500
      ? "An unexpected error occurred."
      : err?.detail || err?.message || title;

  const problem = {
    type: err?.type || DEFAULT_TYPE,
    title,
    status,
    detail,
    instance: req.originalUrl,
  };

  if (isDevelopment) {
    problem.traceId = req.headers["x-request-id"] || null;
    problem.stack = err?.stack || null;
  }

  return res
    .status(status)
    .set("Content-Type", "application/problem+json")
    .json(problem);
}

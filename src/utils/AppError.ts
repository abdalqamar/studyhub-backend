export class AppError extends Error {
  statusCode: number;
  status: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode;
    this.name = "AppError";
  }
}

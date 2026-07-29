export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly fieldErrors: Record<string, string[]> | null;

  constructor(
    message: string,
    status = 500,
    code = 'INTERNAL_ERROR',
    fieldErrors: Record<string, string[]> | null = null,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

import * as Cause from "effect/Cause";
import * as Option from "effect/Option";

export type AppErrorType = "Auth" | "Database" | "Network";

export type AppErrorTag =
  | "MissingEnvError"
  | "SupabaseAuthError"
  | "HttpError"
  | "TimeoutError"
  | "UnexpectedError";

type AppErrorOptions = {
  readonly cause?: unknown;
  readonly status?: number;
  readonly code?: AppErrorTag;
  readonly retryable?: boolean;
};

const defaultCodeByType = (type: AppErrorType): AppErrorTag => {
  switch (type) {
    case "Auth":
      return "SupabaseAuthError";
    case "Database":
    case "Network":
      return "UnexpectedError";
    default:
      return "UnexpectedError";
  }
};

const isAppErrorOptions = (value: unknown): value is AppErrorOptions =>
  Boolean(
    value &&
      typeof value === "object" &&
      ("cause" in value || "status" in value || "code" in value || "retryable" in value),
  );

export class AppError extends Error {
  readonly _tag: AppErrorTag;
  readonly type: AppErrorType;
  readonly cause?: unknown;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(type: AppErrorType, message: string, cause?: unknown);
  constructor(type: AppErrorType, message: string, options?: AppErrorOptions);
  constructor(type: AppErrorType, message: string, causeOrOptions?: unknown) {
    
    super(message);
    this.name = "AppError";
    this.type = type;

    const options = isAppErrorOptions(causeOrOptions)
      ? causeOrOptions
      : { cause: causeOrOptions };

    this.cause = options.cause;
    this.status = options.status;
    this._tag = options.code ?? defaultCodeByType(type);
    this.retryable =
      options.retryable ??
      (this._tag === "TimeoutError" || this._tag === "UnexpectedError");
  }

  static fromUnknown(type: AppErrorType, cause: unknown, fallbackMessage: string): AppError {
    if (cause instanceof AppError) {
      return cause;
    }

    if (cause instanceof Error) {
      return new AppError(type, cause.message || fallbackMessage, {
        cause,
        code: defaultCodeByType(type),
      });
    }

    return new AppError(type, fallbackMessage, {
      cause,
      code: defaultCodeByType(type),
    });
  }
}

export const appError = {
  missingEnv: (message: string): AppError =>
    new AppError("Network", message, { code: "MissingEnvError", retryable: false }),
  supabaseAuth: (message: string): AppError =>
    new AppError("Auth", message, { code: "SupabaseAuthError", retryable: false }),
  http: (status: number, message: string): AppError =>
    new AppError("Network", message, { code: "HttpError", status, retryable: false }),
  timeout: (message: string): AppError =>
    new AppError("Network", message, { code: "TimeoutError", retryable: true }),
  unexpected: (cause: unknown, message = "Unexpected error"): AppError =>
    new AppError("Network", message, {
      cause,
      code: "UnexpectedError",
      retryable: true,
    }),
};

export function formatAppError(error: AppError): string {
  switch (error._tag) {
    case "HttpError":
      return `${error.message} (HTTP ${error.status ?? "unknown"})`;
    case "MissingEnvError":
    case "SupabaseAuthError":
    case "TimeoutError":
    case "UnexpectedError":
      return error.message;
    default:
      return "Unknown application error";
  }
}

export const appErrorMessage = formatAppError;

export const toFailureError =
  (type: AppErrorType, message: string) =>
  (cause: Cause.Cause<AppError>): AppError =>
    Option.match(Cause.failureOption(cause), {
      onNone: () => new AppError(type, message, { cause }),
      onSome: (value) => value,
    });

export const isRetryableAppError = (error: AppError): boolean => error.retryable;

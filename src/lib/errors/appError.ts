export type MissingEnvError = {
  readonly _tag: "MissingEnvError";
  readonly message: string;
};

export type SupabaseAuthError = {
  readonly _tag: "SupabaseAuthError";
  readonly message: string;
};

export type HttpError = {
  readonly _tag: "HttpError";
  readonly status: number;
  readonly message: string;
};

export type TimeoutError = {
  readonly _tag: "TimeoutError";
  readonly message: string;
};

export type UnexpectedError = {
  readonly _tag: "UnexpectedError";
  readonly message: string;
  readonly cause?: unknown;
};

export type AppError =
  | MissingEnvError
  | SupabaseAuthError
  | HttpError
  | TimeoutError
  | UnexpectedError;

export const appError = {
  missingEnv: (message: string): MissingEnvError => ({
    _tag: "MissingEnvError",
    message,
  }),
  supabaseAuth: (message: string): SupabaseAuthError => ({
    _tag: "SupabaseAuthError",
    message,
  }),
  http: (status: number, message: string): HttpError => ({
    _tag: "HttpError",
    status,
    message,
  }),
  timeout: (message: string): TimeoutError => ({
    _tag: "TimeoutError",
    message,
  }),
  unexpected: (cause: unknown, message = "Unexpected error"): UnexpectedError => ({
    _tag: "UnexpectedError",
    message,
    cause,
  }),
};

export function formatAppError(error: AppError): string {
  switch (error._tag) {
    case "MissingEnvError":
    case "SupabaseAuthError":
    case "TimeoutError":
      return error.message;
    case "HttpError":
      return `${error.message} (HTTP ${error.status})`;
    case "UnexpectedError":
      return error.message;
    default:
      return "Unknown application error";
  }
}

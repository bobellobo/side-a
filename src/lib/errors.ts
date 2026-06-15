import * as Cause from "effect/Cause";
import * as Data from "effect/Data";
import * as Option from "effect/Option";

export type AppErrorTag =
  | "MissingEnvError"
  | "SupabaseAuthError"
  | "HttpError"
  | "TimeoutError"
  | "UnexpectedError";

type AppErrorPayload = {
  readonly message: string;
  readonly cause?: unknown;
  readonly status?: number;
  readonly retryable: boolean;
};

export class MissingEnvError   extends Data.TaggedError("MissingEnvError")  <AppErrorPayload> {}
export class SupabaseAuthError extends Data.TaggedError("SupabaseAuthError")<AppErrorPayload> {}
export class HttpError         extends Data.TaggedError("HttpError")        <AppErrorPayload> {}
export class TimeoutError      extends Data.TaggedError("TimeoutError")     <AppErrorPayload> {}
export class UnexpectedError   extends Data.TaggedError("UnexpectedError")  <AppErrorPayload> {}

export type AuthError = SupabaseAuthError | UnexpectedError;
export type DiscogsError =
  | MissingEnvError
  | SupabaseAuthError
  | HttpError
  | TimeoutError
  | UnexpectedError;
export type DatabaseError = UnexpectedError;

export const missingEnvError = (message: string): MissingEnvError =>
  new MissingEnvError({ message, retryable: false });

export const supabaseAuthError = (message: string, cause?: unknown): SupabaseAuthError =>
  new SupabaseAuthError({ message, cause, retryable: false });

export const httpError = (status: number, message: string): HttpError =>
  new HttpError({ message, status, retryable: false });

export const timeoutError = (message: string, cause?: unknown): TimeoutError =>
  new TimeoutError({ message, cause, retryable: true });

export const unexpectedError = (
  message = "Unexpected error",
  cause?: unknown,
): UnexpectedError => new UnexpectedError({ message, cause, retryable: true });

export function formatError(error: AuthError | DiscogsError | DatabaseError): string {
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

export const errorMessage = formatError;

export const toAuthFailure =
  (message: string) =>
  (cause: Cause.Cause<AuthError>): AuthError =>
    Option.match(Cause.failureOption(cause), {
      onNone: () => supabaseAuthError(message, cause),
      onSome: (value) => value,
    });

export const toDiscogsFailure =
  (message: string) =>
  (cause: Cause.Cause<DiscogsError>): DiscogsError =>
    Option.match(Cause.failureOption(cause), {
      onNone: () => unexpectedError(message, cause),
      onSome: (value) => value,
    });

export const toDatabaseFailure =
  (message: string) =>
  (cause: Cause.Cause<DatabaseError>): DatabaseError =>
    Option.match(Cause.failureOption(cause), {
      onNone: () => unexpectedError(message, cause),
      onSome: (value) => value,
    });

export const isRetryableError = (error: AuthError | DiscogsError | DatabaseError): boolean =>
  error.retryable;

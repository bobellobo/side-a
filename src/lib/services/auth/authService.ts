import { Eff } from "@/lib/effect/types";
import { AppError } from "@/lib/errors";
import { supabase } from "@/lib/supabase/supabase";
import type { Session } from "@supabase/supabase-js";
import { Context, Layer, pipe } from "effect";
import * as Effect from "effect/Effect";
import { fail, flatMap, succeed, tryPromise } from "effect/Effect";
import * as Linking from "expo-linking";
import { RequestPasswordResetInput, SignInWithEmailInput, SignUpWithEmailInput, UpdatePasswordInput } from "./auth.types";



const toAuthError = (cause: unknown, fallbackMessage: string): AppError => {
  if (cause && typeof cause === "object" && "message" in cause) {
    const message = String(cause.message ?? fallbackMessage);
    return new AppError("Auth", message, cause);
  }

  return AppError.fromUnknown("Network", cause, fallbackMessage);
};

export interface AuthServiceInterface {
  readonly signInWithEmail      : (input: SignInWithEmailInput     ) => Eff<Session, AppError>;
  readonly signUpWithEmail      : (input: SignUpWithEmailInput     ) => Eff<Session | null, AppError>;
  readonly requestPasswordReset : (input: RequestPasswordResetInput) => Eff<void, AppError>;
  readonly updatePassword       : (input: UpdatePasswordInput      ) => Eff<void, AppError>;
}

export const AuthService = Context.GenericTag<AuthServiceInterface>("AuthService");


export const liveAuthServiceLayer = Layer.succeed(AuthService, {
  signInWithEmail: ({email, password}) =>
    pipe(
      tryPromise({
        try: () =>
          supabase.auth.signInWithPassword({ email, password }),
        catch: (cause) => toAuthError(cause, "Unable to sign in right now."),
      }),
      flatMap(({ data, error }) => {
        if (error) {
          return fail(new AppError("Auth", error.message, error));
        }

        if (!data.session) {
          return fail(
            new AppError(
              "Auth",
              "Sign-in succeeded but no active session was returned.",
            ),
          );
        }

        return succeed(data.session);
      }),
    ),
  signUpWithEmail: ({email, password}) =>
    pipe(
      tryPromise({
        try: () => supabase.auth.signUp({ email, password}),
        catch: (cause) => toAuthError(cause, "Unable to sign up right now."),
      }),
      flatMap(({ data, error }) => {
        if (error) {
          return fail(new AppError("Auth", error.message, error));
        }

        return succeed(data.session ?? null);
      })
    ),
  requestPasswordReset: (input) =>
    pipe(
      tryPromise({
        try: () =>
          supabase.auth.resetPasswordForEmail(input.email, {
            redirectTo: Linking.createURL("/reset-password"),
          }),
        catch: (cause) =>
          AppError.fromUnknown("Network", cause, "Unable to send reset email right now."),
      }),
      flatMap(({ error }) =>
        error ? fail(new AppError("Auth", error.message, error)) : Effect.void,
      )
    ),
  updatePassword: (input) =>
    pipe(
      tryPromise({
        try: () => supabase.auth.updateUser({ password: input.password }),
        catch: (cause) =>
          AppError.fromUnknown("Network", cause, "Unable to update password right now."),
      }),
      flatMap(({ error }) =>
        error ? fail(new AppError("Auth", error.message, error)) : Effect.void,
      )
    ),
});



export const signInWithEmail = (input: SignInWithEmailInput): Eff<Session, AppError> => 
  pipe(
    AuthService,
    Effect.flatMap((service) => service.signInWithEmail(input)),
    Effect.provide(liveAuthServiceLayer)
  );

export const signUpWithEmail = (input: SignUpWithEmailInput): Eff<Session | null, AppError> =>
  pipe(
    AuthService,
    Effect.flatMap((service) => service.signUpWithEmail(input)),
    Effect.provide(liveAuthServiceLayer)
  );

export const requestPasswordReset = ( input: RequestPasswordResetInput ): Eff<void, AppError> =>
  pipe(
    AuthService,
    Effect.flatMap((service) => service.requestPasswordReset(input)),
    Effect.provide(liveAuthServiceLayer)
  );

export const updatePassword = ( input: UpdatePasswordInput ): Eff<void, AppError> =>
  pipe(
    AuthService,
    Effect.flatMap((service) => service.updatePassword(input)),
    Effect.provide(liveAuthServiceLayer)
  );

import { AppError } from "@/lib/errors";
import { supabase } from "@/lib/supabase/supabase";
import type { Session } from "@supabase/supabase-js";
import { Effect, pipe } from "effect";
import * as Linking from "expo-linking";
import { SignInWithEmailInput, SignUpWithEmailInput, RequestPasswordResetInput, UpdatePasswordInput } from "./auth.types";
import { Eff } from "@/lib/effect/types";
import { fail, flatMap, succeed, tryPromise } from "effect/Effect";



const toAuthError = (cause: unknown, fallbackMessage: string): AppError => {
  if (cause && typeof cause === "object" && "message" in cause) {
    const message = String(cause.message ?? fallbackMessage);
    return new AppError("Auth", message, cause);
  }

  return AppError.fromUnknown("Network", cause, fallbackMessage);
};



export const signInWithEmail = (input: SignInWithEmailInput): Eff<Session, AppError> =>
  pipe(
    tryPromise({
      try: () =>
        supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        }),
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
          )
        );
      }

      return succeed(data.session);
    })
  );

export const signUpWithEmail = (
  input: SignUpWithEmailInput,
): Eff<Session | null, AppError> =>
  pipe(
    tryPromise({
      try: () =>
        supabase.auth.signUp({
          email: input.email,
          password: input.password,
        }),
      catch: (cause) => toAuthError(cause, "Unable to sign up right now."),
    }),
    flatMap(({ data, error }) => {
      if (error) {
        return fail(new AppError("Auth", error.message, error));
      }

      return succeed(data.session ?? null); 
    })
  );

export const requestPasswordReset = ( input: RequestPasswordResetInput ): Eff<void, AppError> =>
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
      error 
          ? fail(new AppError("Auth", error.message, error)) 
          : Effect.void
    )
  );

export const updatePassword = ( input: UpdatePasswordInput ): Eff<void, AppError> =>
  pipe(
    tryPromise({
      try: () => supabase.auth.updateUser({ password: input.password }),
      catch: (cause) =>
        AppError.fromUnknown("Network", cause, "Unable to update password right now."),
    }),
    flatMap( ({ error }) => 
      error 
          ? fail(new AppError("Auth", error.message, error)) 
          : Effect.void
    )
  );

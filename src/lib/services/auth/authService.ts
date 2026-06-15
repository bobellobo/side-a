import { Eff } from "@/lib/effect/types";
import { AuthError, supabaseAuthError, unexpectedError } from "@/lib/errors";
import { supabase } from "@/lib/supabase/supabase";
import type { Session } from "@supabase/supabase-js";
import { Context, Layer, pipe } from "effect";
import * as Effect from "effect/Effect";
import { fail, flatMap, succeed, tryPromise } from "effect/Effect";
import * as Linking from "expo-linking";
import { RequestPasswordResetInput, SignInWithEmailInput, SignUpWithEmailInput, UpdatePasswordInput } from "./auth.types";

export interface AuthServiceInterface {
  readonly signInWithEmail      : (input: SignInWithEmailInput     ) => Eff<Session, AuthError>;
  readonly signUpWithEmail      : (input: SignUpWithEmailInput     ) => Eff<Session | null, AuthError>;
  readonly requestPasswordReset : (input: RequestPasswordResetInput) => Eff<void, AuthError>;
  readonly updatePassword       : (input: UpdatePasswordInput      ) => Eff<void, AuthError>;
}

export const AuthService = Context.GenericTag<AuthServiceInterface>("AuthService");


export const liveAuthServiceLayer = Layer.succeed(AuthService, {
  signInWithEmail: ({email, password}) =>
    pipe(
      tryPromise({
        try: () =>
          supabase.auth.signInWithPassword({ email, password }),
        catch: (cause) => unexpectedError("Unable to sign in right now.", cause),
      }),
      flatMap(({ data, error }) => {
        if (error) {
          return fail(supabaseAuthError(error.message, error));
        }

        if (!data.session) {
          return fail(
            supabaseAuthError("Sign-in succeeded but no active session was returned."),
          );
        }

        return succeed(data.session);
      }),
    ),
  signUpWithEmail: ({email, password}) =>
    pipe(
      tryPromise({
        try: () => supabase.auth.signUp({ email, password}),
        catch: (cause) => unexpectedError("Unable to sign up right now.", cause),
      }),
      flatMap(({ data, error }) => {
        if (error) {
          return fail(supabaseAuthError(error.message, error));
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
          unexpectedError("Unable to send reset email right now.", cause),
      }),
      flatMap(({ error }) =>
        error ? fail(supabaseAuthError(error.message, error)) : Effect.void,
      )
    ),
  updatePassword: (input) =>
    pipe(
      tryPromise({
        try: () => supabase.auth.updateUser({ password: input.password }),
        catch: (cause) =>
          unexpectedError("Unable to update password right now.", cause),
      }),
      flatMap(({ error }) =>
        error ? fail(supabaseAuthError(error.message, error)) : Effect.void,
      )
    ),
});



export const signInWithEmail = (input: SignInWithEmailInput): Eff<Session, AuthError> => 
  pipe(
    AuthService,
    Effect.flatMap((service) => service.signInWithEmail(input)),
    Effect.provide(liveAuthServiceLayer)
  );

export const signUpWithEmail = (input: SignUpWithEmailInput): Eff<Session | null, AuthError> =>
  pipe(
    AuthService,
    Effect.flatMap((service) => service.signUpWithEmail(input)),
    Effect.provide(liveAuthServiceLayer)
  );

export const requestPasswordReset = ( input: RequestPasswordResetInput ): Eff<void, AuthError> =>
  pipe(
    AuthService,
    Effect.flatMap((service) => service.requestPasswordReset(input)),
    Effect.provide(liveAuthServiceLayer)
  );

export const updatePassword = ( input: UpdatePasswordInput ): Eff<void, AuthError> =>
  pipe(
    AuthService,
    Effect.flatMap((service) => service.updatePassword(input)),
    Effect.provide(liveAuthServiceLayer)
  );

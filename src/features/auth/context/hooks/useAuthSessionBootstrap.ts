import { Eff } from "@/lib/effect/types";
import { AuthError, SupabaseAuthError, UnexpectedError, supabaseAuthError, unexpectedError } from "@/lib/errors";
import { supabase } from "@/lib/supabase/supabase";
import type { Session } from "@supabase/supabase-js";
import { Effect, Fiber, pipe } from "effect";
import { useEffect } from "react";

import type { AuthAction } from "../types";

const toAuthError = (cause: unknown): AuthError => {
  if (cause instanceof SupabaseAuthError || cause instanceof UnexpectedError) {
    return cause;
  }

  return unexpectedError("Unable to read persisted auth session.", cause);
};


const bootstrap: Eff<Session | null, AuthError> = pipe(
  Effect.tryPromise({
    try: async () => {
      const response = await supabase.auth.getSession();

      if (response.error) {
        throw supabaseAuthError(response.error.message, response.error);
      }

      return response.data.session;
    },
    catch: toAuthError,
  })
);


export const useAuthSessionBootstrap = ( dispatch: React.Dispatch<AuthAction>): void => {

  useEffect(() => {

    const handleSessionBootstrap = bootstrap.pipe(
      Effect.match({
        onFailure: ( error ) => {
          dispatch({ _tag: "AUTH_ERROR", error });
        },
        onSuccess: ( session ) => {
          dispatch({ _tag: "BOOTSTRAP_SUCCESS", session });
        }
      })
    );

    const fiber = Effect.runFork(handleSessionBootstrap);

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      dispatch({ _tag: "AUTH_EVENT", event, session });
    });

    return () => {
      data.subscription.unsubscribe();
      Effect.runSync( Fiber.interruptFork(fiber) );
    };

  }, [dispatch]);

};

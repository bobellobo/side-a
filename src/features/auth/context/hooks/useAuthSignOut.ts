import { Eff } from "@/lib/effect/types";
import { AuthError, supabaseAuthError, unexpectedError } from "@/lib/errors";
import { supabase } from "@/lib/supabase/supabase";
import { Effect } from "effect";
import { useCallback } from "react";

import { fail, flatMap, tryPromise } from "effect/Effect";
import type { AuthAction } from "../types";


const signOutEffect: Eff<void, AuthError> = tryPromise({
  try: () => supabase.auth.signOut(),
  catch: (cause) => unexpectedError("Unable to sign out.", cause),
}).pipe(
  flatMap(({ error }) =>
    error 
      ? fail(supabaseAuthError(error.message, error)) 
      : Effect.void
  )
);

export const useAuthSignOut = (dispatch: React.Dispatch<AuthAction>): (() => Promise<void>) =>
  useCallback(() => {
    const program = signOutEffect.pipe(
      Effect.match({
        onFailure: (error) => {
          dispatch({ _tag: "AUTH_ERROR", error });
        },
        onSuccess: () => {
          // Note: Usually Supabase's onAuthStateChange will trigger a sign-out eventautomatically, but if specific dispatch is needed add it here.
        },
      })
    );

    return Effect.runPromise(program);
    
  }, [dispatch]);
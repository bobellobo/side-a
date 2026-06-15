import { AppError } from "@/lib/errors";
import { supabase } from "@/lib/supabase/supabase";
import { Effect } from "effect";
import { useCallback } from "react";

import type { AuthAction } from "../types";
import { fail, flatMap, tryPromise } from "effect/Effect";


const signOutEffect = tryPromise({
  try: () => supabase.auth.signOut(),
  catch: (cause) => new AppError("Network", "Unable to sign out.", cause),
}).pipe(
  flatMap(({ error }) =>
    error 
      ? fail(new AppError("Auth", error.message, error)) 
      : Effect.void
  )
);

export const useAuthSignOut = (dispatch: React.Dispatch<AuthAction>): (() => Promise<void>) =>
  useCallback(() => {
    const program = signOutEffect.pipe(
      Effect.match({
        onFailure: (appError) => {
          dispatch({ _tag: "AUTH_ERROR", error: appError });
        },
        onSuccess: () => {
          // Note: Usually Supabase's onAuthStateChange will trigger a sign-out eventautomatically, but if specific dispatch is needed add it here.
        },
      })
    );

    return Effect.runPromise(program);
    
  }, [dispatch]);
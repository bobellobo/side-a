import { AppError } from "@/lib/errors";
import { supabase } from "@/lib/supabase/supabase";
import { Effect, pipe, Fiber } from "effect";
import { useEffect } from "react";

import type { AuthAction } from "../types";
import { flatMap } from "effect/Effect";



const bootstrap = pipe(
  Effect.tryPromise({
    try: () => supabase.auth.getSession(), 
    catch: (cause) =>    AppError.fromUnknown("Network", cause, "Unable to read persisted auth session.")
  }),
  flatMap( response => 
    response.error 
      ? Effect.fail( new AppError("Auth", response.error.message, response.error) ) 
      : Effect.succeed(response.data.session)
  )
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

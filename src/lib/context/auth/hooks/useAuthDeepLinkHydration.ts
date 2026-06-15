import { AppError } from "@/lib/errors";
import { supabase } from "@/lib/supabase/supabase";
import { Effect, pipe, Option, Fiber } from "effect";
import * as A from "effect/Array";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";

import type { AuthAction } from "../types";
import { Eff } from "@/lib/effect/types";
import { catchAll, ensuring, flatMap, map, tryPromise } from "effect/Effect";


const authParams = ["code", "access_token", "refresh_token", "token_hash", "type"];

const isAuthLink = (url: string): boolean => {
  const parsed = Linking.parse(url);
  const queryKeys = Object.keys(parsed.queryParams ?? {});
  return pipe(
    A.intersection( queryKeys, authParams ),
    A.isNonEmptyReadonlyArray
  );
};

const exchangeSessionEffect = (url: string): Eff<void, AppError> =>
  pipe(
    tryPromise({
      try: () => supabase.auth.exchangeCodeForSession(url),
      catch: (cause) =>
        AppError.fromUnknown("Network", cause, "Unable to process authentication link."),
    }),
    flatMap(({ error }) =>
      error
        ? Effect.fail(new AppError("Auth", error.message, error))
        : Effect.void,
    ),
  );

// Retrieve the initial URL from Expo Linking
const getInitialUrlEffect: Eff<Option.Option<string>, AppError> = pipe(
  tryPromise({
    try: () => Linking.getInitialURL(),
    catch: (cause) => AppError.fromUnknown("Network", cause, "Unable to read initial URL for deep link hydration.")
  }),
  map(Option.fromNullable)
);





export const useAuthDeepLinkHydration = (dispatch: React.Dispatch<AuthAction>): boolean => {
 
  const [isLinkHydrating, setIsLinkHydrating] = useState(true);

  useEffect(() => {
    
    const handleUrlChange = (url: string) => {

        if (!isAuthLink(url)) return Effect.void;

        return exchangeSessionEffect(url).pipe(
          Effect.match({
            onFailure: (appError) => dispatch({ _tag: "AUTH_ERROR", error: appError }),
            onSuccess: () => {} // Handled by Supabase auth state change listener
          })
        );
    };

  
    const bootstrapProgram = pipe(
      getInitialUrlEffect,
      flatMap(
        Option.match({
          onNone: () => Effect.void,
          onSome: (url) => handleUrlChange(url)
        })
      ),
      ensuring(Effect.sync(() => setIsLinkHydrating(false))),
      catchAll(() => Effect.void) 
    );

    const bootstrapFiber = Effect.runFork(bootstrapProgram);

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void Effect.runPromise(handleUrlChange(url));
    });

    return () => {
      subscription.remove();
      Effect.runSync(Fiber.interruptFork(bootstrapFiber));

    };
  }, [dispatch]);

  return isLinkHydrating;
};
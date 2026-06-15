import { AppError } from "@/lib/errors";
import { supabase } from "@/lib/supabase/supabase";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Effect, Fiber, Option, pipe } from "effect";
import * as A from "effect/Array";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";

import { Eff } from "@/lib/effect/types";
import { catchAll, ensuring, flatMap, map, tryPromise } from "effect/Effect";
import type { AuthAction } from "../types";


const authParams = ["code", "access_token", "refresh_token", "token_hash", "type"];

const appendSearchParams = (target: URLSearchParams, rawPart: string): void => {
  const normalized = rawPart.startsWith("?") ? rawPart.slice(1) : rawPart;

  if (!normalized) {
    return;
  }

  const queryStart = normalized.indexOf("?");
  const asQuery = queryStart >= 0 ? normalized.slice(queryStart + 1) : normalized;

  new URLSearchParams(asQuery).forEach((value, key) => {
    target.set(key, value);
  });
};

const getAuthParams = (url: string): URLSearchParams => {
  const params = new URLSearchParams();
  const [withoutHash, hashPart = ""] = url.split("#", 2);
  const queryPart = withoutHash.includes("?") ? withoutHash.slice(withoutHash.indexOf("?")) : "";

  appendSearchParams(params, queryPart);
  appendSearchParams(params, hashPart);

  return params;
};

const isAuthLink = (url: string): boolean => {
  const queryKeys = Array.from(getAuthParams(url).keys());
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

const setSessionEffect = (accessToken: string, refreshToken: string): Eff<void, AppError> =>
  pipe(
    tryPromise({
      try: () =>
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }),
      catch: (cause) =>
        AppError.fromUnknown("Network", cause, "Unable to hydrate auth session from recovery link."),
    }),
    flatMap(({ error }) =>
      error
        ? Effect.fail(new AppError("Auth", error.message, error))
        : Effect.void,
    ),
  );

const verifyOtpEffect = (tokenHash: string, type: EmailOtpType): Eff<void, AppError> =>
  pipe(
    tryPromise({
      try: () =>
        supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        }),
      catch: (cause) =>
        AppError.fromUnknown("Network", cause, "Unable to verify recovery token."),
    }),
    flatMap(({ error }) =>
      error
        ? Effect.fail(new AppError("Auth", error.message, error))
        : Effect.void,
    ),
  );

const hydrateSessionFromAuthUrl = (url: string): Eff<void, AppError> => {
  const params = getAuthParams(url);
  const code = params.get("code");
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");

  if (code) {
    return exchangeSessionEffect(url);
  }

  if (accessToken && refreshToken) {
    return setSessionEffect(accessToken, refreshToken);
  }

  if (tokenHash && type === "recovery") {
    return verifyOtpEffect(tokenHash, type);
  }

  return Effect.void;
};

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

        return hydrateSessionFromAuthUrl(url).pipe(
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
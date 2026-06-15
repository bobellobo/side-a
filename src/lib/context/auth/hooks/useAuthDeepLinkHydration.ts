import {
  AuthError,
  SupabaseAuthError,
  UnexpectedError,
  supabaseAuthError,
  unexpectedError,
} from "@/lib/errors";
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


const isAuthLink = (url: string): boolean => pipe(
  getAuthParams(url),
  (params) => Array.from(params.keys()),
  (keys) => A.intersection(keys, authParams),
  A.isNonEmptyReadonlyArray
);

type SupabaseAuthResponse = {
  readonly error: { readonly message: string } | null;
};

const toAuthError = (fallbackMessage: string, cause: unknown): AuthError => {
  if (cause instanceof SupabaseAuthError || cause instanceof UnexpectedError) {
    return cause;
  }

  return unexpectedError(fallbackMessage, cause);
};

const runSupabaseAuthVoid = (
  operation: () => Promise<SupabaseAuthResponse>,
  fallbackMessage: string,
): Eff<void, AuthError> =>
    tryPromise({
      try: async () => {
        const response = await operation();

        if (response.error) {
          throw supabaseAuthError(response.error.message, response.error);
        }
      },
      catch: (cause) => toAuthError(fallbackMessage, cause),
    })
  


const exchangeSessionEffect = (url: string): Eff<void, AuthError> =>
  runSupabaseAuthVoid(
    () => supabase.auth.exchangeCodeForSession(url),
    "Unable to process authentication link.",
  );

const setSessionEffect = (accessToken: string, refreshToken: string): Eff<void, AuthError> =>
  runSupabaseAuthVoid(
    () =>
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }),
    "Unable to hydrate auth session from recovery link.",
  );

const verifyOtpEffect = (tokenHash: string, type: EmailOtpType): Eff<void, AuthError> =>
  runSupabaseAuthVoid(
    () =>
      supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      }),
    "Unable to verify recovery token.",
  );

const hydrateSessionFromAuthUrl = (url: string): Eff<void, AuthError> => {

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
const getInitialUrlEffect: Eff<Option.Option<string>, AuthError> = pipe(
  tryPromise({
    try: () => Linking.getInitialURL(),
    catch: (cause) => unexpectedError("Unable to read initial URL for deep link hydration.", cause)
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
            onFailure: (error) => dispatch({ _tag: "AUTH_ERROR", error }),
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
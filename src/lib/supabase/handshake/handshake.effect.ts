import { withNetworkPolicy } from "@/lib/effect/policies";
import { AppError, appError } from "@/lib/errors/appError";
import { supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/supabase";
import { pipe } from "effect";
import { all, fail, flatMap, map, succeed, tryPromise } from "effect/Effect";
import { Eff } from "../../effect/types";

export type HandshakeResult = {
  sessionPresent: boolean;
  authHealthStatus: number;
};

const getSessionEffect = pipe(
  tryPromise({
    try: () => supabase.auth.getSession(),
    catch: (cause) => appError.unexpected(cause, "Unable to read local auth session"),
  }),
  flatMap(({ data, error }) => 
    error 
      ? fail(appError.supabaseAuth(error.message))
      : succeed(data)
  )
);

const authHealthEffect = pipe(
  tryPromise({
    try: () =>
      fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      }),
    catch: c => appError.unexpected(c, "Unable to reach Supabase auth health endpoint")
}),
  flatMap(({ ok, status }) => 
    ok
      ? succeed(status)
      : fail(appError.http(status, "Supabase auth health check failed"))
  )
);


export const runHandshakeEffect: Eff<HandshakeResult, AppError> = pipe(
    all({ session: getSessionEffect, status: authHealthEffect }),
    map(({ session, status }) => ({
        sessionPresent: Boolean(session.session),
        authHealthStatus: status,
    })),
    withNetworkPolicy({
      timeoutMs: 7_000,  
      maxRetries: 2,
      baseDelayMs: 250,
    })
);

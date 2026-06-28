import { AuthError } from "@/lib/errors";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

export type AuthStatus = "bootstrapping" | "signedOut" | "signedIn" | "tokenRefreshing";

export type AuthState = {
  readonly status: AuthStatus;
  readonly session: Session | null;
  readonly lastEvent: AuthChangeEvent | null;
  readonly error: AuthError | null;
};

export type AuthAction =
  | { readonly _tag: "BOOTSTRAP_SUCCESS"; readonly session: Session | null }
  | {
      readonly _tag: "AUTH_EVENT";
      readonly event: AuthChangeEvent;
      readonly session: Session | null;
    }
  | { readonly _tag: "AUTH_ERROR"; readonly error: AuthError };

export const initialState: AuthState = {
  status: "bootstrapping",
  session: null,
  lastEvent: null,
  error: null,
};

export type AuthContextValue = {
  readonly status: AuthStatus;
  readonly session: Session | null;
  readonly isAuthenticated: boolean;
  readonly isBootstrapping: boolean;
  readonly error: AuthError | null;
  readonly lastEvent: AuthChangeEvent | null;
  readonly signOut: () => Promise<void>;
};
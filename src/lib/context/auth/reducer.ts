import { AuthAction, AuthState, AuthStatus } from "./types";

export const reduceAuthState = (state: AuthState, action: AuthAction): AuthState => {

  switch (action._tag) {

    case "BOOTSTRAP_SUCCESS":
      return {
        status: action.session ? "signedIn" : "signedOut",
        session: action.session,
        lastEvent: null,
        error: null,
      };

    case "AUTH_EVENT": {
      const status: AuthStatus =
        action.event === "TOKEN_REFRESHED"
          ? "tokenRefreshing"
          : action.session
            ? "signedIn"
            : "signedOut";

      return {
        status,
        session: action.session,
        lastEvent: action.event,
        error: null,
      };
    }
    
    case "AUTH_ERROR":
      return {
        ...state,
        status: state.session ? "signedIn" : "signedOut",
        error: action.error,
      };

    default:
      return state;
  }
};
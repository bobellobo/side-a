import { useRootNavigationState, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import type { AuthState } from "../types";

export const useAuthRouteGuard = (state: AuthState, isLinkHydrating: boolean): void => {
  
  const segments       = useSegments();
  const router         = useRouter();
  const rootNavigation = useRootNavigationState();

  useEffect(() => {

    if (!rootNavigation?.key || state.status === "bootstrapping" || isLinkHydrating) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup  = segments[0] === "(app)";
    const inPasswordRecoveryRoute = inAuthGroup && segments[1] === "reset-password";
    const inSignedOutOnlyRoute    = inAuthGroup && segments[1] === "verify-email";

    if (!state.session && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
      return;
    }

    if (state.session && inSignedOutOnlyRoute) {
      router.replace("/(app)/home");
      return;
    }

    if (state.session && !inAppGroup && !inPasswordRecoveryRoute) {
      router.replace("/(app)/home");
    }
  }, [isLinkHydrating, rootNavigation?.key, router, segments, state.session, state.status]);
};

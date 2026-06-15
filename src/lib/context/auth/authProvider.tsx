import React, { createContext, useContext, useMemo, useReducer } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuthDeepLinkHydration } from "./hooks/useAuthDeepLinkHydration";
import { useAuthRouteGuard } from "./hooks/useAuthRouteGuard";
import { useAuthSessionBootstrap } from "./hooks/useAuthSessionBootstrap";
import { useAuthSignOut } from "./hooks/useAuthSignOut";
import { reduceAuthState } from "./reducer";
import { AuthContextValue, initialState } from "./types";



const AuthContext = createContext<AuthContextValue | null>(null);



export const AuthProvider = ({ children }: { readonly children: React.ReactNode }) => {
  const [ state, dispatch ] = useReducer( reduceAuthState, initialState );
  const isLinkHydrating = useAuthDeepLinkHydration(dispatch);
  useAuthSessionBootstrap(dispatch);
  useAuthRouteGuard(state, isLinkHydrating);
  const signOut = useAuthSignOut(dispatch);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      session: state.session,
      isAuthenticated: Boolean(state.session),
      isBootstrapping: state.status === "bootstrapping",
      error: state.error,
      lastEvent: state.lastEvent,
      signOut,
    }),
    [signOut, state.error, state.lastEvent, state.session, state.status],
  );

  if (state.status === "bootstrapping" || isLinkHydrating) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950 px-6">
        <ActivityIndicator color="#22d3ee" size="large" />
        <Text className="mt-4 text-sm uppercase tracking-[2px] text-cyan-300">
          Restoring session
        </Text>
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
};

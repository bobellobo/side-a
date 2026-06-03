import { useQuery } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

import { supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/supabase";

type HandshakeResult = {
  sessionPresent: boolean;
  authHealthStatus: number;
};

async function runHandshake(): Promise<HandshakeResult> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase auth health check failed with ${response.status}`);
  }

  return {
    sessionPresent: Boolean(data.session),
    authHealthStatus: response.status,
  };
}

export default function Index() {
  const isClientRuntime = typeof window !== "undefined";

  const handshake = useQuery({
    queryKey: ["supabase-handshake"],
    queryFn: runHandshake,
    enabled: isClientRuntime,
  });

  const statusLabel = !isClientRuntime
    ? "Skipped during static render"
    : handshake.isLoading
      ? "Checking connection..."
      : handshake.isError
        ? "Handshake failed"
        : "Supabase is reachable";

  return (
    <View className="flex-1 justify-center bg-slate-50 px-6 py-14">
      <StatusBar style="dark" />
      <Text className="mb-3 text-xs uppercase tracking-widest text-slate-600">Supabase handshake</Text>
      <Text className="mb-3 text-3xl font-bold leading-9 text-slate-900">{statusLabel}</Text>
      <Text className="mb-5 max-w-xl text-base leading-6 text-slate-700">
        This screen verifies that the Supabase client can read local auth state
        and that the auth service responds over the network.
      </Text>

      <View className="max-w-xl gap-2 rounded-2xl border border-slate-200 bg-white p-5">
        <Text className="mt-2 text-xs uppercase tracking-widest text-slate-500">Client</Text>
        <Text className="text-[15px] leading-[22px] text-slate-900">
          Initialized from EXPO_PUBLIC env vars
        </Text>

        <Text className="mt-2 text-xs uppercase tracking-widest text-slate-500">Auth health</Text>
        <Text className="text-[15px] leading-[22px] text-slate-900">
          {handshake.data ? `${handshake.data.authHealthStatus} OK` : "Waiting"}
        </Text>

        <Text className="mt-2 text-xs uppercase tracking-widest text-slate-500">Session in storage</Text>
        <Text className="text-[15px] leading-[22px] text-slate-900">
          {handshake.data ? (handshake.data.sessionPresent ? "Yes" : "No") : "Waiting"}
        </Text>

        <Text className="mt-2 text-xs uppercase tracking-widest text-slate-500">Error</Text>
        <Text className="text-[15px] leading-[22px] text-slate-900">
          {handshake.error instanceof Error ? handshake.error.message : "None"}
        </Text>
      </View>
    </View>
  );
}

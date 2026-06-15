import { useAuth } from "@/lib/context/auth/authProvider";
import { Pressable, Text, View } from "react-native";

export default function HomeScreen() {

  const { session, signOut, status, lastEvent } = useAuth();

  return (
    <View className="flex-1 justify-center bg-slate-50 px-6 py-10">
      <View className="rounded-3xl border border-slate-200 bg-white p-6">
        <Text className="text-xs uppercase tracking-[2px] text-slate-500">Protected Route</Text>
        <Text className="mt-2 text-3xl font-semibold text-slate-900">Welcome back</Text>
        <Text className="mt-3 text-sm leading-6 text-slate-700">
          Signed in as {session?.user.email ?? "unknown user"}
        </Text>

        <View className="mt-5 rounded-2xl border border-slate-200 bg-slate-100 p-4">
          <Text className="text-xs uppercase tracking-widest text-slate-500">Auth status</Text>
          <Text className="mt-1 text-sm text-slate-900">{status}</Text>

          <Text className="mt-3 text-xs uppercase tracking-widest text-slate-500">Last event</Text>
          <Text className="mt-1 text-sm text-slate-900">{lastEvent ?? "None"}</Text>
        </View>

        <Pressable className="mt-6 rounded-xl bg-slate-900 px-4 py-3" onPress={signOut}>
          <Text className="text-center text-base font-semibold text-white">Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

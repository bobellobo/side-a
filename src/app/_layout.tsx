import "../../global.css";

import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { View } from "react-native";



export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <View className="flex-1 bg-slate-100">
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </QueryClientProvider>
  );
}


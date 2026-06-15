import { Link, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

type VerifyEmailParams = {
  readonly email?: string;
};

export default function VerifyEmailScreen() {
    
  const { email } = useLocalSearchParams<VerifyEmailParams>();

  return (
    <View className="flex-1 justify-center bg-slate-950 px-6 py-10">
      <View className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
        <Text className="text-xs uppercase tracking-[2px] text-cyan-300">One last step</Text>
        <Text className="mt-3 text-3xl font-semibold text-white">Verify your email</Text>

        <Text className="mt-3 text-sm leading-6 text-slate-300">
          {email
            ? `We sent a confirmation link to ${email}. Open that link on this device to finish sign up.`
            : "We sent a confirmation link to your email. Open that link on this device to finish sign up."}
        </Text>

        <Text className="mt-5 text-sm leading-6 text-slate-300">
          Once confirmed, you will be redirected automatically to the protected app.
        </Text>

        <Text className="mt-6 text-center text-sm text-slate-300">
          Already verified?{" "}
          <Link className="font-semibold text-cyan-300" href="/(auth)/sign-in">
            Sign in
          </Link>
        </Text>
      </View>
    </View>
  );
}

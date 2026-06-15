import { AppError, appErrorMessage, toFailureError } from "@/lib/errors";
import { requestPasswordReset } from "@/lib/services/auth/authService";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";


const handleFailure = toFailureError("Network", "Something went wrong while sending reset email.");

export default function ForgotPasswordScreen() {

  const [ email,      setEmail      ] = useState("");
  const [ submitting, setSubmitting ] = useState(false);
  const [ error,      setError      ] = useState<AppError | null>(null);
  const [ notice,     setNotice     ] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && !submitting,
    [email, submitting],
  );

  const onSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    // const main = 

    const exit = await Effect.runPromiseExit(
      requestPasswordReset({ email: email.trim() }),
    );

    if (Exit.isFailure(exit)) {
      setError(handleFailure(exit.cause));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setNotice("Password reset email sent. Use the link on this device to continue.");
  };

  return (
    <View className="flex-1 justify-center bg-slate-950 px-6 py-10">
      <View className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
        <Text className="text-xs uppercase tracking-[2px] text-cyan-300">Recover Access</Text>
        <Text className="mt-3 text-3xl font-semibold text-white">Forgot password</Text>
        <Text className="mt-2 text-sm leading-6 text-slate-300">
          We will send a secure recovery link to your email.
        </Text>

        <View className="mt-6">
          <Text className="mb-2 text-xs uppercase tracking-widest text-slate-300">Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-base text-white"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            value={email}
          />
        </View>

        {error ? (
          <View className="mt-4 rounded-xl border border-rose-300 bg-rose-100 px-4 py-3">
            <Text className="text-sm text-rose-700">{appErrorMessage(error)}</Text>
          </View>
        ) : null}

        {notice ? (
          <View className="mt-4 rounded-xl border border-emerald-300 bg-emerald-100 px-4 py-3">
            <Text className="text-sm text-emerald-700">{notice}</Text>
          </View>
        ) : null}

        <Pressable
          className={`mt-6 rounded-xl px-4 py-3 ${canSubmit ? "bg-cyan-400" : "bg-slate-700"}`}
          disabled={!canSubmit}
          onPress={onSubmit}
        >
          <Text className="text-center text-base font-semibold text-slate-900">
            {submitting ? "Sending..." : "Send reset link"}
          </Text>
        </Pressable>

        <Text className="mt-4 text-center text-sm text-slate-300">
          Back to{" "}
          <Link className="font-semibold text-cyan-300" href="/(auth)/sign-in">
            Sign in
          </Link>
        </Text>
      </View>
    </View>
  );
}

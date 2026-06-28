import { updatePassword } from "@/features/auth";
import { AuthError, errorMessage, toAuthFailure } from "@/lib/errors";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";


const handleFailure = toAuthFailure("Something went wrong while updating the password.");

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isValidPassword = password.length >= 8;
  const canSubmit = useMemo(
    () => isValidPassword && confirmPassword === password && !submitting,
    [confirmPassword, isValidPassword, password, submitting],
  );

  const onSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    const exit = await Effect.runPromiseExit(
      updatePassword({ password }),
    );

    if (Exit.isFailure(exit)) {
      setError(handleFailure(exit.cause));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setNotice("Password updated. You can now sign in with your new password.");
    setTimeout(() => {
      router.replace("/(auth)/sign-in");
    }, 1200);
  };

  return (
    <View className="flex-1 justify-center bg-slate-950 px-6 py-10">
      <View className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
        <Text className="text-xs uppercase tracking-[2px] text-cyan-300">Recovery</Text>
        <Text className="mt-3 text-3xl font-semibold text-white">Set new password</Text>
        <Text className="mt-2 text-sm leading-6 text-slate-300">
          Use at least 8 characters. This completes your password recovery flow.
        </Text>

        <View className="mt-6 gap-4">
          <View>
            <Text className="mb-2 text-xs uppercase tracking-widest text-slate-300">New password</Text>
            <TextInput
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-base text-white"
              onChangeText={setPassword}
              placeholder="Minimum 8 characters"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
            />
          </View>

          <View>
            <Text className="mb-2 text-xs uppercase tracking-widest text-slate-300">
              Confirm password
            </Text>
            <TextInput
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-base text-white"
              onChangeText={setConfirmPassword}
              placeholder="Repeat your password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={confirmPassword}
            />
          </View>
        </View>

        {!isValidPassword && password.length > 0 ? (
          <Text className="mt-4 text-sm text-amber-300">Password must contain at least 8 characters.</Text>
        ) : null}

        {confirmPassword.length > 0 && confirmPassword !== password ? (
          <Text className="mt-2 text-sm text-amber-300">Passwords do not match yet.</Text>
        ) : null}

        {error ? (
          <View className="mt-4 rounded-xl border border-rose-300 bg-rose-100 px-4 py-3">
            <Text className="text-sm text-rose-700">{errorMessage(error)}</Text>
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
            {submitting ? "Updating..." : "Update password"}
          </Text>
        </Pressable>

        <Text className="mt-4 text-center text-sm text-slate-300">
          Need the sign in page?{" "}
          <Link className="font-semibold text-cyan-300" href="/(auth)/sign-in">
            Open sign in
          </Link>
        </Text>
      </View>
    </View>
  );
}

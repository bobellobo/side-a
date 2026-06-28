import { signInWithEmail } from "@/features/auth";
import { AuthError, errorMessage, toAuthFailure } from "@/lib/errors";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";


const handleFailure = toAuthFailure("Something went wrong during sign in.");

const isSubmissionAllowed = (email: string, password: string, submitting: boolean) =>
  email.trim().length > 0 && password.length >= 6 && !submitting;


    
export default function SignInScreen() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const canSubmit = useMemo(
    () => isSubmissionAllowed(email, password, submitting),
    [email, password, submitting]
  );

  const onSubmit = async () => {
    
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const exit = await Effect.runPromiseExit(
      signInWithEmail({ email: email.trim(), password }),
    );

    if (Exit.isFailure(exit)) {
      setError(handleFailure(exit.cause));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.replace("/(app)/home");
  };

  return (
    <View className="flex-1 justify-center bg-slate-950 px-6 py-10">
      <View className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
        <Text className="text-xs uppercase tracking-[2px] text-cyan-300">Album Shuffle</Text>
        <Text className="mt-3 text-3xl font-semibold text-white">Sign in</Text>
        <Text className="mt-2 text-sm leading-6 text-slate-300">
          Continue with your email account.
        </Text>

        <View className="mt-6 gap-4">
          <View>
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

          <View>
            <Text className="mb-2 text-xs uppercase tracking-widest text-slate-300">Password</Text>
            <TextInput
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-base text-white"
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
            />
          </View>
        </View>

        {error ? (
          <View className="mt-4 rounded-xl border border-rose-300 bg-rose-100 px-4 py-3">
            <Text className="text-sm text-rose-700">{errorMessage(error)}</Text>
          </View>
        ) : null}

        <Pressable
          className={`mt-6 rounded-xl px-4 py-3 ${canSubmit ? "bg-cyan-400" : "bg-slate-700"}`}
          disabled={!canSubmit}
          onPress={onSubmit}
        >
          <Text className="text-center text-base font-semibold text-slate-900">
            {submitting ? "Signing in..." : "Sign in"}
          </Text>
        </Pressable>

        <Text className="mt-4 text-center text-sm text-slate-300">
          No account yet?{" "}
          <Link className="font-semibold text-cyan-300" href="/(auth)/sign-up">
            Create one
          </Link>
        </Text>

        <Text className="mt-2 text-center text-sm text-slate-300">
          Forgot your password?{" "}
          <Link className="font-semibold text-cyan-300" href="/(auth)/forgot-password">
            Reset it
          </Link>
        </Text>
      </View>
    </View>
  );
}

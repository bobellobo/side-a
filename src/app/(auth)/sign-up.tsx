import { AppError, appErrorMessage, toFailureError } from "@/lib/errors";
import { signUpWithEmail } from "@/lib/services/auth/authService";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";


const handleFailure = toFailureError("Network", "Something went wrong during sign up.");

const validateEmail = (email: string) => 
  email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password: string) => password.length >= 6;


export default function SignUpScreen() {

  const [email,      setEmail ] = useState("");
  const [password,   setPassword ] = useState("");
  const [submitting, setSubmitting ] = useState(false);
  const [error,      setError ] = useState<AppError | null>(null);

  const canSubmit = useMemo(
    () => validateEmail(email) && validatePassword(password) && !submitting,
    [email, password, submitting]
  );

  const onSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const exit = await Effect.runPromiseExit(
      signUpWithEmail({ email: email.trim(), password }),
    );

    if (Exit.isFailure(exit)) {
      setError(handleFailure(exit.cause));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);

    if (exit.value) {
      router.replace("/(app)/home");
      return;
    }

    router.replace({
      pathname: "/(auth)/verify-email",
      params: { email: email.trim() },
    });
  };

  return (
    <View className="flex-1 justify-center bg-slate-950 px-6 py-10">
      <View className="rounded-3xl border border-slate-700 bg-slate-900 p-6">
        <Text className="text-xs uppercase tracking-[2px] text-cyan-300">Side A</Text>
        <Text className="mt-3 text-3xl font-semibold text-white">Create account</Text>
        <Text className="mt-2 text-sm leading-6 text-slate-300">
          Register with your email and start shuffling albums.
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
            <Text className="text-sm text-rose-700">{appErrorMessage(error)}</Text>
          </View>
        ) : null}

        <Pressable
          className={`mt-6 rounded-xl px-4 py-3 ${canSubmit ? "bg-cyan-400" : "bg-slate-700"}`}
          disabled={!canSubmit}
          onPress={onSubmit}
        >
          <Text className="text-center text-base font-semibold text-slate-900">
            {submitting ? "Creating account..." : "Sign up"}
          </Text>
        </Pressable>

        <Text className="mt-4 text-center text-sm text-slate-300">
          Already have an account?{" "}
          <Link className="font-semibold text-cyan-300" href="/(auth)/sign-in">
            Sign in
          </Link>
        </Text>
      </View>
    </View>
  );
}

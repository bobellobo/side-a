import * as S from "effect/Schema";

/* ************************************************ */

export const SignInWithEmailInputSchema = S.Struct({
  email: S.String,
  password: S.String,
});

export type SignInWithEmailInput = typeof SignInWithEmailInputSchema.Type;

/* ************************************************ */

export const SignUpWithEmailInputSchema = S.Struct({
  email: S.String,
  password: S.String,
});

export type SignUpWithEmailInput = typeof SignUpWithEmailInputSchema.Type;

/* ************************************************ */

export const RequestPasswordResetInputSchema = S.Struct({
  email: S.String,
});

export type RequestPasswordResetInput = typeof RequestPasswordResetInputSchema.Type;

/* ************************************************ */

export const UpdatePasswordInputSchema = S.Struct({
  password: S.String,
});

export type UpdatePasswordInput = typeof UpdatePasswordInputSchema.Type;

/* ************************************************ */
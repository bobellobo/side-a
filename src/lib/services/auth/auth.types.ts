export type SignInWithEmailInput = {
  readonly email: string;
  readonly password: string;
};

export type SignUpWithEmailInput = {
  readonly email: string;
  readonly password: string;
};

export type RequestPasswordResetInput = {
  readonly email: string;
};

export type UpdatePasswordInput = {
  readonly password: string;
};
import { z } from 'zod';

// Signup and login bounds mirror backend/src/schemas/auth.py exactly. They must
// stay in sync: the backend enforces 8-72 characters on registration, so a
// frontend accepting 6 would let a user submit a password the server rejects
// with an opaque 422. 72 is where bcrypt truncates, so nothing is lost by
// capping there.
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  // Login keeps the historical minimum of 1: an account created before the
  // 8-character rule must still be able to sign in. Length is still bounded
  // above to avoid hashing arbitrary input on every attempt.
  password: z.string().min(1, "Password is required.").max(PASSWORD_MAX, "Password is too long."),
});

export const signupSchema = z.object({
  full_name: z.string().min(1, "Full name is required.").max(200, "Name is too long."),
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters long.`)
    .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters long.`),
});

// TypeScript types inferred from the schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

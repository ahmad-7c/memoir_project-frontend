"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema, signupSchema, LoginInput } from "@/features/auth/schemas";
import { useAuth } from "@/features/auth/hooks";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LeafMark } from "@/components/Logo";

const extendedSignupSchema = signupSchema
  .extend({ confirmPassword: z.string().min(1, "Please confirm your password.") })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
type SignupFormInput = z.infer<typeof extendedSignupSchema>;

/**
 * The reference's `/begin` is a single email+password screen with no
 * provision for a returning user at all ("design preview" copy admits its
 * own auth is non-functional). This product needs both a new account and a
 * sign-in path, so `/begin` carries both behind a small mode switch --
 * independent judgment where the reference gave none. Default mode is
 * "begin" (create), matching the reference's whole framing of starting
 * something new; "Sign in" is one quiet link away, not a separate route.
 */
export default function BeginPage() {
  const [mode, setMode] = useState<"begin" | "signin">("begin");
  const router = useRouter();
  const { loading, serverError, successMessage, setServerError, handleLogin, handleSignup } = useAuth();

  const signupForm = useForm<SignupFormInput>({ resolver: zodResolver(extendedSignupSchema) });
  const loginForm = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const switchMode = (next: "begin" | "signin") => {
    setServerError(null);
    setMode(next);
  };

  const onSignup = async (data: SignupFormInput) => {
    const success = await handleSignup(data);
    if (success) router.push("/first-memoir");
  };

  const onLogin = async (data: LoginInput) => {
    await handleLogin(data);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          &larr; Back
        </Link>

        <div className="flex items-center gap-2 font-serif text-xl text-foreground mb-6">
          <LeafMark className="w-5 h-5 text-primary" />
          The Family Memoir
        </div>

        <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-3">
          {mode === "begin" ? "The beginning" : "Welcome back"}
        </p>
        <h1 className="font-serif text-[2.5rem] leading-[1.15] text-foreground mb-2">
          {mode === "begin" ? "A place for their story." : "Step back into their story."}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {mode === "begin" ? "Begin a memoir for someone you love." : "Sign in to keep gathering their memories."}
        </p>

        {serverError && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-md border border-border bg-card px-5 py-4">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-2" aria-hidden="true" />
            <p className="text-sm text-foreground">{serverError}</p>
          </div>
        )}
        {successMessage && (
          <div role="status" className="mb-6 rounded-md border border-border bg-card px-5 py-4">
            <p className="text-sm text-foreground">{successMessage}</p>
          </div>
        )}

        {mode === "begin" ? (
          <form onSubmit={signupForm.handleSubmit(onSignup)} className="flex flex-col gap-5" noValidate>
            <div>
              <Label htmlFor="begin-name">Full name</Label>
              <Input
                id="begin-name"
                type="text"
                placeholder="Your name"
                invalid={Boolean(signupForm.formState.errors.full_name)}
                {...signupForm.register("full_name")}
              />
              {signupForm.formState.errors.full_name && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {signupForm.formState.errors.full_name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="begin-email">Email</Label>
              <Input
                id="begin-email"
                type="email"
                placeholder="you@example.com"
                invalid={Boolean(signupForm.formState.errors.email)}
                {...signupForm.register("email")}
              />
              {signupForm.formState.errors.email && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {signupForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="begin-password">Password</Label>
                <Input
                  id="begin-password"
                  type="password"
                  placeholder="At least 8 characters"
                  invalid={Boolean(signupForm.formState.errors.password)}
                  {...signupForm.register("password")}
                />
                {signupForm.formState.errors.password && (
                  <p role="alert" className="mt-1.5 text-xs text-destructive">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="begin-confirm">Confirm</Label>
                <Input
                  id="begin-confirm"
                  type="password"
                  placeholder="Confirm password"
                  invalid={Boolean(signupForm.formState.errors.confirmPassword)}
                  {...signupForm.register("confirmPassword")}
                />
                {signupForm.formState.errors.confirmPassword && (
                  <p role="alert" className="mt-1.5 text-xs text-destructive">
                    {signupForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Have an account? Sign in
              </button>
              <Button type="submit" loading={loading}>
                {loading ? "Beginning…" : "Begin →"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="flex flex-col gap-5" noValidate>
            <div>
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="you@example.com"
                invalid={Boolean(loginForm.formState.errors.email)}
                {...loginForm.register("email")}
              />
              {loginForm.formState.errors.email && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="Your password"
                invalid={Boolean(loginForm.formState.errors.password)}
                {...loginForm.register("password")}
              />
              {loginForm.formState.errors.password && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() => switchMode("begin")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                New here? Begin
              </button>
              <Button type="submit" loading={loading}>
                {loading ? "Signing in…" : "Sign in →"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

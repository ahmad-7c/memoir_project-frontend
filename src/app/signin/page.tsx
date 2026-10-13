"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/features/auth/schemas";
import { useAuth } from "@/features/auth/hooks";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LeafMark } from "@/components/Logo";
import { safeNextPath } from "@/lib/safeNext";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, serverError, handleLogin } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    const { ok, memoirCount } = await handleLogin(data);
    if (!ok) return; // serverError renders inline below; nothing disappears

    // `next` is validated, never used raw -- see lib/safeNext.ts. An
    // authenticated user with no memoir has nowhere to land but creation.
    const requested = safeNextPath(searchParams.get("next"), "/profile");
    router.push(memoirCount === 0 ? "/memoirs/new" : requested);
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
          <LeafMark className="w-5 h-5 text-accent" />
          The Family Memoir
        </div>

        <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-3">
          Welcome back
        </p>
        <h1 className="font-serif text-[2.5rem] leading-[1.15] text-foreground mb-2">
          Step back into their story.
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Sign in to keep gathering their memories.
        </p>

        {serverError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-md border border-border bg-card px-5 py-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-2" aria-hidden="true" />
            <p className="text-sm text-foreground">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <div>
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              invalid={Boolean(errors.email)}
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && (
              <p role="alert" className="mt-1.5 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              invalid={Boolean(errors.password)}
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password && (
              <p role="alert" className="mt-1.5 text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <Link
              href="/begin"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              New here? Begin a memoir
            </Link>
            <Button type="submit" loading={loading}>
              {loading ? "Signing in…" : "Sign in →"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function SignInPage() {
  // useSearchParams needs a Suspense boundary to avoid opting the whole route
  // into client-side rendering at build time.
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

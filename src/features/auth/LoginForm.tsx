"use client";

import { useState } from "react";
import Link from "next/link";
import { loginSchema, LoginInput } from "./schemas";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "./hooks";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginForm() {
  const [rememberMe, setRememberMe] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const { loading, serverError, setServerError, handleLogin } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setServerError(null);
    setInfoMessage("Password reset will be available soon.");
  };

  return (
    <section className="min-h-screen bg-canvas flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
        className="w-full bg-surface border border-line rounded-md px-8 md:px-12 py-10 max-w-125"
      >
        <div className="mb-8">
          <Link
            href="/"
            className="text-ink-muted hover:text-ink-secondary text-body-ui transition-colors inline-flex items-center gap-1"
          >
            ← Back
          </Link>
        </div>

        <h1 className="font-serif text-heading text-ink text-center mb-8 leading-snug">
          Step back into your family&rsquo;s space
        </h1>

        {serverError && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-md border border-line bg-canvas px-5 py-4">
            <span className="w-1.5 h-1.5 rounded-full bg-alert shrink-0 mt-2" aria-hidden="true" />
            <p className="text-body-ui text-ink">{serverError}</p>
          </div>
        )}

        {infoMessage && (
          <div role="status" className="mb-6 rounded-md border border-line bg-canvas px-5 py-4">
            <p className="text-body-ui text-ink-secondary">{infoMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(handleLogin)} className="flex flex-col gap-5" noValidate>
          <div>
            <Label htmlFor="login-email" required>
              Email
            </Label>
            <Input
              id="login-email"
              type="email"
              placeholder="e.g. hafsa@example.com"
              invalid={Boolean(errors.email)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="login-email-error" role="alert" className="mt-1.5 text-small text-alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="login-password" required>
              Password
            </Label>
            <Input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              invalid={Boolean(errors.password)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="login-password-error" role="alert" className="mt-1.5 text-small text-alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center text-body-ui text-ink-secondary py-1">
            <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-sm border-line accent-ink cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="hover:text-ink transition-colors underline underline-offset-2 bg-transparent border-none cursor-pointer text-body-ui text-ink-secondary"
            >
              Forgot your password?
            </button>
          </div>

          <Button type="submit" loading={loading} className="w-full mt-2">
            {loading ? "Verifying…" : "Log in"}
          </Button>
        </form>

        <div className="border-t border-line mt-8 pt-6 text-center text-body-ui text-ink-secondary">
          Not a member yet?{" "}
          <Link href="/signup" className="text-ink font-semibold ml-1 hover:underline underline-offset-2">
            Sign up
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

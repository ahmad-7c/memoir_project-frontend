"use client";

import { signupSchema } from "./schemas";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "./hooks";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const extendedSignupSchema = signupSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ExtendedSignupInput = z.infer<typeof extendedSignupSchema>;

export default function SignupForm() {
  const router = useRouter();
  const { loading, serverError, successMessage, handleSignup } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExtendedSignupInput>({
    resolver: zodResolver(extendedSignupSchema),
  });

  const onSubmit = async (data: ExtendedSignupInput) => {
    try {
      const success = await handleSignup(data);
      // The first-memoir screen is the explicit, deliberate moment where the
      // memoir actually gets created -- not a silent background step here.
      if (success) {
        router.push("/first-memoir");
      }
    } catch (err) {
      console.error("Signup error:", err);
    }
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
            href="/invite-family-friends"
            className="text-ink-muted hover:text-ink-secondary text-body-ui transition-colors inline-flex items-center gap-1"
          >
            ← Back
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="font-serif text-heading text-ink leading-snug">
            A space for your family&rsquo;s memories
          </h1>

          <div className="flex flex-col text-small text-ink-muted whitespace-nowrap">
            <span>Have an account?</span>
            <Link href="/login" className="text-ink font-semibold hover:underline underline-offset-2 mt-0.5">
              Log in
            </Link>
          </div>
        </div>

        {serverError && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-md border border-line bg-canvas px-5 py-4">
            <span className="w-1.5 h-1.5 rounded-full bg-alert shrink-0 mt-2" aria-hidden="true" />
            <p className="text-body-ui text-ink">{serverError}</p>
          </div>
        )}

        {successMessage && (
          <div role="status" className="mb-6 rounded-md border border-line bg-canvas px-5 py-4">
            <p className="text-body-ui text-ink-secondary">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <div>
            <Label htmlFor="signup-fullname" required>
              Full name
            </Label>
            <Input
              id="signup-fullname"
              type="text"
              placeholder="Jordan Ahmed"
              invalid={Boolean(errors.full_name)}
              aria-invalid={Boolean(errors.full_name)}
              aria-describedby={errors.full_name ? "signup-fullname-error" : undefined}
              {...register("full_name")}
            />
            {errors.full_name && (
              <p id="signup-fullname-error" role="alert" className="mt-1.5 text-small text-alert">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="signup-email" required>
              Email
            </Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="jordan@example.com"
              invalid={Boolean(errors.email)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "signup-email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="signup-email-error" role="alert" className="mt-1.5 text-small text-alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="signup-password" required>
                Password
              </Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Enter your password"
                invalid={Boolean(errors.password)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "signup-password-error" : undefined}
                {...register("password")}
              />
              {errors.password && (
                <p id="signup-password-error" role="alert" className="mt-1.5 text-small text-alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="signup-confirmpassword" required>
                Confirm password
              </Label>
              <Input
                id="signup-confirmpassword"
                type="password"
                placeholder="Confirm your password"
                invalid={Boolean(errors.confirmPassword)}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? "signup-confirmpassword-error" : undefined}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p id="signup-confirmpassword-error" role="alert" className="mt-1.5 text-small text-alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full mt-2">
            {loading ? "Creating account…" : "Continue"}
          </Button>
        </form>

        <p className="text-center text-small text-ink-muted mt-8">
          By continuing you agree to the{" "}
          <span className="text-ink-secondary font-medium cursor-pointer hover:underline underline-offset-2">
            Terms and Conditions
          </span>
        </p>
      </motion.div>
    </section>
  );
}

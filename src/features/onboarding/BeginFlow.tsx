"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, loginSchema, LoginInput } from "@/features/auth/schemas";
import { useAuth } from "@/features/auth/hooks";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LeafMark } from "@/components/Logo";
import type { MemoirRelationship } from "@/lib/api/client";
import {
  ONBOARDING_STEPS,
  firstUnansweredStep,
  getOnboardingDraftServerSnapshot,
  getOnboardingDraftSnapshot,
  saveOnboardingAnswer,
  subscribeOnboardingDraft,
  type OnboardingDraft,
} from "./draft";

const RELATIONSHIPS: { value: MemoirRelationship; label: string }[] = [
  { value: "parent", label: "My mother or father" },
  { value: "grandchild", label: "My grandparent" },
  { value: "spouse_partner", label: "My husband, wife or partner" },
  { value: "sibling", label: "My brother or sister" },
  { value: "child", label: "My son or daughter" },
  { value: "friend", label: "A dear friend" },
  { value: "extended_family", label: "Someone else in the family" },
  { value: "other", label: "Someone else who mattered" },
];

const extendedSignupSchema = signupSchema
  .extend({ confirmPassword: z.string().min(1, "Please confirm your password.") })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
type SignupFormInput = z.infer<typeof extendedSignupSchema>;

/** The quiet "n of 5" marks the design already uses. */
function ProgressMarks({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10" aria-label={`Step ${step + 1} of 5`}>
      {ONBOARDING_STEPS.map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={
            i === step
              ? "w-1.5 h-1.5 rounded-full bg-accent"
              : "w-1.5 h-1.5 rounded-full bg-border"
          }
        />
      ))}
    </div>
  );
}

function Shell({
  step,
  eyebrow,
  title,
  subtitle,
  onBack,
  children,
}: {
  step: number;
  eyebrow: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-10 cursor-pointer"
          >
            &larr; Back
          </button>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-10"
          >
            &larr; Back
          </Link>
        )}

        <div className="flex items-center gap-2 font-serif text-xl text-foreground mb-8">
          <LeafMark className="w-5 h-5 text-accent" />
          The Family Memoir
        </div>

        <ProgressMarks step={step} />

        <p className="text-[10px] font-medium uppercase tracking-[2px] text-muted-foreground mb-3">
          {eyebrow}
        </p>
        <h1 className="font-serif text-[2.25rem] leading-[1.15] text-foreground mb-2">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mb-8">{subtitle}</p>}

        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

/**
 * §3b. The questions come first; the account is created last.
 *
 * Steps 1-4 happen before any account exists, so their answers live only in
 * the browser (see ./draft.ts). Each answer is written to sessionStorage the
 * moment it is given and restored on mount, so Back and a page refresh never
 * lose anything. The draft is cleared only once the account exists AND the
 * memoir has been created from it -- which happens on /memoirs/new, not here.
 */
export function BeginFlow() {
  const router = useRouter();
  const { loading, serverError, successMessage, setServerError, handleSignup, handleLogin } =
    useAuth();

  // sessionStorage read as an external store rather than an effect+setState.
  // The snapshot is the raw string so it compares stably; parsing happens
  // behind a useMemo.
  const rawDraft = useSyncExternalStore(
    subscribeOnboardingDraft,
    getOnboardingDraftSnapshot,
    getOnboardingDraftServerSnapshot,
  );
  const draft: OnboardingDraft = useMemo(() => {
    if (!rawDraft) return {};
    try {
      return JSON.parse(rawDraft) as OnboardingDraft;
    } catch {
      return {};
    }
  }, [rawDraft]);

  // `null` means "wherever the answers say we are". Once the user navigates
  // explicitly (Back, or answering a question) that choice wins. Deriving
  // the resume point during render is what lets a refresh land on the right
  // step without a cascading effect.
  const [navStep, setNavStep] = useState<number | null>(null);
  const step = navStep ?? firstUnansweredStep(draft);

  const [accountMode, setAccountMode] = useState<"create" | "signin">("create");

  const answer = (patch: Partial<OnboardingDraft>, nextStep: number) => {
    saveOnboardingAnswer(patch); // notifies the store; `draft` updates on re-render
    setNavStep(nextStep);
  };
  const setStep = setNavStep;

  const signupForm = useForm<SignupFormInput>({ resolver: zodResolver(extendedSignupSchema) });
  const loginForm = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onCreateAccount = async (data: SignupFormInput) => {
    const ok = await handleSignup({ ...data, full_name: draft.ownerName ?? data.full_name });
    // On failure we stay on step 5 with every earlier answer intact -- the
    // draft is untouched, and serverError renders inline below.
    if (ok) router.push("/memoirs/new");
  };

  const onSignInInstead = async (data: LoginInput) => {
    const { ok, memoirCount } = await handleLogin(data);
    if (!ok) return;
    // An existing user who came through onboarding keeps their answers:
    // /memoirs/new reads the same draft and pre-fills from it.
    router.push(memoirCount === 0 ? "/memoirs/new" : "/profile");
  };

  if (step === 0) {
    return (
      <Shell step={0} eyebrow="First, you" title="What should we call you?">
        <StepText
          id="owner-name"
          label="Your name"
          placeholder="e.g. Sara"
          initial={draft.ownerName ?? ""}
          cta="Continue →"
          onSubmit={(v) => answer({ ownerName: v }, 1)}
        />
      </Shell>
    );
  }

  if (step === 1) {
    return (
      <Shell
        step={1}
        eyebrow="Now, them"
        title="Who is this memoir for?"
        subtitle="The person whose story you want to keep."
        onBack={() => setStep(0)}
      >
        <StepText
          id="subject-name"
          label="Their name"
          placeholder="e.g. Fatima Khan"
          initial={draft.subjectName ?? ""}
          cta="Continue →"
          onSubmit={(v) => answer({ subjectName: v }, 2)}
        />
      </Shell>
    );
  }

  if (step === 2) {
    const them = draft.subjectName?.trim() || "them";
    return (
      <Shell
        step={2}
        eyebrow="Your part in it"
        title={`Who were they to you?`}
        subtitle={`How you knew ${them}.`}
        onBack={() => setStep(1)}
      >
        <div className="flex flex-col gap-2.5">
          {RELATIONSHIPS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => answer({ relationship: r.value }, 3)}
              className={`w-full text-left px-5 py-3.5 rounded-md border bg-card transition-colors cursor-pointer min-h-11 text-sm ${
                draft.relationship === r.value
                  ? "border-accent text-foreground"
                  : "border-border text-foreground hover:border-accent"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  if (step === 3) {
    return (
      <Shell
        step={3}
        eyebrow="Keeping it safe"
        title="Keep every memory, always."
        subtitle="$3 a month. No surprises, cancel anytime."
        onBack={() => setStep(2)}
      >
        <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-5 py-4 mb-5">
          <span className="font-serif text-xl text-foreground">Family plan</span>
          <span className="text-sm font-semibold text-foreground">$3 / mo</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Payment isn&rsquo;t available just yet. You can start now on the free plan, and nothing
          about your memoir depends on it.
        </p>
        <Button
          size="lg"
          className="w-full"
          onClick={() => answer({ subscriptionAcknowledged: true }, 4)}
        >
          Continue free →
        </Button>
      </Shell>
    );
  }

  // Step 5 — the account, last.
  return (
    <Shell
      step={4}
      eyebrow="Last thing"
      title={accountMode === "create" ? "Somewhere to keep it." : "Welcome back."}
      subtitle={
        accountMode === "create"
          ? "Your answers are saved. This is just somewhere to keep them."
          : "Sign in and we'll carry your answers through."
      }
      onBack={() => setStep(3)}
    >
      {serverError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-md border border-border bg-card px-5 py-4"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 mt-2" aria-hidden="true" />
          <p className="text-sm text-foreground">{serverError}</p>
        </div>
      )}
      {successMessage && (
        <div role="status" className="mb-6 rounded-md border border-border bg-card px-5 py-4">
          <p className="text-sm text-foreground">{successMessage}</p>
        </div>
      )}

      {accountMode === "create" ? (
        <form onSubmit={signupForm.handleSubmit(onCreateAccount)} className="flex flex-col gap-5" noValidate>
          {/* full_name is already known from step 1; registered hidden so the
              schema is satisfied without asking the same question twice. */}
          <input type="hidden" value={draft.ownerName ?? ""} {...signupForm.register("full_name")} />
          <Field
            id="begin-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={signupForm.formState.errors.email?.message}
            register={signupForm.register("email")}
          />
          <Field
            id="begin-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={signupForm.formState.errors.password?.message}
            register={signupForm.register("password")}
          />
          <Field
            id="begin-confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Once more"
            error={signupForm.formState.errors.confirmPassword?.message}
            register={signupForm.register("confirmPassword")}
          />
          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={() => {
                setServerError(null);
                setAccountMode("signin");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Already have an account?
            </button>
            <Button type="submit" loading={loading}>
              {loading ? "Creating…" : "Begin →"}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={loginForm.handleSubmit(onSignInInstead)} className="flex flex-col gap-5" noValidate>
          <Field
            id="begin-signin-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={loginForm.formState.errors.email?.message}
            register={loginForm.register("email")}
          />
          <Field
            id="begin-signin-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            error={loginForm.formState.errors.password?.message}
            register={loginForm.register("password")}
          />
          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={() => {
                setServerError(null);
                setAccountMode("create");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Create one instead
            </button>
            <Button type="submit" loading={loading}>
              {loading ? "Signing in…" : "Sign in →"}
            </Button>
          </div>
        </form>
      )}
    </Shell>
  );
}

/** One free-text question per screen, with its answer persisted on submit. */
function StepText({
  id,
  label,
  placeholder,
  initial,
  cta,
  onSubmit,
}: {
  id: string;
  label: string;
  placeholder: string;
  initial: string;
  cta: string;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [touchedEmpty, setTouchedEmpty] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) {
          setTouchedEmpty(true);
          return;
        }
        onSubmit(value.trim());
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      <div>
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          type="text"
          value={value}
          autoFocus
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            if (touchedEmpty) setTouchedEmpty(false);
          }}
          invalid={touchedEmpty}
        />
        {touchedEmpty && (
          <p role="alert" className="mt-1.5 text-xs text-destructive">
            Please answer before continuing.
          </p>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="submit">{cta}</Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  error,
  register,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
  error?: string;
  register: ReturnType<ReturnType<typeof useForm>["register"]>;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        invalid={Boolean(error)}
        aria-invalid={Boolean(error)}
        {...register}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

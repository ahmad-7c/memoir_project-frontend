/**
 * @file MemorySubjectSelection.tsx
 * @description Step 1 of 5. Two sub-steps in sequence, never at once: who
 * this memoir is for, then their name and dates. Previously a 3D drag
 * coverflow with spring physics and heavy shadows -- replaced with a plain
 * list, since spring motion and drop shadows are both against the brief.
 * The data collected (subject_name/subject_born_on/subject_died_on/
 * subject_is_living, and the localStorage handoff key) is unchanged.
 */

"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Shield, Users, Sparkles, Star } from "lucide-react";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OnboardingProgress } from "./OnboardingProgress";

interface OptionItem {
  id: string;
  label: string;
  description: string;
  icon: typeof Heart;
}

export default function MemorySubjectSelection() {
  const router = useRouter();

  const options: OptionItem[] = [
    { id: "mother", label: "Mother", description: "The gentle heart that raised me.", icon: Heart },
    { id: "father", label: "Father", description: "The steady hand and guiding light.", icon: Shield },
    { id: "sibling", label: "A sibling", description: "A lifelong bond of shared secrets and years.", icon: Users },
    { id: "friend", label: "A dear friend", description: "A chosen soul who walked beside me.", icon: Sparkles },
    { id: "other", label: "Someone special", description: "Someone whose story means everything to me.", icon: Star },
  ];

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "details">("select");

  const [name, setName] = useState<string>("");
  const [dob, setDob] = useState<string>("");
  const [dod, setDod] = useState<string>("");
  const [isAlive, setIsAlive] = useState<boolean>(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelect = (id: string): void => {
    setSelectedOption(id);
    setStep("details");
    setErrorMessage(null);
  };

  const handleFinalSubmit = (): void => {
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter their name to continue.");
      return;
    }
    if (!dob.trim()) {
      setErrorMessage("Please select their date of birth.");
      return;
    }
    if (!isAlive && !dod.trim()) {
      setErrorMessage('Please select their date of passing, or check "Still with us".');
      return;
    }

    // Package the onboarding details into localStorage for memoir creation post-signup
    const memoirDraft = {
      subject_name: name.trim(),
      subject_born_on: dob.trim(),
      subject_died_on: isAlive ? null : dod.trim(),
      subject_is_living: isAlive,
      description: `A memoir dedicated to my ${selectedOption || "loved one"}.`,
    };

    localStorage.setItem("pending_memoir", JSON.stringify(memoirDraft));

    router.push("/handwritten-note");
  };

  return (
    <section className="min-h-screen bg-canvas flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-125 flex flex-col items-center">
        <div className="mb-6 w-full flex justify-start">
          <button
            type="button"
            onClick={() => {
              if (step === "details") {
                setStep("select");
                setErrorMessage(null);
              } else {
                router.back();
              }
            }}
            className="text-ink-muted hover:text-ink-secondary text-body-ui transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            ← Back
          </button>
        </div>

        <OnboardingProgress step={1} />

        {step === "select" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="w-full"
          >
            <h1 className="font-serif text-heading text-ink text-center mb-10 leading-snug">
              Whose voice do you want to keep close?
            </h1>

            <div className="flex flex-col gap-3 w-full">
              {options.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className="flex items-center gap-4 w-full text-left px-5 py-4 rounded-md border border-line bg-surface hover:border-accent transition-colors cursor-pointer min-h-11"
                  >
                    <span className="shrink-0 w-10 h-10 rounded-full border border-line flex items-center justify-center">
                      <IconComponent size={16} className="text-ink-secondary" strokeWidth={1.5} />
                    </span>
                    <span>
                      <span className="block font-serif text-subhead text-ink">{option.label}</span>
                      <span className="block text-small text-ink-muted mt-0.5">{option.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
            className="w-full bg-surface border border-line rounded-md px-8 md:px-10 py-10"
          >
            <h1 className="font-serif text-heading text-ink text-center mb-8 leading-snug">
              For {options.find((o) => o.id === selectedOption)?.label}
            </h1>

            {errorMessage && (
              <div role="alert" className="mb-6 flex items-start gap-3 rounded-md border border-line bg-canvas px-5 py-4">
                <span className="w-1.5 h-1.5 rounded-full bg-alert shrink-0 mt-2" aria-hidden="true" />
                <p className="text-body-ui text-ink">{errorMessage}</p>
              </div>
            )}

            <div className="flex flex-col gap-5 mb-8">
              <div>
                <Label htmlFor="subject-name" required>
                  Their name
                </Label>
                <Input
                  id="subject-name"
                  type="text"
                  value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. Fatima Khan"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="subject-dob" required>
                    Date of birth
                  </Label>
                  <Input
                    id="subject-dob"
                    type="date"
                    value={dob}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setDob(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="subject-dod" required={!isAlive} className="mb-0">
                      Date of passing
                    </Label>
                    <label className="flex items-center gap-1.5 text-small text-ink-muted cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAlive}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setIsAlive(e.target.checked);
                          if (e.target.checked) setDod("");
                          if (errorMessage) setErrorMessage(null);
                        }}
                        className="w-4 h-4 rounded-sm border-line accent-ink cursor-pointer"
                      />
                      <span>Still with us</span>
                    </label>
                  </div>
                  <Input
                    id="subject-dod"
                    type="date"
                    value={dod}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setDod(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    disabled={isAlive}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <Button type="button" onClick={handleFinalSubmit} className="w-full">
              Continue
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

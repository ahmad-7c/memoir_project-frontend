import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { LoginInput, SignupInput } from "./schemas";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const startAuthAction = () => {
    setLoading(true);
    setServerError(null);
    setSuccessMessage(null);
  };

  const handleLogin = async (data: LoginInput): Promise<boolean> => {
    startAuthAction();

    try {
      // 1. Authenticate the user -- the backend sets the session as an
      // httpOnly cookie itself; there is no token here for this code to
      // store, only a flag confirming a session actually started.
      await api.login({
        email: data.email,
        password: data.password,
      });

      // --- WHERE DOES THIS USER LAND? ---
      //
      // Memoir creation itself is no longer silent background work here --
      // the first-memoir screen is where that explicit, deliberate moment
      // happens now (see app/first-memoir/page.tsx). This check only decides
      // which screen to send the user to.
      try {
        const memoirs = await api.getUserMemoirs();

        if (!memoirs || memoirs.length === 0) {
          // No memoir yet, whether or not onboarding left a pending draft --
          // the first-memoir screen reads `pending_memoir` itself and
          // pre-fills from it if present.
          router.push("/first-memoir");
          return true;
        }

        // Returning user with an existing memoir.
        localStorage.setItem("active_memoir", JSON.stringify(memoirs[0]));
        localStorage.removeItem("pending_memoir");
        router.push("/dashboard");
        return true;
      } catch (memoirCheckError) {
        console.error("Could not verify this account's memoirs after login", memoirCheckError);
        // Login itself succeeded -- send them somewhere that can recover
        // (the first-memoir screen tolerates having nothing pre-filled)
        // rather than stranding them on the login form.
        router.push("/first-memoir");
        return true;
      }
      
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred during login";
      setServerError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (
    data: SignupInput & { confirmPassword?: string }
  ): Promise<boolean> => {
    startAuthAction();

    try {
      const res = await api.signup({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
      });

      // The backend sets the session cookie itself when confirmation isn't
      // required -- `authenticated` just tells us whether that happened, we
      // never see or handle the token.
      if (res.authenticated) {
        // Memoir creation happens explicitly on the first-memoir screen now,
        // not silently here -- `pending_memoir` (if onboarding left one) is
        // still in localStorage for that screen to read. The caller
        // (SignupForm) navigates there on `true`.
        return true;
      } else {
        // FIX: Registration successful, but awaiting email verification.
        // Set success message and return FALSE so the UI does NOT redirect.
        setSuccessMessage("Account created successfully! Please check your email to verify your account.");
        return false;
      }

    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred during signup";
      setServerError(errorMessage); 
      return false; 
    } finally {
      setLoading(false);
    }
  };

  // The session cookie is httpOnly -- this is the only way to end it, since
  // there's no token in localStorage to just delete anymore. No UI currently
  // calls this (there's no logout button in the design yet); exposed here so
  // wiring one up later is a one-line addition, not a new auth mechanism.
  const handleLogout = async (): Promise<void> => {
    try {
      await api.logout();
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      // Everything cached here is scoped to whichever account was active --
      // stale values are exactly what caused a previous cross-account 403
      // (see dashboard/page.tsx's active_memoir cross-check).
      localStorage.removeItem("active_memoir");
      localStorage.removeItem("pending_memoir");
      localStorage.removeItem("user_profile");
      localStorage.removeItem("user_name");
      sessionStorage.removeItem("onboarding_initial_memory");
      router.push("/login");
    }
  };

  return {
    loading,
    serverError,
    successMessage,
    setServerError,
    setSuccessMessage,
    handleLogin,
    handleSignup,
    handleLogout,
  };
}
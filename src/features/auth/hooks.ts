import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { LoginInput, SignupInput } from "./schemas";

/**
 * Keys written by older builds of this app that are no longer used, plus the
 * per-account caches this build does write. All of them are cleared on
 * logout.
 *
 * `access_token` and `sb-<project>-auth-token` are the important ones: they
 * are real credentials left in localStorage by a previous version, and
 * nothing in the app ever cleared them, so they persisted indefinitely in
 * every browser that ran that build. Current code never writes them -- this
 * list exists to remove what is already out there.
 */
const LEGACY_AND_CACHED_KEYS = [
  "access_token",
  "refresh_token",
  "user_profile",
  "user_name",
  "active_memoir",
  "pending_memoir",
];

function clearClientSideSessionState() {
  try {
    for (const key of LEGACY_AND_CACHED_KEYS) {
      localStorage.removeItem(key);
    }
    // The Supabase browser client's own key is project-scoped
    // (sb-<ref>-auth-token), so it has to be matched by shape rather than by
    // name. Nothing in this build creates it; this removes the leftover.
    for (const key of Object.keys(localStorage)) {
      if (/^sb-.*-auth-token$/.test(key)) localStorage.removeItem(key);
    }
    sessionStorage.removeItem("onboarding_initial_memory");
  } catch {
    // Private-mode browsers can throw on storage access. Logout must still
    // proceed -- the httpOnly session cookie is what actually ends the
    // session, and the server has already cleared it by this point.
  }
}

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

  /**
   * Authenticates and reports what happened. It deliberately does NOT
   * navigate: /signin wants /profile, onboarding wants /memoirs/new, and a
   * hook that hard-codes one destination forces the other caller to
   * double-navigate. The backend sets the session as an httpOnly cookie, so
   * there is no token here for this code to hold.
   */
  const handleLogin = async (
    data: LoginInput,
  ): Promise<{ ok: boolean; memoirCount: number }> => {
    startAuthAction();
    try {
      await api.login({ email: data.email, password: data.password });

      let memoirCount = 0;
      try {
        const memoirs = await api.getUserMemoirs();
        memoirCount = Array.isArray(memoirs) ? memoirs.length : 0;
      } catch (memoirCheckError) {
        // Login itself succeeded. Treat an unreadable memoir list as "none"
        // so the caller sends them somewhere that can recover, rather than
        // stranding them on the form.
        console.error("Could not read memoirs after login", memoirCheckError);
      }

      return { ok: true, memoirCount };
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Could not sign you in.");
      return { ok: false, memoirCount: 0 };
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (
    data: SignupInput & { confirmPassword?: string },
  ): Promise<boolean> => {
    startAuthAction();
    try {
      const res = await api.signup({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
      });

      if (res.authenticated) return true;

      setSuccessMessage(
        "Account created. Please check your email to verify it, then sign in.",
      );
      return false;
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Could not create your account.",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await api.logout();
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      clearClientSideSessionState();
      router.push("/signin");
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

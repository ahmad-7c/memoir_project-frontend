"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";

/**
 * Resolves which memoir is "active" for the signed-in owner, shared by
 * /memories and /chapters (previously duplicated inline in the old single
 * dashboard page). localStorage's `active_memoir` is only ever written by
 * the login/signup flow -- if the browser previously signed in as a
 * different account, that cached id can silently point at a memoir the
 * *current* session's user doesn't own, and every write against it then
 * 403s with no visible explanation. Cross-checking against
 * GET /api/memoirs/ (authoritative for whoever the current token belongs
 * to) and correcting the cached value is what actually fixes that.
 */
export function useActiveMemoir() {
  const [memoirId, setMemoirId] = useState("");
  const [name, setName] = useState("");
  const [dates, setDates] = useState("");

  useEffect(() => {
    const applyMemoir = (data: Record<string, unknown>) => {
      if (typeof data.id === "string") setMemoirId(data.id);
      if (typeof data.subject_name === "string") setName(data.subject_name);
      else if (typeof data.name === "string") setName(data.name);

      if (typeof data.dates === "string") {
        setDates(data.dates);
      } else if (data.subject_born_on || data.subject_died_on || data.dob || data.dod) {
        const born = (data.subject_born_on || data.dob) as string | undefined;
        const died = (data.subject_died_on || data.dod) as string | undefined;
        const dobYear = born ? new Date(born).getFullYear() : "";
        const dodYear = died ? new Date(died).getFullYear() : "Present";
        if (dobYear || dodYear !== "Present") setDates(`${dobYear} — ${dodYear}`);
      }
    };

    const resolveMemoir = async () => {
      let cached: Record<string, unknown> | null = null;
      try {
        const stored = localStorage.getItem("active_memoir");
        if (stored) {
          const parsed = JSON.parse(stored);
          cached = (parsed.data || parsed) as Record<string, unknown>;
        }
      } catch (e) {
        console.error("Could not parse cached active_memoir", e);
      }

      try {
        const memoirs = await api.getUserMemoirs();
        const cachedId = cached?.id as string | undefined;
        const stillValid = cachedId && memoirs.some((m: { id: string }) => m.id === cachedId);

        if (stillValid && cached) {
          applyMemoir(cached);
        } else if (memoirs.length > 0) {
          localStorage.setItem("active_memoir", JSON.stringify(memoirs[0]));
          applyMemoir(memoirs[0]);
        } else if (cached) {
          applyMemoir(cached);
        }
      } catch (e) {
        console.error("Could not verify active memoir against the current account", e);
        if (cached) applyMemoir(cached);
      }
    };

    resolveMemoir();
  }, []);

  return { memoirId, name, dates, setName, setDates };
}

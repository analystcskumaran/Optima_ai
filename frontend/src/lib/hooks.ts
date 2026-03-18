"use client";

/**
 * hooks.ts — Custom React hooks for Optima.
 *
 * PURPOSE: Centralizes shared logic that multiple components need.
 *   Instead of repeating localStorage reads in every component, we define
 *   them once here as hooks.
 *
 * WHAT IS A CUSTOM HOOK?
 *   A function that starts with "use" and can call other hooks inside it.
 *   It lets you extract and REUSE stateful logic across multiple components.
 */

import { useState, useEffect } from "react";
import type { UserRole, UserPurpose, UserPreferences } from "./schemas";

const ROLE_KEY = "optima_role";
const PURPOSE_KEY = "optima_purpose";

// ─── useRole ──────────────────────────────────────────────────────────────────
/**
 * Reads the user's experience role and purpose from localStorage.
 * Returns helper functions and tailored copy text.
 *
 * Example:
 *   const { role, copy } = useRole();
 *   <p>{copy.cleanButtonLabel}</p>
 *   // Beginner: "Clean My Data"  |  Senior: "Execute Cleaning Plan"
 */
export function useRole() {
  const [prefs, setPrefs] = useState<UserPreferences>({
    role: "beginner",
    purpose: "cleaning",
  });

  // Read from localStorage once on mount (client-side only)
  useEffect(() => {
    const role = (localStorage.getItem(ROLE_KEY) as UserRole) || "beginner";
    const purpose = (localStorage.getItem(PURPOSE_KEY) as UserPurpose) || "cleaning";
    setPrefs({ role, purpose });
  }, []);

  const savePrefs = (role: UserRole, purpose: UserPurpose) => {
    localStorage.setItem(ROLE_KEY, role);
    localStorage.setItem(PURPOSE_KEY, purpose);
    setPrefs({ role, purpose });
  };

  /** Tailored text copy: changes based on role */
  const copy = {
    // Landing screen
    heroTagline:
      prefs.role === "senior"
        ? "Professional data engineering pipeline"
        : prefs.role === "intermediate"
        ? "AI-assisted data cleaning & diagnosis"
        : "Clean your messy data with one click",

    // Cleaning buttons
    cleanButtonLabel:
      prefs.role === "senior" ? "Execute Cleaning Plan" : "Approve & Clean Data",

    // Diagnostic CTA
    diagnoseCTA:
      prefs.role === "beginner"
        ? "Check my data for issues"
        : "Run AI Diagnostic Report",

    // Chat placeholder
    chatPlaceholder:
      prefs.role === "senior"
        ? "e.g. Apply IQR outlier removal on 'price', then impute 'category' with mode..."
        : "e.g. Fix missing values, remove duplicates, clean my dates...",

    // Verbosity: seniors see more detail
    showAdvancedOptions: prefs.role === "senior",
    showMetrics: prefs.role !== "beginner",
    showJsonPlan: prefs.role === "senior",
  };

  return { ...prefs, copy, savePrefs };
}

// ─── useOnboarding ────────────────────────────────────────────────────────────
/**
 * Returns whether the user has completed the onboarding questionnaire.
 * If the localStorage key is missing, onboarding is not done.
 */
export function useOnboarding() {
  const [done, setDone] = useState(true); // default true to avoid flash on load

  useEffect(() => {
    const hasRole = !!localStorage.getItem(ROLE_KEY);
    setDone(hasRole);
  }, []);

  const completeOnboarding = (role: UserRole, purpose: UserPurpose) => {
    localStorage.setItem(ROLE_KEY, role);
    localStorage.setItem(PURPOSE_KEY, purpose);
    setDone(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(PURPOSE_KEY);
    setDone(false);
  };

  return { done, completeOnboarding, resetOnboarding };
}

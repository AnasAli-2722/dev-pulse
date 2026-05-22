"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Utility for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedUsername = useDebounce(username, 400);

  // Validate format (lowercase only)
  const isValidFormat = (val: string) => /^[a-z0-9_]{3,15}$/.test(val);

  useEffect(() => {
    async function checkAvailability() {
      const val = debouncedUsername.trim();

      if (!val) {
        setStatus("idle");
        setErrorMessage("");
        return;
      }

      if (!isValidFormat(val)) {
        setStatus("invalid");
        if (val.length < 3) setErrorMessage("Username must be at least 3 characters.");
        else if (val.length > 15) setErrorMessage("Username cannot exceed 15 characters.");
        else setErrorMessage("Only lowercase letters, numbers, and underscores are allowed (no spaces).");
        return;
      }

      setStatus("checking");
      setErrorMessage("");

      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", val)
        .maybeSingle();

      if (error) {
        console.error("Availability check error:", error);
        setStatus("idle");
      } else if (data) {
        setStatus("taken");
        setErrorMessage("This username is already taken.");
      } else {
        setStatus("available");
      }
    }

    checkAvailability();
  }, [debouncedUsername, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "available") return;

    setIsSubmitting(true);
    const finalUsername = debouncedUsername.trim();

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Authentication error. Please sign in again.");

      const avatarUrl = user.user_metadata?.avatar_url ?? null;
      const fullName = user.user_metadata?.full_name ?? null;

      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username: finalUsername,
          full_name: fullName,
          avatar_url: avatarUrl,
        });

      if (insertError) throw insertError;

      // Force a hard refresh to the home page so proxy and layout update correctly
      window.location.href = "/";
    } catch (err: any) {
      console.error(err);
      setStatus("invalid");
      setErrorMessage(err.message || "Failed to save profile. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] pb-20 px-6">
      <div className="relative w-full max-w-md">
        <div className="pointer-events-none absolute -inset-10 z-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-accent/10 blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-3xl p-8 relative z-10 overflow-hidden shadow-2xl shadow-black/50"
        >
          {/* Decorative glow line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-white/10 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5)]">
              <svg className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Claim your username</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Welcome to Dev Pulse! Choose a unique username for your developer profile.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Username
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <span className="text-slate-500 font-mono">@</span>
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="e.g. anas_ali"
                  autoComplete="off"
                  autoFocus
                  spellCheck="false"
                  className={`input-field w-full rounded-xl border bg-slate-950/60 px-4 py-3.5 pl-9 text-sm text-white placeholder:text-slate-600 transition-all focus:outline-none focus:ring-2
                    ${status === "invalid" || status === "taken" 
                      ? "border-red-500/30 focus:border-red-500 focus:ring-red-500/20" 
                      : status === "available"
                        ? "border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20"
                        : "border-glass-border focus:border-accent focus:ring-accent/20"
                    }
                  `}
                />
                
                {/* Status Indicator Icon */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  {status === "checking" && (
                    <svg className="animate-spin h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {status === "available" && (
                    <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </motion.svg>
                  )}
                  {(status === "invalid" || status === "taken") && (
                    <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </motion.svg>
                  )}
                </div>
              </div>
              
              {/* Error Message */}
              <div className="min-h-[20px] mt-2">
                {(status === "invalid" || status === "taken") && errorMessage && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium text-red-400/90">
                    {errorMessage}
                  </motion.p>
                )}
                {status === "available" && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-medium text-emerald-400/90">
                    Username is available!
                  </motion.p>
                )}
                {status === "idle" && (
                  <p className="text-[11px] text-slate-500">
                    3-15 chars, alphanumeric & underscores only.
                  </p>
                )}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: status === "available" ? 0.97 : 1 }}
              type="submit"
              disabled={status !== "available" || isSubmitting}
              className={`relative w-full rounded-xl py-3.5 px-4 text-sm font-semibold text-white shadow-lg transition-all duration-200 cursor-pointer overflow-hidden
                ${status === "available" 
                  ? "bg-accent hover:bg-accent-hover shadow-indigo-500/25 hover:shadow-indigo-500/40" 
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/[0.04]"
                }
              `}
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </div>
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

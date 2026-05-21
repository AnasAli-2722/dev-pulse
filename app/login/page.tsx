"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
} from "./actions";

/* ─── Google SVG Icon ───────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ─── Loading Spinner ───────────────────────────────────────────── */
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/* ─── Main Auth Page ────────────────────────────────────────────── */
export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = isLogin
        ? await signInWithEmail(formData)
        : await signUpWithEmail(formData);

      if (result?.error) {
        setError(result.error);
      }
      if (result && "success" in result && result.success) {
        setSuccess(result.success);
      }
    });
  }

  async function handleGoogleSignIn() {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* ── Background orb ── */}
      <div className="auth-orb" />

      {/* ── Subtle grid pattern overlay ── */}
      <div
        className="fixed inset-0 z-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── Glass card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card relative z-10 w-full max-w-md rounded-2xl p-8 sm:p-10"
      >
        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="pulse-dot w-2.5 h-2.5 rounded-full bg-accent" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Dev Pulse
            </h1>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-2xl font-semibold text-foreground">
                {isLogin ? "Welcome back" : "Create an account"}
              </h2>
              <p className="text-sm text-muted mt-1">
                {isLogin
                  ? "Sign in to continue to your dashboard"
                  : "Start sharing code with the community"}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Error / Success messages ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Google OAuth button ── */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isPending}
          id="google-sign-in-btn"
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-glass-border bg-surface hover:bg-surface-hover px-4 py-3 text-sm font-medium text-foreground transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* ── Divider ── */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-glass-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[rgba(17,24,39,0.6)] px-3 text-muted">
              or continue with email
            </span>
          </div>
        </div>

        {/* ── Email/Password form ── */}
        <form action={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="fullname-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-muted mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  className="input-field w-full rounded-xl border border-glass-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/50 outline-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-muted mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="input-field w-full rounded-xl border border-glass-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/50 outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-muted mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
              className="input-field w-full rounded-xl border border-glass-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/50 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            id="auth-submit-btn"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-hover px-4 py-3 text-sm font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Spinner />
                {isLogin ? "Signing in…" : "Creating account…"}
              </>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* ── Toggle link ── */}
        <p className="text-center text-sm text-muted mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
            id="auth-toggle-btn"
            className="text-accent hover:text-accent-hover font-medium transition-colors cursor-pointer"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

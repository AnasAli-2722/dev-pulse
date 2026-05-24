"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Alert Banner                                                       */
/* ------------------------------------------------------------------ */

function Alert({
  type,
  text,
  onDismiss,
}: {
  type: "success" | "error" | "info";
  text: string;
  onDismiss?: () => void;
}) {
  const styles = {
    success: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    error: "bg-red-500/10 text-red-400 ring-red-500/20",
    info: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  };

  return (
    <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ring-1 flex items-center justify-between ${styles[type]}`}>
      <span>{text}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete Modal                                                       */
/* ------------------------------------------------------------------ */

function DeleteModal({
  open,
  onClose,
  onConfirm,
  deleting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl shadow-red-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Delete Account</h3>
            <p className="text-xs text-slate-500">This action is permanent and irreversible</p>
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          All your data — snippets, stars, and profile — will be permanently deleted. This cannot be undone.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Type <span className="text-red-400 font-mono">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full rounded-xl bg-slate-950/50 border border-red-500/20 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all font-mono"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors ring-1 ring-white/[0.06]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== "DELETE" || deleting}
            className="flex-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors ring-1 ring-red-500/30"
          >
            {deleting ? "Deleting..." : "Delete Forever"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SecurityPage() {
  const supabase = createClient();
  const router = useRouter();

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* ── Email Change ── */
  const handleEmailChange = async () => {
    if (!newEmail.trim()) return;
    setEmailSaving(true);
    setEmailMsg(null);

    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      setEmailMsg({ type: "error", text: error.message });
    } else {
      setEmailMsg({
        type: "info",
        text: "Confirmation link sent! Check both your old and new email inboxes to verify the change.",
      });
      setNewEmail("");
    }
    setEmailSaving(false);
  };

  /* ── Password Change ── */
  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      setPwMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setPwSaving(true);
    setPwMsg(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwMsg({ type: "error", text: error.message });
    } else {
      setPwMsg({ type: "success", text: "Password updated successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setPwSaving(false);
  };

  /* ── Delete Account ── */
  const handleDeleteAccount = async () => {
    setDeleting(true);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete profile (cascades in DB via foreign keys)
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      setDeleting(false);
      setShowDeleteModal(false);
      setEmailMsg({ type: "error", text: "Failed to delete account: " + profileError.message });
      return;
    }

    // Sign out
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      {/* ━━━ Email Change ━━━ */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Email Address</h2>
        <p className="text-xs text-slate-500 mb-5">Update your email. You'll need to confirm on both addresses.</p>

        {emailMsg && <div className="mb-4"><Alert type={emailMsg.type} text={emailMsg.text} onDismiss={() => setEmailMsg(null)} /></div>}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new-email@example.com"
            className="flex-1 rounded-xl bg-slate-950/50 border border-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
          />
          <button
            onClick={handleEmailChange}
            disabled={emailSaving || !newEmail.trim()}
            className="shrink-0 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
          >
            {emailSaving ? "Sending..." : "Update Email"}
          </button>
        </div>
      </div>

      {/* ━━━ Password Change ━━━ */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Password</h2>
        <p className="text-xs text-slate-500 mb-5">Set a new password. Must be at least 8 characters.</p>

        {pwMsg && <div className="mb-4"><Alert type={pwMsg.type} text={pwMsg.text} onDismiss={() => setPwMsg(null)} /></div>}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-slate-950/50 border border-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-slate-950/50 border border-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
            />
          </div>

          {/* Strength indicator */}
          {newPassword && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    newPassword.length >= 12
                      ? "w-full bg-emerald-400"
                      : newPassword.length >= 8
                        ? "w-2/3 bg-amber-400"
                        : "w-1/3 bg-red-400"
                  }`}
                />
              </div>
              <span className={`text-[10px] font-medium ${
                newPassword.length >= 12
                  ? "text-emerald-400"
                  : newPassword.length >= 8
                    ? "text-amber-400"
                    : "text-red-400"
              }`}>
                {newPassword.length >= 12 ? "Strong" : newPassword.length >= 8 ? "Fair" : "Weak"}
              </span>
            </div>
          )}

          <button
            onClick={handlePasswordChange}
            disabled={pwSaving || newPassword.length < 8}
            className="w-full rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
          >
            {pwSaving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>

      {/* ━━━ Danger Zone ━━━ */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6">
        <div className="flex items-center gap-2 mb-1">
          <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Permanently delete your account and all associated data. This action cannot be reversed.
        </p>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="rounded-xl bg-red-500/15 hover:bg-red-500/25 px-5 py-2.5 text-sm font-semibold text-red-400 transition-colors ring-1 ring-red-500/30 hover:ring-red-500/50"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        deleting={deleting}
      />
    </div>
  );
}

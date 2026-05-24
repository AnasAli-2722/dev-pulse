"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    bio: "",
    github_url: "",
    linkedin_url: "",
    instagram_url: "",
    email_public: "",
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, bio, github_url, linkedin_url, instagram_url, email_public")
        .eq("id", user.id)
        .single();
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          bio: data.bio ?? "",
          github_url: data.github_url ?? "",
          linkedin_url: data.linkedin_url ?? "",
          instagram_url: data.instagram_url ?? "",
          email_public: data.email_public ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        bio: form.bio || null,
        github_url: form.github_url || null,
        linkedin_url: form.linkedin_url || null,
        instagram_url: form.instagram_url || null,
        email_public: form.email_public || null,
      })
      .eq("id", user.id);

    setMessage(error ? { type: "error", text: error.message } : { type: "success", text: "Profile updated!" });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 animate-pulse space-y-4">
        <div className="h-5 w-32 rounded bg-slate-800/40" />
        <div className="h-10 w-full rounded-xl bg-slate-800/30" />
        <div className="h-10 w-full rounded-xl bg-slate-800/30" />
        <div className="h-24 w-full rounded-xl bg-slate-800/30" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      <h2 className="text-lg font-semibold text-white">Profile</h2>

      {message && (
        <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20" : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"}`}>
          {message.text}
        </div>
      )}

      <Field label="Full Name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} placeholder="Your name" />
      <Field label="Public Email" value={form.email_public} onChange={(v) => setForm({ ...form, email_public: v })} placeholder="hello@example.com" type="email" />

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Bio</label>
        <textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={3}
          maxLength={160}
          placeholder="A short bio about yourself..."
          className="w-full rounded-xl bg-slate-950/50 border border-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all resize-none"
        />
        <p className="mt-1 text-[10px] text-slate-600 text-right">{form.bio.length}/160</p>
      </div>

      <div className="h-px bg-white/[0.06]" />
      <h3 className="text-sm font-medium text-slate-300">Social Links</h3>

      <Field label="GitHub" value={form.github_url} onChange={(v) => setForm({ ...form, github_url: v })} placeholder="https://github.com/username" />
      <Field label="LinkedIn" value={form.linkedin_url} onChange={(v) => setForm({ ...form, linkedin_url: v })} placeholder="https://linkedin.com/in/username" />
      <Field label="Instagram" value={form.instagram_url} onChange={(v) => setForm({ ...form, instagram_url: v })} placeholder="https://instagram.com/username" />

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-slate-950/50 border border-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
      />
    </div>
  );
}

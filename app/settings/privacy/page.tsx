"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/*  Select dropdown                                                    */
/* ------------------------------------------------------------------ */

function SelectField({
  label,
  description,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-4 py-4
                  bg-slate-950/50
                  shadow-[inset_1px_1px_4px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]
                  ring-1 ring-white/[0.04]"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="shrink-0 rounded-xl bg-slate-900/80 border border-white/[0.08] px-3 py-2 text-sm text-white
                   focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all cursor-pointer
                   disabled:opacity-50 disabled:cursor-not-allowed
                   appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M1%201.5L6%206.5L11%201.5%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')]
                   bg-no-repeat bg-[right_12px_center] pr-9"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Privacy Config                                                     */
/* ------------------------------------------------------------------ */

type PrivacyKey = "profile_visibility" | "default_snippet_visibility" | "who_can_comment";

const PRIVACY_CONFIG: {
  key: PrivacyKey;
  label: string;
  description: string;
  options: { value: string; label: string }[];
}[] = [
  {
    key: "profile_visibility",
    label: "Profile Visibility",
    description: "Control who can see your profile page",
    options: [
      { value: "public", label: "Public" },
      { value: "private", label: "Private" },
    ],
  },
  {
    key: "default_snippet_visibility",
    label: "Default Snippet Visibility",
    description: "Default visibility for new snippets",
    options: [
      { value: "public", label: "Public" },
      { value: "unlisted", label: "Unlisted" },
      { value: "private", label: "Private" },
    ],
  },
  {
    key: "who_can_comment",
    label: "Who Can Comment",
    description: "Control who can leave comments on your snippets",
    options: [
      { value: "everyone", label: "Everyone" },
      { value: "followers", label: "Followers Only" },
      { value: "nobody", label: "Nobody" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PrivacyPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<PrivacyKey, string>>({
    profile_visibility: "public",
    default_snippet_visibility: "public",
    who_can_comment: "everyone",
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("profile_visibility, default_snippet_visibility, who_can_comment")
        .eq("id", user.id)
        .single();
      if (data) {
        setSettings({
          profile_visibility: data.profile_visibility ?? "public",
          default_snippet_visibility: data.default_snippet_visibility ?? "public",
          who_can_comment: data.who_can_comment ?? "everyone",
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleChange = async (key: PrivacyKey, value: string) => {
    const prev = { ...settings };
    setSettings((s) => ({ ...s, [key]: value }));
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ [key]: value })
      .eq("id", user.id);

    if (error) {
      setSettings(prev); // rollback
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 animate-pulse space-y-3">
        <div className="h-5 w-32 rounded bg-slate-800/40 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 w-full rounded-xl bg-slate-800/30" />
        ))}
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Privacy</h2>
      <p className="text-xs text-slate-500 mb-6">Control your visibility and who can interact with you.</p>

      <div className="space-y-2.5">
        {PRIVACY_CONFIG.map((item) => (
          <SelectField
            key={item.key}
            label={item.label}
            description={item.description}
            value={settings[item.key]}
            onChange={(v) => handleChange(item.key, v)}
            options={item.options}
            disabled={saving}
          />
        ))}
      </div>
    </div>
  );
}

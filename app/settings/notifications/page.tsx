"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/*  Toggle Switch                                                      */
/* ------------------------------------------------------------------ */

function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50
                  ${enabled ? "bg-accent" : "bg-slate-700"}
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200
                    ${enabled ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Notification Row                                                   */
/* ------------------------------------------------------------------ */

function NotificationRow({
  title,
  description,
  enabled,
  onChange,
  saving,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  saving: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5
                    bg-slate-950/50
                    shadow-[inset_1px_1px_4px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]
                    ring-1 ring-white/[0.04]">
      <div>
        <p className="text-sm font-medium text-slate-200">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
      </div>
      <Toggle enabled={enabled} onChange={onChange} disabled={saving} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

type NotifKeys = "notify_likes" | "notify_comments" | "notify_forks" | "notify_followers";

const NOTIF_CONFIG: { key: NotifKeys; title: string; description: string }[] = [
  { key: "notify_likes", title: "Likes", description: "When someone stars your snippet" },
  { key: "notify_comments", title: "Comments", description: "When someone comments on your snippet" },
  { key: "notify_forks", title: "Forks", description: "When someone forks your snippet" },
  { key: "notify_followers", title: "Followers", description: "When someone follows your profile" },
];

export default function NotificationsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<NotifKeys, boolean>>({
    notify_likes: true,
    notify_comments: true,
    notify_forks: true,
    notify_followers: true,
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("notify_likes, notify_comments, notify_forks, notify_followers")
        .eq("id", user.id)
        .single();
      if (data) {
        setSettings({
          notify_likes: data.notify_likes ?? true,
          notify_comments: data.notify_comments ?? true,
          notify_forks: data.notify_forks ?? true,
          notify_followers: data.notify_followers ?? true,
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleToggle = async (key: NotifKeys, value: boolean) => {
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
        <div className="h-5 w-40 rounded bg-slate-800/40 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 w-full rounded-xl bg-slate-800/30" />
        ))}
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Notifications</h2>
      <p className="text-xs text-slate-500 mb-6">Choose what you want to be notified about.</p>

      <div className="space-y-2.5">
        {NOTIF_CONFIG.map((item) => (
          <NotificationRow
            key={item.key}
            title={item.title}
            description={item.description}
            enabled={settings[item.key]}
            onChange={(v) => handleToggle(item.key, v)}
            saving={saving}
          />
        ))}
      </div>
    </div>
  );
}

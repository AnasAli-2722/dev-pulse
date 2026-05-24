"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface IdentityPanelProps {
  profile: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    reputation: number | null;
    created_at: string | null;
  };
  totalSnippets: number;
  totalStars: number;
  totalForks: number;
  isOwnProfile: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function IdentityPanel({
  profile,
  totalSnippets,
  totalStars,
  totalForks,
  isOwnProfile,
}: IdentityPanelProps) {
  const reputation = profile.reputation ?? 0;
  const initials = profile.username.charAt(0).toUpperCase();

  // Determine ring glow color intensity based on reputation
  const glowColor =
    reputation >= 500
      ? "from-amber-400 via-yellow-300 to-amber-500"
      : reputation >= 100
        ? "from-indigo-400 via-purple-400 to-indigo-500"
        : "from-slate-500 via-slate-400 to-slate-500";

  const credibilityStats = [
    {
      label: "Stars",
      value: totalStars,
      icon: (
        <svg className="h-4 w-4 text-amber-400/70" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ),
      gradient: "from-amber-500/[0.06]",
    },
    {
      label: "Forks",
      value: totalForks,
      icon: (
        <svg className="h-4 w-4 text-cyan-400/70" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
        </svg>
      ),
      gradient: "from-cyan-500/[0.06]",
    },
    {
      label: "Reputation",
      value: reputation,
      icon: (
        <svg className="h-4 w-4 text-purple-400/70" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      ),
      gradient: "from-purple-500/[0.06]",
    },
  ];

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle ambient glow behind the panel */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-500/[0.04] to-transparent" />

        {/* ── Avatar with animated glow ring ── */}
        <div className="relative mb-5">
          {/* Animated spinning gradient ring */}
          <motion.div
            className={`absolute -inset-1 rounded-full bg-gradient-to-r ${glowColor} opacity-60 blur-[3px]`}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          {/* Static ring underneath for stability */}
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-white/10 to-white/5" />

          {/* Avatar */}
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-900 shadow-xl shadow-black/40"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 ring-2 ring-slate-900 text-4xl font-bold text-indigo-300 shadow-xl shadow-black/40">
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* ── Name & Username ── */}
        <div className="relative z-10 mb-1">
          <h1 className="text-xl font-bold text-white leading-tight">
            {profile.full_name || profile.username}
          </h1>
          <p className="mt-1 text-sm text-slate-400 font-medium">
            @{profile.username}
          </p>
          {isOwnProfile && (
            <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent/15 text-accent ring-1 ring-accent/30">
              You
            </span>
          )}
        </div>

        {/* ── Bio ── */}
        {profile.bio && (
          <p className="relative z-10 mt-3 text-xs text-slate-400 leading-relaxed line-clamp-3 max-w-[220px]">
            {profile.bio}
          </p>
        )}

        {/* ── Joined date ── */}
        <div className="relative z-10 mt-4 mb-5 flex items-center gap-1.5 text-[11px] text-slate-500">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          Joined {formatDate(profile.created_at)}
        </div>

        {/* ── Divider ── */}
        <div className="relative z-10 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5" />

        {/* ── Credibility Stack ── */}
        <div className="relative z-10 w-full space-y-2.5">
          {credibilityStats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02 }}
              className={`flex items-center justify-between rounded-xl px-4 py-3
                          bg-slate-950/50
                          shadow-[inset_1px_1px_4px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]
                          ring-1 ring-white/[0.04]
                          transition-all duration-200 hover:ring-white/[0.08]`}
            >
              <div className="flex items-center gap-2.5">
                {stat.icon}
                <span className="text-xs font-medium text-slate-400">{stat.label}</span>
              </div>
              <span className="text-sm font-bold text-white tabular-nums">
                {formatNumber(stat.value)}
              </span>
            </motion.div>
          ))}

          {/* Total Snippets row */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between rounded-xl px-4 py-3
                        bg-slate-950/50
                        shadow-[inset_1px_1px_4px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]
                        ring-1 ring-white/[0.04]
                        transition-all duration-200 hover:ring-white/[0.08]"
          >
            <div className="flex items-center gap-2.5">
              <svg className="h-4 w-4 text-emerald-400/70" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
              </svg>
              <span className="text-xs font-medium text-slate-400">Snippets</span>
            </div>
            <span className="text-sm font-bold text-white tabular-nums">
              {formatNumber(totalSnippets)}
            </span>
          </motion.div>
        </div>

        {/* ── Edit Profile button ── */}
        {isOwnProfile && (
          <Link
            href="/profile/edit"
            className="relative z-10 mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-glass-border px-4 py-2.5 text-xs font-medium text-slate-300 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Edit Profile
          </Link>
        )}
      </div>
    </aside>
  );
}

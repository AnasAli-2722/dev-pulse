"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LeaderboardEntry {
  rank: number;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  reputation: number;
  total_stars: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function getTierGlow(rank: number) {
  if (rank === 1) return "ring-amber-400/40 shadow-amber-400/20";
  if (rank === 2) return "ring-slate-300/30 shadow-slate-300/15";
  if (rank === 3) return "ring-amber-600/30 shadow-amber-700/15";
  if (rank <= 10) return "ring-purple-500/20 shadow-purple-500/10";
  return "ring-white/[0.06] shadow-black/20";
}

function getTierDot(rank: number) {
  if (rank <= 3) return "bg-amber-400";
  if (rank <= 10) return "bg-purple-400";
  if (rank <= 25) return "bg-blue-400";
  return "bg-slate-500";
}

function getRankLabel(rank: number) {
  if (rank <= 3) return "text-amber-400";
  if (rank <= 10) return "text-purple-400";
  if (rank <= 25) return "text-blue-400";
  return "text-slate-500";
}

/* ------------------------------------------------------------------ */
/*  Podium Card (Top 3)                                                */
/* ------------------------------------------------------------------ */

const podiumMeta: Record<number, {
  label: string;
  gradient: string;
  ringColor: string;
  glow: string;
  iconColor: string;
  scale: string;
  order: string;
}> = {
  1: {
    label: "1st",
    gradient: "from-amber-500/10 via-yellow-500/5 to-transparent",
    ringColor: "ring-amber-400/50",
    glow: "shadow-[0_0_40px_rgba(251,191,36,0.15)]",
    iconColor: "text-amber-400",
    scale: "lg:scale-105 lg:-translate-y-3",
    order: "order-2 lg:order-2",
  },
  2: {
    label: "2nd",
    gradient: "from-slate-300/10 via-slate-400/5 to-transparent",
    ringColor: "ring-slate-300/30",
    glow: "shadow-[0_0_30px_rgba(148,163,184,0.1)]",
    iconColor: "text-slate-300",
    scale: "",
    order: "order-1 lg:order-1",
  },
  3: {
    label: "3rd",
    gradient: "from-amber-700/10 via-amber-800/5 to-transparent",
    ringColor: "ring-amber-600/30",
    glow: "shadow-[0_0_30px_rgba(180,83,9,0.1)]",
    iconColor: "text-amber-600",
    scale: "",
    order: "order-3 lg:order-3",
  },
};

function PodiumCard({ entry }: { entry: LeaderboardEntry }) {
  const meta = podiumMeta[entry.rank];
  const initials = entry.username.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: entry.rank * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`${meta.order} ${meta.scale}`}
    >
      <Link href={`/profile/${entry.username}`}>
        <div
          className={`glass-card rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden
                      transition-all duration-300 hover:scale-[1.03] cursor-pointer
                      ${meta.glow}`}
        >
          {/* Gradient overlay */}
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${meta.gradient}`} />

          {/* Rank badge */}
          <div className={`relative z-10 mb-4 flex h-8 w-8 items-center justify-center rounded-full
                           bg-slate-900/80 ring-2 ${meta.ringColor} text-sm font-bold ${meta.iconColor}`}>
            {entry.rank}
          </div>

          {/* Avatar with glow ring */}
          <div className="relative mb-3">
            <motion.div
              className={`absolute -inset-1 rounded-full opacity-60 blur-[2px] ${
                entry.rank === 1
                  ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"
                  : entry.rank === 2
                    ? "bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300"
                    : "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700"
              }`}
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative">
              {entry.avatar_url ? (
                <img
                  src={entry.avatar_url}
                  alt={entry.username}
                  className={`h-16 w-16 rounded-full object-cover ring-2 ring-slate-900 shadow-xl shadow-black/40
                              ${entry.rank === 1 ? "h-20 w-20" : ""}`}
                />
              ) : (
                <div
                  className={`flex items-center justify-center rounded-full bg-gradient-to-br
                              from-indigo-500/30 to-purple-500/30 ring-2 ring-slate-900 font-bold text-indigo-300
                              shadow-xl shadow-black/40
                              ${entry.rank === 1 ? "h-20 w-20 text-3xl" : "h-16 w-16 text-2xl"}`}
                >
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="relative z-10">
            <h3 className="text-base font-bold text-white truncate max-w-[140px]">
              {entry.full_name || entry.username}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">@{entry.username}</p>
          </div>

          {/* Stats */}
          <div className="relative z-10 mt-4 flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-extrabold text-white tabular-nums">
                {formatNumber(entry.reputation)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Rep</p>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-extrabold text-white tabular-nums">
                {formatNumber(entry.total_stars)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Stars</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ranked Row (4–50)                                                  */
/* ------------------------------------------------------------------ */

function RankedRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const initials = entry.username.charAt(0).toUpperCase();
  const tierGlow = getTierGlow(entry.rank);
  const tierDot = getTierDot(entry.rank);
  const rankColor = getRankLabel(entry.rank);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, scale: 1.008 }}
    >
      <Link href={`/profile/${entry.username}`}>
        <div
          className={`flex items-center gap-4 rounded-xl px-5 py-3.5
                      bg-slate-950/50 backdrop-blur-sm
                      shadow-[inset_1px_1px_4px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]
                      ring-1 ${tierGlow}
                      transition-all duration-200 hover:ring-white/[0.12] hover:bg-slate-900/50
                      cursor-pointer group`}
        >
          {/* Rank */}
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                           bg-slate-900/60 text-sm font-bold tabular-nums ${rankColor}`}>
            {entry.rank}
          </div>

          {/* Tier dot */}
          <div className={`h-2 w-2 shrink-0 rounded-full ${tierDot} opacity-70`} />

          {/* Avatar */}
          {entry.avatar_url ? (
            <img
              src={entry.avatar_url}
              alt={entry.username}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-400 ring-1 ring-indigo-500/20">
              {initials}
            </div>
          )}

          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
              {entry.full_name || entry.username}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">@{entry.username}</p>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1.5 shrink-0">
            <svg className="h-3.5 w-3.5 text-amber-400/60" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
            </svg>
            <span className="text-xs text-slate-400 tabular-nums font-medium">
              {formatNumber(entry.total_stars)}
            </span>
          </div>

          {/* Reputation */}
          <div className="shrink-0 text-right min-w-[60px]">
            <p className="text-sm font-bold text-white tabular-nums">
              {formatNumber(entry.reputation)}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-slate-600 font-medium">REP</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Client Shell                                                  */
/* ------------------------------------------------------------------ */

interface LeaderboardClientProps {
  entries: LeaderboardEntry[];
}

export default function LeaderboardClient({ entries }: LeaderboardClientProps) {
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div>
      {/* ── Podium ── */}
      {top3.length > 0 && (
        <section className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 lg:items-end">
            {top3.map((entry) => (
              <PodiumCard key={entry.username} entry={entry} />
            ))}
          </div>
        </section>
      )}

      {/* ── Ranked Ladder ── */}
      {rest.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Ranked Ladder
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          <div className="space-y-2.5">
            {rest.map((entry, i) => (
              <RankedRow key={entry.username} entry={entry} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty State ── */}
      {entries.length === 0 && (
        <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 ring-1 ring-white/[0.06] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5)]">
            <svg className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-4.5A3.375 3.375 0 0 0 13.125 10.875h-2.25A3.375 3.375 0 0 0 7.5 14.25v4.5m9-9V6a3 3 0 0 0-3-3H10.5a3 3 0 0 0-3 3v3.75" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-slate-300">No developers ranked yet</h3>
          <p className="mt-1 text-xs text-slate-500">Be the first to climb the leaderboard!</p>
        </div>
      )}
    </div>
  );
}

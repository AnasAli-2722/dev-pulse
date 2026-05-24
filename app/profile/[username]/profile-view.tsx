"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import SnippetCard from "@/app/components/snippet-card";
import type { SnippetWithAuthor } from "@/app/components/snippet-card";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ProfileData {
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  reputation: number;
  created_at: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  email_public: string | null;
}

export interface ProfileViewProps {
  profile: ProfileData;
  snippets: SnippetWithAuthor[];
  starredSnippets: SnippetWithAuthor[];
  totalStars: number;
  isOwnProfile: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Heatmap Component                                                  */
/* ------------------------------------------------------------------ */

function ActivityHeatmap({ snippets }: { snippets: SnippetWithAuthor[] }) {
  // Build real activity data from snippet creation dates
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    snippets.forEach((s) => {
      if (s.created_at) {
        const day = s.created_at.slice(0, 10);
        map.set(day, (map.get(day) ?? 0) + 1);
      }
      if (s.updated_at && s.updated_at !== s.created_at) {
        const day = s.updated_at.slice(0, 10);
        map.set(day, (map.get(day) ?? 0) + 1);
      }
    });
    return map;
  }, [snippets]);

  // Generate last 20 weeks of dates (140 days)
  const weeks = useMemo(() => {
    const result: string[][] = [];
    const today = new Date();
    const totalDays = 140;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);
    // Align to start of week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentDate = new Date(startDate);
    let currentWeek: string[] = [];

    while (currentDate <= today) {
      currentWeek.push(currentDate.toISOString().slice(0, 10));
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    return result;
  }, []);

  const getIntensity = (dateStr: string) => {
    const count = activityMap.get(dateStr) ?? 0;
    if (count === 0) return "bg-slate-800/60";
    if (count === 1) return "bg-emerald-500/30";
    if (count === 2) return "bg-emerald-500/50";
    if (count <= 4) return "bg-emerald-400/70";
    return "bg-emerald-400";
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="glass-card rounded-2xl p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300">Activity</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="h-2.5 w-2.5 rounded-[3px] bg-slate-800/60" />
            <div className="h-2.5 w-2.5 rounded-[3px] bg-emerald-500/30" />
            <div className="h-2.5 w-2.5 rounded-[3px] bg-emerald-500/50" />
            <div className="h-2.5 w-2.5 rounded-[3px] bg-emerald-400/70" />
            <div className="h-2.5 w-2.5 rounded-[3px] bg-emerald-400" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-[3px] min-w-fit">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day}
                  className={`h-[11px] w-[11px] rounded-[3px] ${getIntensity(day)} transition-colors ring-1 ring-inset ring-white/[0.03]`}
                  title={`${day}: ${activityMap.get(day) ?? 0} contributions`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Social Links                                                       */
/* ------------------------------------------------------------------ */

interface SocialLink {
  label: string;
  url: string | null;
  icon: React.ReactNode;
}

function SocialLinks({ profile }: { profile: ProfileData }) {
  const links: SocialLink[] = [
    {
      label: "GitHub",
      url: profile.github_url,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      url: profile.linkedin_url,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      url: profile.instagram_url,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
    {
      label: "Email",
      url: profile.email_public ? `mailto:${profile.email_public}` : null,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {links.map((link) => {
        const isActive = !!link.url;
        const Wrapper = isActive ? "a" : "span";
        return (
          <Wrapper
            key={link.label}
            {...(isActive ? { href: link.url!, target: "_blank", rel: "noopener noreferrer" } : {})}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200
                        ${isActive
                ? "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white ring-1 ring-white/[0.06] hover:ring-white/[0.12] cursor-pointer"
                : "bg-slate-900/40 text-slate-600 ring-1 ring-white/[0.03] cursor-default"
              }`}
            title={isActive ? link.label : `${link.label} (not set)`}
          >
            {link.icon}
          </Wrapper>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "snippets", label: "All Snippets" },
  { id: "starred", label: "Starred" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ------------------------------------------------------------------ */
/*  Main ProfileView                                                   */
/* ------------------------------------------------------------------ */

export default function ProfileView({
  profile,
  snippets,
  starredSnippets,
  totalStars,
  isOwnProfile,
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const reputation = profile.reputation;
  const initials = profile.username.charAt(0).toUpperCase();

  // Reputation ring color
  const glowColor =
    reputation >= 500
      ? "from-amber-400 via-yellow-300 to-amber-500"
      : reputation >= 100
        ? "from-indigo-400 via-purple-400 to-indigo-500"
        : "from-slate-500 via-slate-400 to-slate-500";

  // Top snippets by stars for overview
  const topSnippets = useMemo(
    () => [...snippets].sort((a, b) => (b.star_count ?? 0) - (a.star_count ?? 0)).slice(0, 2),
    [snippets]
  );

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-6 pt-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/*  LEFT COLUMN — Identity Panel (sticky)                       */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <aside className="lg:col-span-3 lg:sticky lg:top-20 lg:self-start">
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-500/[0.04] to-transparent" />

            {/* Avatar with glow ring */}
            <div className="relative mb-5">
              <motion.div
                className={`absolute -inset-1 rounded-full bg-gradient-to-r ${glowColor} opacity-60 blur-[3px]`}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-white/10 to-white/5" />
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

            {/* Name & Username */}
            <div className="relative z-10 mb-1">
              <h1 className="text-xl font-bold text-white leading-tight">
                {profile.full_name || profile.username}
              </h1>
              <p className="mt-1 text-sm text-slate-400 font-medium">@{profile.username}</p>
              {isOwnProfile && (
                <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent/15 text-accent ring-1 ring-accent/30">
                  You
                </span>
              )}
            </div>

            {/* Bio */}
            {profile.bio ? (
              <p className="relative z-10 mt-3 text-xs text-slate-400 leading-relaxed line-clamp-4 max-w-[220px]">
                {profile.bio}
              </p>
            ) : (
              <p className="relative z-10 mt-3 text-[11px] text-slate-600 italic">
                No bio yet
              </p>
            )}

            {/* Joined */}
            <div className="relative z-10 mt-4 mb-4 flex items-center gap-1.5 text-[11px] text-slate-500">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              Joined {formatDate(profile.created_at)}
            </div>

            {/* Compact Stats Row */}
            <div className="relative z-10 w-full">
              <div
                className="flex items-center justify-around rounded-xl py-3 px-2
                            bg-slate-950/50
                            shadow-[inset_1px_1px_4px_rgba(0,0,0,0.4),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]
                            ring-1 ring-white/[0.04]"
              >
                <div className="text-center px-2">
                  <p className="text-base font-bold text-white tabular-nums">{formatNumber(reputation)}</p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Rep</p>
                </div>
                <div className="h-6 w-px bg-white/[0.06]" />
                <div className="text-center px-2">
                  <p className="text-base font-bold text-white tabular-nums">{formatNumber(totalStars)}</p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Stars</p>
                </div>
                <div className="h-6 w-px bg-white/[0.06]" />
                <div className="text-center px-2">
                  <p className="text-base font-bold text-white tabular-nums">{formatNumber(snippets.length)}</p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Snippets</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="relative z-10 w-full mt-4 pt-4 border-t border-white/[0.06]">
              <SocialLinks profile={profile} />
            </div>

            {/* Edit Profile */}
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="relative z-10 mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-glass-border px-4 py-2.5 text-xs font-medium text-slate-300 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                Edit Profile
              </Link>
            )}
          </div>
        </aside>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/*  RIGHT COLUMN — Action Hub                                   */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="lg:col-span-9 space-y-6">
          {/* ── Heatmap ── */}
          <ActivityHeatmap snippets={snippets} />

          {/* ── Tab Bar ── */}
          <div className="sticky top-[3.5rem] z-30 -mx-1 px-1 pt-2 pb-1 bg-background/80 backdrop-blur-xl">
            <div
              className="relative flex rounded-xl p-1
                          bg-slate-950/60
                          shadow-[inset_1px_1px_4px_rgba(0,0,0,0.5),inset_-1px_-1px_3px_rgba(255,255,255,0.02)]
                          ring-1 ring-white/[0.04]"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-colors z-10
                              ${activeTab === tab.id ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-lg bg-accent/20 ring-1 ring-accent/30"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  {tab.id === "starred" && (
                    <span className="relative z-10 ml-1.5 text-[10px] text-slate-500 tabular-nums">
                      {starredSnippets.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab Content ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* ── Overview Tab ── */}
              {activeTab === "overview" && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-slate-300">Top Snippets</h3>
                  </div>

                  {topSnippets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {topSnippets.map((s) => (
                        <SnippetCard key={s.id} snippet={s} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      message={isOwnProfile ? "Publish your first snippet to see it here" : "No snippets to show yet"}
                      isOwnProfile={isOwnProfile}
                    />
                  )}
                </div>
              )}

              {/* ── All Snippets Tab ── */}
              {activeTab === "snippets" && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                      </svg>
                      <h3 className="text-sm font-semibold text-slate-300">
                        Snippet Desk
                        <span className="ml-2 text-xs text-slate-500 font-normal tabular-nums">
                          {snippets.length}
                        </span>
                      </h3>
                    </div>
                    {isOwnProfile && (
                      <Link
                        href="/snippet/new"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-hover px-3.5 py-2 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        New
                      </Link>
                    )}
                  </div>

                  {snippets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {snippets.map((s) => (
                        <SnippetCard key={s.id} snippet={s} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      message={isOwnProfile ? "Your desk is empty — publish your first snippet" : `${profile.username} hasn't published any snippets yet`}
                      isOwnProfile={isOwnProfile}
                    />
                  )}
                </div>
              )}

              {/* ── Starred Tab ── */}
              {activeTab === "starred" && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <svg className="h-4 w-4 text-amber-400/70" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-slate-300">
                      Starred Snippets
                      <span className="ml-2 text-xs text-slate-500 font-normal tabular-nums">
                        {starredSnippets.length}
                      </span>
                    </h3>
                  </div>

                  {starredSnippets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {starredSnippets.map((s) => (
                        <SnippetCard key={s.id} snippet={s} />
                      ))}
                    </div>
                  ) : (
                    <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-16 text-center">
                      <svg className="h-8 w-8 text-slate-600 mb-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                      </svg>
                      <h3 className="text-sm font-medium text-slate-400">
                        {isOwnProfile ? "You haven't starred any snippets yet" : "No starred snippets"}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600">
                        {isOwnProfile ? "Explore the feed and star snippets you like!" : "Check back later."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ message, isOwnProfile }: { message: string; isOwnProfile: boolean }) {
  return (
    <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 text-center">
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl
                    bg-slate-800/60 ring-1 ring-white/[0.06]
                    shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5),inset_-1px_-1px_4px_rgba(255,255,255,0.03)]"
      >
        <svg className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-slate-300 mb-1">{message}</h3>
      {isOwnProfile && (
        <Link
          href="/snippet/new"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent hover:bg-accent-hover px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create a snippet
        </Link>
      )}
    </div>
  );
}

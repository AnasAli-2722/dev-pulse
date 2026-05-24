import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import LeaderboardClient from "./leaderboard-client";
import type { LeaderboardEntry } from "./leaderboard-client";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata = {
  title: "Leaderboard — Dev Pulse",
  description:
    "See the top developers on Dev Pulse ranked by reputation, stars, and contributions.",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // Fetch top 50 profiles ordered by reputation
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, reputation")
    .order("reputation", { ascending: false, nullsFirst: false })
    .limit(50);

  // For each profile, aggregate total stars from their snippets
  const entries: LeaderboardEntry[] = [];

  if (profiles && profiles.length > 0) {
    // Batch-fetch star counts: get all snippets owned by these users
    const ownerIds = profiles.map((p) => p.id);

    const { data: snippets } = await supabase
      .from("snippets")
      .select("owner_id, star_count")
      .in("owner_id", ownerIds);

    // Build a map of owner_id → total stars
    const starMap = new Map<string, number>();
    (snippets ?? []).forEach((s) => {
      const current = starMap.get(s.owner_id) ?? 0;
      starMap.set(s.owner_id, current + (s.star_count ?? 0));
    });

    profiles.forEach((profile, index) => {
      entries.push({
        rank: index + 1,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        reputation: profile.reputation ?? 0,
        total_stars: starMap.get(profile.id) ?? 0,
      });
    });
  }

  return (
    <div className="flex-1 pb-16">
      {/* ── Ambient page glow ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 h-[450px] w-[800px] rounded-full bg-indigo-500/[0.04] blur-[120px]" />
        <div className="absolute left-1/4 top-40 h-[250px] w-[350px] rounded-full bg-amber-500/[0.03] blur-[100px]" />
        <div className="absolute right-1/4 top-20 h-[300px] w-[400px] rounded-full bg-purple-500/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-10">
        {/* ── Page Header ── */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 ring-1 ring-white/10 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5)]">
            <svg className="h-7 w-7 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Leaderboard
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            The most reputable developers on Dev Pulse. Earn reputation by publishing snippets, receiving stars, and contributing to the community.
          </p>

          {/* Tier legend */}
          <div className="mt-5 flex items-center justify-center gap-5 text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Top 3
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              Top 10
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Top 25
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              Top 50
            </span>
          </div>
        </div>

        {/* ── Leaderboard Content ── */}
        <LeaderboardClient entries={entries} />
      </div>
    </div>
  );
}

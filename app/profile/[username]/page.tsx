import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Tables } from "@/database.types";
import SnippetFeed from "@/app/components/snippet-feed";
import type { SnippetWithAuthor } from "@/app/components/snippet-card";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Profile = Tables<"profiles">;

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return {
    title: `${username} — Dev Pulse`,
    description: `View ${username}'s profile and code snippets on Dev Pulse.`,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Fetch current user for "is own profile" check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;

  // Fetch user's snippets with joins
  const { data: rawSnippets } = await supabase
    .from("snippets")
    .select(
      `
      *,
      profiles!snippets_owner_id_fkey ( username, avatar_url ),
      languages!snippets_language_id_fkey ( name, extension ),
      versions!inner ( code )
    `
    )
    .eq("owner_id", profile.id)
    .eq("versions.is_current", true)
    .order("created_at", { ascending: false });

  // Shape into SnippetWithAuthor[]
  const snippets: SnippetWithAuthor[] = (rawSnippets ?? []).map(
    (row: Record<string, unknown>) => {
      const versions = row.versions as
        | Array<{ code: string }>
        | { code: string }
        | null;
      const codePreview = Array.isArray(versions)
        ? versions[0]?.code ?? null
        : versions?.code ?? null;

      return {
        ...row,
        profiles: row.profiles as SnippetWithAuthor["profiles"],
        languages: row.languages as SnippetWithAuthor["languages"],
        code_preview: codePreview,
      } as SnippetWithAuthor;
    }
  );

  // Aggregate stats
  const totalSnippets = snippets.length;
  const totalStars = snippets.reduce(
    (sum, s) => sum + (s.star_count ?? 0),
    0
  );
  const totalViews = snippets.reduce(
    (sum, s) => sum + (s.view_count ?? 0),
    0
  );
  const reputation = profile.reputation ?? 0;

  return (
    <div className="flex-1 pb-16">
      {/* ── Page header glow ── */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[350px] w-[700px] rounded-full bg-indigo-500/[0.06] blur-[100px]" />
        </div>
      </div>

      {/* ── Bento Grid ── */}
      <div className="relative mx-auto max-w-6xl px-6 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-auto">
          {/* ━━━ Identity Block (spans 3 cols) ━━━ */}
          <div className="md:col-span-3 glass-card rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="h-20 w-20 rounded-2xl object-cover ring-2 ring-white/10 shadow-lg shadow-black/30"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 ring-2 ring-indigo-500/20 text-3xl font-bold text-indigo-300">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white truncate">
                  {profile.username}
                </h1>
                {isOwnProfile && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent ring-1 ring-accent/30">
                    You
                  </span>
                )}
              </div>

              {profile.bio && (
                <p className="mt-2 text-sm text-slate-400 line-clamp-2 max-w-xl">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                  Joined {formatDate(profile.created_at)}
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                    />
                  </svg>
                  {totalSnippets} snippet{totalSnippets !== 1 && "s"}
                </span>
              </div>
            </div>

            {/* Edit profile button (own profile only) */}
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-surface hover:bg-surface-hover border border-glass-border px-4 py-2 text-xs font-medium text-slate-300 transition-colors"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                  />
                </svg>
                Edit Profile
              </Link>
            )}
          </div>

          {/* ━━━ Reputation Block ━━━ */}
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.08] to-transparent" />
            <div className="relative">
              <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400/70">
                Reputation
              </span>
              <p className="mt-1 text-4xl font-extrabold tabular-nums text-white">
                {formatNumber(reputation)}
              </p>
              <div className="mt-2 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-amber-400/60"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
            </div>
          </div>

          {/* ━━━ Stars Block ━━━ */}
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-500/[0.06] to-transparent" />
            <div className="relative">
              <span className="text-[11px] font-medium uppercase tracking-wider text-yellow-400/70">
                Total Stars
              </span>
              <p className="mt-1 text-4xl font-extrabold tabular-nums text-white">
                {formatNumber(totalStars)}
              </p>
              <div className="mt-2 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-yellow-400/60"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                </svg>
              </div>
            </div>
          </div>

          {/* ━━━ Views Block ━━━ */}
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/[0.06] to-transparent" />
            <div className="relative">
              <span className="text-[11px] font-medium uppercase tracking-wider text-blue-400/70">
                Total Views
              </span>
              <p className="mt-1 text-4xl font-extrabold tabular-nums text-white">
                {formatNumber(totalViews)}
              </p>
              <div className="mt-2 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-blue-400/60"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* ━━━ Snippets Block ━━━ */}
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] to-transparent" />
            <div className="relative">
              <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/70">
                Snippets
              </span>
              <p className="mt-1 text-4xl font-extrabold tabular-nums text-white">
                {formatNumber(totalSnippets)}
              </p>
              <div className="mt-2 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-emerald-400/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* ━━━ Snippet Feed (full width) ━━━ */}
          <div className="md:col-span-4">
            <div className="flex items-center justify-between mb-5 mt-2">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                  />
                </svg>
                {isOwnProfile ? "Your Snippets" : `${profile.username}'s Snippets`}
              </h2>

              {isOwnProfile && (
                <Link
                  href="/snippet/new"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-hover px-4 py-2 text-xs font-semibold text-white transition-colors shadow-sm shadow-indigo-500/20"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  New Snippet
                </Link>
              )}
            </div>

            {snippets.length > 0 ? (
              <SnippetFeed snippets={snippets} />
            ) : (
              <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 text-center">
                <div
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl
                              bg-slate-800/60 ring-1 ring-white/[0.06]
                              shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5),inset_-1px_-1px_4px_rgba(255,255,255,0.03)]"
                >
                  <svg
                    className="h-7 w-7 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-slate-300">
                  {isOwnProfile
                    ? "You haven't published any snippets yet"
                    : `${profile.username} hasn't published any snippets yet`}
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  {isOwnProfile
                    ? "Share your first code snippet with the community."
                    : "Check back later for new content."}
                </p>
                {isOwnProfile && (
                  <Link
                    href="/snippet/new"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent hover:bg-accent-hover px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    Create your first snippet
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Tables } from "@/database.types";
import SnippetCard from "@/app/components/snippet-card";
import type { SnippetWithAuthor } from "@/app/components/snippet-card";
import IdentityPanel from "./identity-panel";

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
  const totalForks = snippets.reduce(
    (sum, s) => sum + (s.fork_count ?? 0),
    0
  );

  return (
    <div className="flex-1 pb-16">
      {/* ── Ambient page glow ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[400px] w-[500px] rounded-full bg-indigo-500/[0.04] blur-[120px]" />
        <div className="absolute right-1/4 top-20 h-[300px] w-[400px] rounded-full bg-purple-500/[0.03] blur-[100px]" />
      </div>

      {/* ── 2-Column Layout ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ━━━ Left Column: Sticky Identity Panel ━━━ */}
          <div className="lg:col-span-3">
            <IdentityPanel
              profile={{
                username: profile.username,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                bio: profile.bio,
                reputation: profile.reputation,
                created_at: profile.created_at,
              }}
              totalSnippets={totalSnippets}
              totalStars={totalStars}
              totalForks={totalForks}
              isOwnProfile={isOwnProfile}
            />
          </div>

          {/* ━━━ Right Column: Snippet Desk ━━━ */}
          <div className="lg:col-span-9">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
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
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Snippet Desk
                  </h2>
                  <p className="text-xs text-slate-500">
                    {totalSnippets} snippet{totalSnippets !== 1 && "s"} published
                  </p>
                </div>
              </div>

              {isOwnProfile && (
                <Link
                  href="/snippet/new"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-hover px-4 py-2.5 text-xs font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
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

            {/* Snippet Grid */}
            {snippets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {snippets.map((snippet) => (
                  <SnippetCard key={snippet.id} snippet={snippet} />
                ))}
              </div>
            ) : (
              /* ── Empty State ── */
              <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-24 text-center">
                <div
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl
                              bg-slate-800/60 ring-1 ring-white/[0.06]
                              shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5),inset_-1px_-1px_4px_rgba(255,255,255,0.03)]"
                >
                  <svg
                    className="h-9 w-9 text-slate-500"
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
                <h3 className="text-base font-semibold text-slate-300 mb-1">
                  {isOwnProfile
                    ? "Your desk is empty"
                    : `${profile.username}'s desk is empty`}
                </h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  {isOwnProfile
                    ? "Publish your first code snippet and it will appear right here."
                    : "No snippets published yet. Check back later!"}
                </p>
                {isOwnProfile && (
                  <Link
                    href="/snippet/new"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent hover:bg-accent-hover px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
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

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Tables } from "@/database.types";
import type { SnippetWithAuthor } from "@/app/components/snippet-card";
import ProfileView from "./profile-view";

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
/*  Snippet shaping helper                                             */
/* ------------------------------------------------------------------ */

function shapeSnippets(rawSnippets: Record<string, unknown>[]): SnippetWithAuthor[] {
  return rawSnippets.map((row) => {
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
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ProfilePage({ params }: PageProps) {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername);
  const supabase = await createClient();

  // ── 1. Fetch profile ──
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .limit(1)
    .maybeSingle();

  if (profileError || !profile) {
    notFound();
  }

  // ── 2. Current user check ──
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;

  // ── 3. Privacy Check ──
  if (profile.profile_visibility === "private" && !isOwnProfile) {
    notFound();
  }

  // ── 3. Fetch user's snippets ──
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

  const snippets = shapeSnippets((rawSnippets as Record<string, unknown>[]) ?? []);

  // ── 4. Fetch starred snippets ──
  // Get snippet IDs this user has starred
  const { data: starRows } = await supabase
    .from("stars")
    .select("snippet_id")
    .eq("user_id", profile.id);

  let starredSnippets: SnippetWithAuthor[] = [];

  if (starRows && starRows.length > 0) {
    const starredIds = starRows.map((r) => r.snippet_id);

    const { data: rawStarred } = await supabase
      .from("snippets")
      .select(
        `
        *,
        profiles!snippets_owner_id_fkey ( username, avatar_url ),
        languages!snippets_language_id_fkey ( name, extension ),
        versions!inner ( code )
      `
      )
      .in("id", starredIds)
      .eq("versions.is_current", true)
      .order("created_at", { ascending: false });

    starredSnippets = shapeSnippets((rawStarred as Record<string, unknown>[]) ?? []);
  }

  // ── 5. Aggregate stats ──
  const totalStars = snippets.reduce(
    (sum, s) => sum + (s.star_count ?? 0),
    0
  );

  return (
    <div className="flex-1 pb-16">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[400px] w-[500px] rounded-full bg-indigo-500/[0.04] blur-[120px]" />
        <div className="absolute right-1/4 top-20 h-[300px] w-[400px] rounded-full bg-purple-500/[0.03] blur-[100px]" />
      </div>

      <ProfileView
        profile={{
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          reputation: profile.reputation ?? 0,
          created_at: profile.created_at,
          github_url: profile.github_url,
          linkedin_url: profile.linkedin_url,
          instagram_url: profile.instagram_url,
          email_public: profile.email_public,
        }}
        snippets={snippets}
        starredSnippets={starredSnippets}
        totalStars={totalStars}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}

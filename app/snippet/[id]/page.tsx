import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SnippetViewer from "./snippet-viewer";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SnippetDetail {
  id: number;
  title: string;
  description: string | null;
  is_public: boolean | null;
  star_count: number | null;
  fork_count: number | null;
  view_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  owner_id: string;
  language_id: number;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  languages: {
    name: string;
    extension: string;
  } | null;
}

export interface Version {
  id: number;
  version_number: number;
  code: string;
  code_hash: string;
  commit_msg: string | null;
  created_at: string | null;
  author_id: string;
  is_current: boolean | null;
  lines_added: number | null;
  lines_removed: number | null;
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("snippets")
    .select("title, description")
    .eq("id", Number(id))
    .single();

  return {
    title: data ? `${data.title} — Dev Pulse` : "Snippet — Dev Pulse",
    description: data?.description ?? "View this code snippet on Dev Pulse.",
  };
}

/* ------------------------------------------------------------------ */
/*  Page (Server Component)                                            */
/* ------------------------------------------------------------------ */

export default async function SnippetPage({ params }: PageProps) {
  const { id } = await params;
  const snippetId = Number(id);

  if (isNaN(snippetId)) {
    notFound();
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch snippet with joined author + language
  const { data: snippet, error: snippetError } = await supabase
    .from("snippets")
    .select(
      `
      *,
      profiles!snippets_owner_id_fkey ( username, avatar_url ),
      languages!snippets_language_id_fkey ( name, extension )
    `
    )
    .eq("id", snippetId)
    .single();

  if (snippetError || !snippet) {
    notFound();
  }

  // Fetch all versions for this snippet
  const { data: versions } = await supabase
    .from("versions")
    .select("*")
    .eq("snippet_id", snippetId)
    .order("created_at", { ascending: false });

  return (
    <SnippetViewer
      snippet={snippet as unknown as SnippetDetail}
      versions={(versions as unknown as Version[]) ?? []}
      currentUserId={user?.id ?? null}
    />
  );
}

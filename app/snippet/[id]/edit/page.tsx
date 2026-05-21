import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditSnippetForm from "./edit-form";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface EditSnippetData {
  id: number;
  title: string;
  description: string | null;
  language_id: number;
  owner_id: string;
  languages: { name: string; extension: string } | null;
}

export interface LatestVersion {
  id: number;
  version_number: number;
  code: string;
  commit_msg: string | null;
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
    .select("title")
    .eq("id", Number(id))
    .single();

  return {
    title: data ? `Edit: ${data.title} — Dev Pulse` : "Edit Snippet — Dev Pulse",
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function EditSnippetPage({ params }: PageProps) {
  const { id } = await params;
  const snippetId = Number(id);
  if (isNaN(snippetId)) notFound();

  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch snippet
  const { data: snippet, error } = await supabase
    .from("snippets")
    .select(
      `id, title, description, language_id, owner_id,
       languages!snippets_language_id_fkey ( name, extension )`
    )
    .eq("id", snippetId)
    .single();

  if (error || !snippet) notFound();

  // Owner check
  if (snippet.owner_id !== user.id) redirect("/");

  // Fetch latest version
  const { data: latestVersion } = await supabase
    .from("versions")
    .select("id, version_number, code, commit_msg")
    .eq("snippet_id", snippetId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  return (
    <EditSnippetForm
      snippet={snippet as unknown as EditSnippetData}
      latestVersion={latestVersion as unknown as LatestVersion | null}
    />
  );
}

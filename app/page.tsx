import { createClient } from "@/lib/supabase/server";
import SnippetFeed from "./components/snippet-feed";
import type { SnippetWithAuthor } from "./components/snippet-card";
import Link from "next/link";
import HomeFilters from "./components/home-filters";

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

async function getSnippets(
  sort: string,
  lang: string
): Promise<SnippetWithAuthor[]> {
  const supabase = await createClient();

  let query = supabase
    .from("snippets")
    .select(
      `
      *,
      profiles!snippets_owner_id_fkey ( username, avatar_url ),
      languages!snippets_language_id_fkey ( name, extension ),
      versions!inner ( code )
    `
    )
    .eq("is_public", true)
    .eq("versions.is_current", true);

  // Sort order
  switch (sort) {
    case "trending":
      query = query.order("star_count", { ascending: false });
      break;
    case "most-viewed":
      query = query.order("view_count", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  query = query.limit(24);

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch snippets:", error.message);
    return [];
  }

  // Shape the data to match SnippetWithAuthor
  return (data ?? []).map((row: Record<string, unknown>) => {
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

interface HomeProps {
  searchParams: Promise<{ sort?: string; lang?: string; q?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const sort = params.sort ?? "newest";
  const lang = params.lang ?? "all";
  const query = params.q ?? "";

  let snippets = await getSnippets(sort, lang);

  // Client-side-like search filter (on the server)
  if (query) {
    const q = query.toLowerCase();
    snippets = snippets.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.profiles.username.toLowerCase().includes(q)
    );
  }

  // Client-side-like language filter (on the server)
  if (lang && lang !== "all") {
    const l = lang.toLowerCase();
    snippets = snippets.filter((s) => s.languages?.name.toLowerCase() === l);
  }

  return (
    <div className="flex-1">
      {/* ── Hero header ── */}
      <header className="relative overflow-hidden border-b border-white/[0.04] bg-gradient-to-b from-slate-900/50 to-transparent">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-indigo-500/[0.07] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-[10px] md:text-xs font-medium text-indigo-400 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            Community Snippets
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Discover&nbsp;
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Code Snippets
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm md:text-base leading-relaxed text-slate-400">
            Browse production-ready code from the community. Star your
            favorites, fork and iterate, or share your own.
          </p>
        </div>
      </header>

      {/* ── Search + Filters + Feed ── */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Interactive filters (client component) */}
        <HomeFilters
          currentSort={sort}
          currentLang={lang}
          currentQuery={query}
        />

        {/* ── Snippet Feed or Empty State ── */}
        {snippets.length > 0 ? (
          <SnippetFeed snippets={snippets} />
        ) : (
          <EmptyState query={query} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      {/* Icon container with neumorphic depth */}
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl
                    bg-slate-900/80 ring-1 ring-white/[0.06]
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

      <h3 className="text-base md:text-lg font-semibold text-slate-200">
        {query ? "No snippets match your search" : "No snippets yet"}
      </h3>
      <p className="mt-2 max-w-sm text-xs md:text-sm leading-relaxed text-slate-500">
        {query
          ? `We couldn't find any snippets matching "${query}". Try adjusting your filters or search terms.`
          : "Be the first to share a code snippet with the community. Your knowledge could help thousands of developers."}
      </p>

      {!query && (
        <Link
          href="/snippet/new"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent hover:bg-accent-hover
                     px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200
                     shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
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
          Create the first snippet
        </Link>
      )}
    </div>
  );
}

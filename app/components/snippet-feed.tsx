"use client";

import SnippetCard from "./snippet-card";
import type { SnippetWithAuthor } from "./snippet-card";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface SnippetFeedProps {
  snippets: SnippetWithAuthor[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SnippetFeed({ snippets }: SnippetFeedProps) {
  if (snippets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 ring-1 ring-white/[0.06]">
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
          No snippets yet
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Create your first snippet to see it appear here.
        </p>
      </div>
    );
  }

  return (
    <section className="w-full">
      {/* ── Bento grid ─────────────────────────────────────────── */}
      {/*
        - 1 col on mobile
        - 2 cols on md
        - 3 cols on lg
        - 4 cols on xl
        Uses auto-rows with masonry-like row-span hints via :nth-child
      */}
      <div
        className="grid grid-cols-1 gap-5
                    md:grid-cols-2
                    lg:grid-cols-3
                    xl:grid-cols-4
                    auto-rows-auto"
      >
        {snippets.map((snippet, index) => (
          <div
            key={snippet.id}
            className={getBentoSpan(index)}
          >
            <SnippetCard snippet={snippet} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Bento span pattern                                                 */
/*  Every 7th card cycle creates visual variety by spanning 2 rows     */
/*  or 2 columns at the appropriate breakpoints.                       */
/* ------------------------------------------------------------------ */

function getBentoSpan(index: number): string {
  const position = index % 7;

  switch (position) {
    case 0:
      // Feature card — spans 2 columns on lg+
      return "lg:col-span-2";
    case 3:
      // Tall card — spans 2 rows
      return "lg:row-span-2 [&>article]:h-full";
    case 6:
      // Wide card — spans 2 columns on xl
      return "xl:col-span-2";
    default:
      return "";
  }
}

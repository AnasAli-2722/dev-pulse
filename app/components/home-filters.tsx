"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Filter configuration                                               */
/* ------------------------------------------------------------------ */

const SORT_OPTIONS = [
  {
    key: "newest",
    label: "Newest",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    key: "trending",
    label: "Trending",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
      </svg>
    ),
  },
  {
    key: "most-viewed",
    label: "Most Viewed",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
];

const LANG_FILTERS = [
  { key: "all", label: "All" },
  { key: "JavaScript", label: "JavaScript" },
  { key: "TypeScript", label: "TypeScript" },
  { key: "Python", label: "Python" },
  { key: "Rust", label: "Rust" },
  { key: "Go", label: "Go" },
  { key: "SQL", label: "SQL" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface HomeFiltersProps {
  currentSort: string;
  currentLang: string;
  currentQuery: string;
}

export default function HomeFilters({
  currentSort,
  currentLang,
  currentQuery,
}: HomeFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentQuery);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== "newest" && value !== "all" && value !== "") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/?${qs}` : "/", { scroll: false });
      });
    },
    [router, searchParams]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: searchValue });
  }

  return (
    <div className="mb-8 space-y-5">
      {/* ── Neumorphic Search Bar ── */}
      <form onSubmit={handleSearch} className="relative">
        <div
          className="relative rounded-2xl
                      bg-slate-950/70
                      shadow-[inset_3px_3px_8px_rgba(0,0,0,0.55),inset_-2px_-2px_6px_rgba(255,255,255,0.025)]
                      ring-1 ring-white/[0.04]"
        >
          {/* Search icon */}
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg
              className={`h-4.5 w-4.5 transition-colors ${
                isPending ? "text-accent" : "text-slate-500"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>

          <input
            id="snippet-search"
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search snippets by title, description, or author…"
            className="w-full bg-transparent py-3.5 pl-11 pr-4 text-sm text-slate-200 placeholder:text-slate-600 outline-none"
          />

          {/* Clear button */}
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                setSearchValue("");
                updateParams({ q: "" });
              }}
              className="absolute inset-y-0 right-12 flex items-center px-2 text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-accent transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

        {/* Loading bar */}
        {isPending && (
          <div className="absolute -bottom-0.5 left-4 right-4 h-0.5 overflow-hidden rounded-full">
            <div className="h-full w-1/3 animate-[shimmer_1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-accent to-transparent" />
          </div>
        )}
      </form>

      {/* ── Filter pills ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort pills */}
        {SORT_OPTIONS.map((opt) => {
          const isActive = currentSort === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => updateParams({ sort: opt.key })}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium
                          transition-all duration-200 cursor-pointer
                          ${
                            isActive
                              ? "bg-accent/15 text-accent ring-1 ring-accent/30 shadow-sm shadow-accent/10"
                              : "bg-slate-800/50 text-slate-400 ring-1 ring-white/[0.06] hover:bg-slate-800 hover:text-slate-300"
                          }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-white/[0.06]" />

        {/* Language pills */}
        {LANG_FILTERS.map((opt) => {
          const isActive = currentLang === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => updateParams({ lang: opt.key })}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium
                          transition-all duration-200 cursor-pointer
                          ${
                            isActive
                              ? "bg-accent/15 text-accent ring-1 ring-accent/30 shadow-sm shadow-accent/10"
                              : "bg-slate-800/50 text-slate-400 ring-1 ring-white/[0.06] hover:bg-slate-800 hover:text-slate-300"
                          }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

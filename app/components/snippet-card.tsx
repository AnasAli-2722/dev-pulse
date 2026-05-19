"use client";

import { motion } from "framer-motion";
import type { Tables } from "@/database.types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** A snippet row joined with the author's username from profiles. */
export type SnippetWithAuthor = Tables<"snippets"> & {
  /** The joined profile object (at minimum we need the username). */
  profiles: Pick<Tables<"profiles">, "username" | "avatar_url">;
  /** Optionally join the language row for richer display. */
  languages?: Pick<Tables<"languages">, "name" | "extension"> | null;
  /** Optional: latest version code to preview. */
  code_preview?: string | null;
};

/* ------------------------------------------------------------------ */
/*  Language → color mapping                                           */
/* ------------------------------------------------------------------ */

const LANG_COLORS: Record<string, { bg: string; text: string }> = {
  javascript: { bg: "bg-amber-400/15", text: "text-amber-400" },
  typescript: { bg: "bg-blue-400/15", text: "text-blue-400" },
  python: { bg: "bg-emerald-400/15", text: "text-emerald-400" },
  rust: { bg: "bg-orange-400/15", text: "text-orange-400" },
  go: { bg: "bg-cyan-400/15", text: "text-cyan-400" },
  java: { bg: "bg-red-400/15", text: "text-red-400" },
  c: { bg: "bg-slate-400/15", text: "text-slate-400" },
  "c++": { bg: "bg-pink-400/15", text: "text-pink-400" },
  "c#": { bg: "bg-violet-400/15", text: "text-violet-400" },
  ruby: { bg: "bg-rose-400/15", text: "text-rose-400" },
  swift: { bg: "bg-orange-300/15", text: "text-orange-300" },
  kotlin: { bg: "bg-purple-400/15", text: "text-purple-400" },
  dart: { bg: "bg-sky-400/15", text: "text-sky-400" },
  php: { bg: "bg-indigo-400/15", text: "text-indigo-400" },
  html: { bg: "bg-orange-500/15", text: "text-orange-500" },
  css: { bg: "bg-blue-500/15", text: "text-blue-500" },
  sql: { bg: "bg-yellow-400/15", text: "text-yellow-400" },
  shell: { bg: "bg-green-400/15", text: "text-green-400" },
  bash: { bg: "bg-green-400/15", text: "text-green-400" },
  lua: { bg: "bg-indigo-300/15", text: "text-indigo-300" },
};

function getLangStyle(name: string) {
  const key = name.toLowerCase();
  return LANG_COLORS[key] ?? { bg: "bg-slate-500/15", text: "text-slate-400" };
}

/* ------------------------------------------------------------------ */
/*  Utility: relative time                                             */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface SnippetCardProps {
  snippet: SnippetWithAuthor;
}

export default function SnippetCard({ snippet }: SnippetCardProps) {
  const langName = snippet.languages?.name ?? `lang-${snippet.language_id}`;
  const langStyle = getLangStyle(langName);
  const preview =
    snippet.code_preview ?? "// No preview available for this snippet…";

  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 320, damping: 20 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl
                 border border-white/[0.06]
                 bg-gradient-to-br from-slate-900/80 via-slate-900/90 to-slate-950
                 shadow-lg shadow-black/30
                 backdrop-blur-md
                 transition-shadow duration-300
                 hover:shadow-xl hover:shadow-indigo-500/10
                 hover:border-indigo-500/20"
    >
      {/* ── Subtle top-edge gradient accent ── */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px
                    bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent
                    opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      {/* ── Header: language pill + timestamp ── */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase
                      ${langStyle.bg} ${langStyle.text} ring-1 ring-inset ring-current/10`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
          {langName}
        </span>
        <time className="text-[11px] text-slate-500 tabular-nums">
          {timeAgo(snippet.updated_at ?? snippet.created_at)}
        </time>
      </header>

      {/* ── Title & description ── */}
      <div className="px-5 pb-3">
        <h3
          className="truncate text-[15px] font-semibold leading-snug text-slate-100
                      group-hover:text-white transition-colors duration-200"
        >
          {snippet.title}
        </h3>
        {snippet.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
            {snippet.description}
          </p>
        )}
      </div>

      {/* ── Neumorphic code preview area ── */}
      <div className="mx-4 mb-4 flex-1">
        <div
          className="relative overflow-hidden rounded-xl p-4
                      bg-slate-950/70
                      shadow-[inset_2px_2px_6px_rgba(0,0,0,0.55),inset_-1px_-1px_4px_rgba(255,255,255,0.03)]
                      ring-1 ring-white/[0.04]"
        >
          {/* Line numbers + code */}
          <pre className="overflow-hidden text-[11px] leading-[1.7] font-mono text-slate-400">
            <code>
              {preview
                .split("\n")
                .slice(0, 6)
                .map((line, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="w-4 flex-shrink-0 text-right text-slate-600 select-none">
                      {i + 1}
                    </span>
                    <span className="truncate text-slate-300/80">{line}</span>
                  </div>
                ))}
            </code>
          </pre>

          {/* Fade-out gradient at bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-950/90 to-transparent" />
        </div>
      </div>

      {/* ── Footer: author + stats ── */}
      <footer
        className="flex items-center justify-between border-t border-white/[0.04]
                    bg-slate-950/40 px-5 py-3"
      >
        {/* Author */}
        <div className="flex items-center gap-2 min-w-0">
          {snippet.profiles.avatar_url ? (
            <img
              src={snippet.profiles.avatar_url}
              alt={snippet.profiles.username}
              className="h-5 w-5 rounded-full ring-1 ring-white/10 object-cover"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400 ring-1 ring-indigo-500/20">
              {snippet.profiles.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="truncate text-xs text-slate-400 font-medium">
            {snippet.profiles.username}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-slate-500">
          {/* Stars */}
          <span className="inline-flex items-center gap-1 text-xs tabular-nums" title="Stars">
            <svg
              className="h-3.5 w-3.5 text-amber-400/70"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
            </svg>
            {snippet.star_count ?? 0}
          </span>

          {/* Forks */}
          <span className="inline-flex items-center gap-1 text-xs tabular-nums" title="Forks">
            <svg
              className="h-3.5 w-3.5 text-slate-400/70"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"
              />
            </svg>
            {snippet.fork_count ?? 0}
          </span>

          {/* Views */}
          <span className="inline-flex items-center gap-1 text-xs tabular-nums" title="Views">
            <svg
              className="h-3.5 w-3.5 text-slate-400/70"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            {snippet.view_count ?? 0}
          </span>
        </div>
      </footer>
    </motion.article>
  );
}

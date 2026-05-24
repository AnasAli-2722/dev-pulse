"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { SnippetDetail, Version } from "./page";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toMonacoLang(name: string): string {
  const map: Record<string, string> = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    rust: "rust",
    go: "go",
    java: "java",
    c: "c",
    "c++": "cpp",
    "c#": "csharp",
    ruby: "ruby",
    swift: "swift",
    kotlin: "kotlin",
    dart: "dart",
    php: "php",
    html: "html",
    css: "css",
    sql: "sql",
    shell: "shell",
    bash: "shell",
    lua: "lua",
  };
  return map[name.toLowerCase()] ?? "plaintext";
}

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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface SnippetViewerProps {
  snippet: SnippetDetail;
  versions: Version[];
  currentUserId: string | null;
}

export default function SnippetViewer({
  snippet,
  versions,
  currentUserId,
}: SnippetViewerProps) {
  const currentVersion =
    versions.find((v) => v.is_current) ?? versions[0] ?? null;
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(
    currentVersion
  );

  const supabase = createClient();
  const [viewCount, setViewCount] = useState(snippet.view_count ?? 0);
  const [starCount, setStarCount] = useState(snippet.star_count ?? 0);
  const [isStarred, setIsStarred] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1. Increment View Count
    supabase.rpc("increment_view_count", { target_snippet_id: snippet.id }).then(({ error }) => {
      if (!error && mounted) setViewCount((v) => v + 1);
    });

    // 2. Check initial star status
    if (currentUserId) {
      supabase
        .from("stars")
        .select("*")
        .eq("snippet_id", snippet.id)
        .eq("user_id", currentUserId)
        .maybeSingle()
        .then(({ data }) => {
          if (data && mounted) setIsStarred(true);
        });
    }

    return () => {
      mounted = false;
    };
  }, [snippet.id, currentUserId]);

  const toggleStar = async () => {
    if (!currentUserId) return; // Not logged in

    const prevStarred = isStarred;
    const prevCount = starCount;

    // Optimistic Update
    setIsStarred(!prevStarred);
    setStarCount(prevCount + (prevStarred ? -1 : 1));

    if (prevStarred) {
      const { error } = await supabase
        .from("stars")
        .delete()
        .eq("snippet_id", snippet.id)
        .eq("user_id", currentUserId);
      if (error) {
        setIsStarred(prevStarred);
        setStarCount(prevCount);
      }
    } else {
      const { error } = await supabase
        .from("stars")
        .insert({ snippet_id: snippet.id, user_id: currentUserId });
      if (error) {
        setIsStarred(prevStarred);
        setStarCount(prevCount);
      }
    }
  };

  const langName = snippet.languages?.name ?? "plaintext";
  const langKey = langName.toLowerCase();
  const langColor = LANG_COLORS[langKey] ?? {
    bg: "bg-slate-500/15",
    text: "text-slate-400",
  };
  const monacoLang = toMonacoLang(langName);
  const code = selectedVersion?.code ?? "// No code available";
  const lineCount = code.split("\n").length;

  return (
    <div className="flex-1 pb-12">
      {/* ── Header ── */}
      <header className="relative overflow-hidden border-b border-white/[0.04] bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[200px] w-[500px] rounded-full bg-indigo-500/[0.06] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Link
              href="/"
              className="hover:text-slate-300 transition-colors"
            >
              Home
            </Link>
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
            <span className="text-slate-400">{snippet.title}</span>
          </div>

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold tracking-tight text-white truncate sm:text-3xl">
                  {snippet.title}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase shrink-0
                              ${langColor.bg} ${langColor.text} ring-1 ring-inset ring-current/10`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                  {langName}
                </span>
              </div>
              {snippet.description && (
                <p className="text-sm text-slate-400 line-clamp-2 max-w-2xl">
                  {snippet.description}
                </p>
              )}
            </div>

            {/* Stats + Edit */}
            <div className="flex items-center gap-3 shrink-0">
              {currentUserId === snippet.owner_id && (
                <Link
                  href={`/snippet/${snippet.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent/15 hover:bg-accent/25 px-4 py-2 text-xs font-semibold text-accent ring-1 ring-accent/30 transition-all duration-200"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                  Edit
                </Link>
              )}
              <div className="flex items-center gap-4 text-slate-500">
              <motion.button
                onClick={toggleStar}
                disabled={!currentUserId}
                whileTap={{ scale: 0.9 }}
                className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
                  isStarred ? "text-amber-400" : "hover:text-amber-400"
                } ${!currentUserId && "opacity-50 cursor-not-allowed"}`}
                title="Stars"
              >
                <motion.svg
                  initial={false}
                  animate={{ scale: isStarred ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.2 }}
                  className={`h-4 w-4 ${isStarred ? "text-amber-400" : "text-amber-400/70"}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                </motion.svg>
                {starCount}
              </motion.button>
              <span
                className="inline-flex items-center gap-1.5 text-sm"
                title="Views"
              >
                <svg
                  className="h-4 w-4 text-slate-400/70"
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
                {viewCount}
              </span>
              </div>
            </div>
          </div>

          {/* Author */}
          <div className="flex items-center gap-2 mt-4">
            {snippet.profiles.avatar_url ? (
              <img
                src={snippet.profiles.avatar_url}
                alt={snippet.profiles.username}
                className="h-6 w-6 rounded-full ring-1 ring-white/10 object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400 ring-1 ring-indigo-500/20">
                {snippet.profiles.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-slate-400">
              {snippet.profiles.username}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-500">
              {timeAgo(snippet.created_at)}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main 2-column layout ── */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left: Code Viewer (75%) ── */}
          <div className="flex-1 lg:w-3/4 min-w-0">
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Editor toolbar */}
              <div className="flex items-center justify-between border-b border-white/[0.04] bg-[#1e1e1e] px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  <span className="ml-3 text-[11px] text-slate-500 font-mono">
                    {snippet.title}
                    {snippet.languages?.extension ?? ".txt"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 tabular-nums">
                  {selectedVersion && (
                    <span className="text-accent/70">
                      v{selectedVersion.version_number}
                    </span>
                  )}
                  <span>{lineCount} lines</span>
                </div>
              </div>

              {/* Monaco (read-only) */}
              <div
                className="shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4),inset_-1px_-1px_4px_rgba(255,255,255,0.02)]"
              >
                <Editor
                  height="560px"
                  language={monacoLang}
                  theme="vs-dark"
                  value={code}
                  options={{
                    readOnly: true,
                    fontSize: 14,
                    fontFamily:
                      "var(--font-geist-mono), 'Fira Code', monospace",
                    fontLigatures: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    padding: { top: 16, bottom: 16 },
                    lineNumbers: "on",
                    renderLineHighlight: "gutter",
                    smoothScrolling: true,
                    bracketPairColorization: { enabled: true },
                    wordWrap: "on",
                    overviewRulerBorder: false,
                    hideCursorInOverviewRuler: true,
                    domReadOnly: true,
                    scrollbar: {
                      verticalScrollbarSize: 6,
                      horizontalScrollbarSize: 6,
                    },
                  }}
                  loading={
                    <div className="flex items-center justify-center h-[560px] bg-[#1e1e1e]">
                      <div className="flex items-center gap-3 text-slate-500">
                        <svg
                          className="animate-spin h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span className="text-sm">Loading editor…</span>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
          </div>

          {/* ── Right: Version Timeline (25%) ── */}
          <div className="lg:w-1/4 shrink-0">
            <div className="glass-card rounded-2xl p-4 sticky top-20">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-4">
                <svg
                  className="h-4 w-4 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                Version History
                <span className="ml-auto text-xs text-slate-600 font-normal tabular-nums">
                  {versions.length} version{versions.length !== 1 && "s"}
                </span>
              </h2>

              {versions.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-8">
                  No versions recorded yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {versions.map((version, index) => {
                    const isSelected =
                      selectedVersion?.id === version.id;
                    const isLatest = index === 0;

                    return (
                      <motion.button
                        key={version.id}
                        onClick={() => setSelectedVersion(version)}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full text-left rounded-xl p-3 transition-all duration-200 cursor-pointer group relative
                          ${
                            isSelected
                              ? "bg-accent/10 ring-1 ring-accent/40 shadow-sm shadow-accent/10"
                              : "bg-slate-900/40 ring-1 ring-white/[0.04] hover:bg-slate-800/60 hover:ring-white/[0.08]"
                          }`}
                      >
                        {/* Active indicator line */}
                        {isSelected && (
                          <motion.div
                            layoutId="version-indicator"
                            className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-accent"
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}

                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-bold tabular-nums ${
                              isSelected
                                ? "text-accent"
                                : "text-slate-400"
                            }`}
                          >
                            v{version.version_number}
                          </span>
                          {isLatest && (
                            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
                              Latest
                            </span>
                          )}
                          {version.is_current && !isLatest && (
                            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20">
                              Current
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-xs leading-relaxed truncate ${
                            isSelected
                              ? "text-slate-200"
                              : "text-slate-400"
                          }`}
                        >
                          {version.commit_msg ?? "No message"}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-slate-600 tabular-nums">
                            {timeAgo(version.created_at)}
                          </span>
                          {(version.lines_added !== null ||
                            version.lines_removed !== null) && (
                            <div className="flex items-center gap-1.5 text-[10px] tabular-nums">
                              {version.lines_added !== null &&
                                version.lines_added > 0 && (
                                  <span className="text-emerald-500/70">
                                    +{version.lines_added}
                                  </span>
                                )}
                              {version.lines_removed !== null &&
                                version.lines_removed > 0 && (
                                  <span className="text-red-400/70">
                                    -{version.lines_removed}
                                  </span>
                                )}
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

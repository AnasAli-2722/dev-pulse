"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { EditSnippetData, LatestVersion } from "./page";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toMonacoLang(name: string): string {
  const map: Record<string, string> = {
    javascript: "javascript", typescript: "typescript", python: "python",
    rust: "rust", go: "go", java: "java", c: "c", "c++": "cpp",
    "c#": "csharp", ruby: "ruby", swift: "swift", kotlin: "kotlin",
    dart: "dart", php: "php", html: "html", css: "css", sql: "sql",
    shell: "shell", bash: "shell", lua: "lua",
  };
  return map[name.toLowerCase()] ?? "plaintext";
}

async function hashCode(code: string): Promise<string> {
  const encoded = new TextEncoder().encode(code);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function countLines(code: string): number {
  return code.split("\n").filter((l) => l.trim().length > 0).length;
}

function computeDiff(
  oldCode: string,
  newCode: string
): { added: number; removed: number } {
  const oldLines = new Set(oldCode.split("\n"));
  const newLines = new Set(newCode.split("\n"));
  let added = 0;
  let removed = 0;
  newLines.forEach((l) => { if (!oldLines.has(l)) added++; });
  oldLines.forEach((l) => { if (!newLines.has(l)) removed++; });
  return { added, removed };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface EditSnippetFormProps {
  snippet: EditSnippetData;
  latestVersion: LatestVersion | null;
}

export default function EditSnippetForm({
  snippet,
  latestVersion,
}: EditSnippetFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const originalCode = latestVersion?.code ?? "";
  const [code, setCode] = useState(originalCode);
  const [commitMsg, setCommitMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const langName = snippet.languages?.name ?? "plaintext";
  const monacoLang = toMonacoLang(langName);
  const lineCount = code.split("\n").length;
  const charCount = code.length;
  const hasChanges = code !== originalCode;

  async function handleCommit() {
    setError(null);

    if (!hasChanges) {
      setError("No changes detected. Edit the code before committing.");
      return;
    }
    if (!commitMsg.trim()) {
      setError("Please write a commit message describing your changes.");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in.");
        setIsSubmitting(false);
        return;
      }

      const nextVersion = (latestVersion?.version_number ?? 0) + 1;
      const codeHash = await hashCode(code);
      const diff = computeDiff(originalCode, code);

      // Mark old versions as not current
      await supabase
        .from("versions")
        .update({ is_current: false })
        .eq("snippet_id", snippet.id);

      // Insert new version
      const { error: insertError } = await supabase
        .from("versions")
        .insert({
          snippet_id: snippet.id,
          version_number: nextVersion,
          code,
          code_hash: codeHash,
          commit_msg: commitMsg.trim(),
          author_id: user.id,
          is_current: true,
          lines_added: diff.added,
          lines_removed: diff.removed,
        });

      if (insertError) throw new Error(insertError.message);

      // Update snippet's updated_at
      await supabase
        .from("snippets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", snippet.id);

      startTransition(() => {
        router.push(`/snippet/${snippet.id}`);
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 pb-16">
      {/* ── Header ── */}
      <header className="relative overflow-hidden border-b border-white/[0.04] bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[200px] w-[500px] rounded-full bg-indigo-500/[0.06] blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <Link href="/" className="hover:text-slate-300 transition-colors">
              Home
            </Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <Link
              href={`/snippet/${snippet.id}`}
              className="hover:text-slate-300 transition-colors"
            >
              {snippet.title}
            </Link>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-slate-400">Edit</span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 mb-4">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editing · v{(latestVersion?.version_number ?? 0) + 1}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {snippet.title}
          </h1>
          {snippet.description && (
            <p className="mt-2 text-sm text-slate-400">{snippet.description}</p>
          )}
        </div>
      </header>

      {/* ── Form ── */}
      <div className="mx-auto max-w-4xl px-6 pt-8">
        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between border-b border-white/[0.04] bg-[#1e1e1e] px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-[11px] text-slate-500 font-mono">
                {snippet.title}{snippet.languages?.extension ?? ".txt"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] tabular-nums">
              {hasChanges && (
                <span className="text-amber-400/80 font-medium">Modified</span>
              )}
              <span className="text-slate-600">{lineCount} lines</span>
              <span className="text-slate-600">{charCount} chars</span>
            </div>
          </div>

          {/* Monaco editor */}
          <div className="shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4),inset_-1px_-1px_4px_rgba(255,255,255,0.02)]">
            <Editor
              height="520px"
              language={monacoLang}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value ?? "")}
              options={{
                fontSize: 14,
                fontFamily: "var(--font-geist-mono), 'Fira Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                lineNumbers: "on",
                renderLineHighlight: "gutter",
                cursorBlinking: "smooth",
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
                autoClosingBrackets: "always",
                tabSize: 2,
                wordWrap: "on",
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
              }}
              loading={
                <div className="flex items-center justify-center h-[520px] bg-[#1e1e1e]">
                  <div className="flex items-center gap-3 text-slate-500">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm">Loading editor…</span>
                  </div>
                </div>
              }
            />
          </div>
        </div>

        {/* ── Commit message ── */}
        <div className="mt-6 glass-card rounded-2xl p-5">
          <label
            htmlFor="commit-msg"
            className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
          >
            Commit Message
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            <input
              id="commit-msg"
              type="text"
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              placeholder="What did you change?"
              maxLength={200}
              className="input-field w-full rounded-xl border border-glass-border bg-slate-950/60 px-4 py-3 pl-11 text-sm text-slate-200 placeholder:text-slate-600 outline-none"
            />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between mt-6">
          <Link
            href={`/snippet/${snippet.id}`}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Cancel
          </Link>

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={handleCommit}
            disabled={isSubmitting || isPending || !hasChanges}
            id="commit-changes-btn"
            className="inline-flex items-center gap-2 rounded-xl bg-accent hover:bg-accent-hover
                       px-6 py-3 text-sm font-semibold text-white transition-colors duration-200
                       shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30
                       disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting || isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Committing…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                </svg>
                Commit Changes
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

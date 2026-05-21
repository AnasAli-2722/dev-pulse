"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Language = Tables<"languages">;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Simple hash for the code_hash column (SHA-256 hex). */
async function hashCode(code: string): Promise<string> {
  const encoded = new TextEncoder().encode(code);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Map language name → Monaco language id. */
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

/** Count non-empty lines in a string. */
function countLines(code: string): number {
  return code.split("\n").filter((l) => l.trim().length > 0).length;
}

/* ------------------------------------------------------------------ */
/*  Starter code templates                                             */
/* ------------------------------------------------------------------ */

const STARTER_CODE: Record<string, string> = {
  javascript: `// Your JavaScript snippet\nfunction hello() {\n  console.log("Hello, Dev Pulse!");\n}\n\nhello();\n`,
  typescript: `// Your TypeScript snippet\nfunction greet(name: string): string {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("Dev Pulse"));\n`,
  python: `# Your Python snippet\ndef hello() -> str:\n    return "Hello, Dev Pulse!"\n\nprint(hello())\n`,
  rust: `// Your Rust snippet\nfn main() {\n    println!("Hello, Dev Pulse!");\n}\n`,
  go: `// Your Go snippet\npackage main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, Dev Pulse!")\n}\n`,
  default: `// Start writing your code here...\n`,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NewSnippetPage() {
  const router = useRouter();
  const supabase = createClient();

  // ── Form state ──
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [languageId, setLanguageId] = useState<number | null>(null);
  const [code, setCode] = useState(STARTER_CODE.default);
  const [commitMsg, setCommitMsg] = useState("Initial commit");
  const [isPublic, setIsPublic] = useState(true);

  // ── Data state ──
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLangName, setSelectedLangName] = useState("javascript");

  // ── UI state ──
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch languages on mount ──
  useEffect(() => {
    async function fetchLanguages() {
      const { data, error } = await supabase
        .from("languages")
        .select("*")
        .order("name");

      if (error) {
        console.error("Failed to fetch languages:", error.message);
        return;
      }

      setLanguages(data ?? []);

      // Default to JavaScript if available
      const js = data?.find(
        (l) => l.name.toLowerCase() === "javascript"
      );
      if (js) {
        setLanguageId(js.id);
        setSelectedLangName(js.name);
        setCode(STARTER_CODE.javascript);
      } else if (data && data.length > 0) {
        setLanguageId(data[0].id);
        setSelectedLangName(data[0].name);
      }
    }

    fetchLanguages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle language change ──
  function handleLanguageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(e.target.value);
    const lang = languages.find((l) => l.id === id);
    if (lang) {
      setLanguageId(lang.id);
      setSelectedLangName(lang.name);

      // Update starter code if code hasn't been modified from a starter template
      const currentIsStarter = Object.values(STARTER_CODE).some(
        (s) => s === code
      );
      if (currentIsStarter) {
        const key = lang.name.toLowerCase();
        setCode(STARTER_CODE[key] ?? STARTER_CODE.default);
      }
    }
  }

  // ── Submit: 2-step insert ──
  async function handlePublish() {
    setError(null);

    // Validation
    if (!title.trim()) {
      setError("Please enter a snippet title.");
      return;
    }
    if (!languageId) {
      setError("Please select a language.");
      return;
    }
    if (!code.trim()) {
      setError("Please write some code before publishing.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to publish a snippet.");
        setIsSubmitting(false);
        return;
      }

      // Step 1: Insert into snippets table
      const { data: snippet, error: snippetError } = await supabase
        .from("snippets")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          language_id: languageId,
          owner_id: user.id,
          is_public: isPublic,
        })
        .select("id")
        .single();

      if (snippetError || !snippet) {
        throw new Error(
          snippetError?.message ?? "Failed to create snippet."
        );
      }

      // Step 2: Insert the first version
      const codeHash = await hashCode(code);
      const linesAdded = countLines(code);

      const { error: versionError } = await supabase
        .from("versions")
        .insert({
          snippet_id: snippet.id,
          version_number: 1,
          code,
          code_hash: codeHash,
          commit_msg: commitMsg.trim() || "Initial commit",
          author_id: user.id,
          is_current: true,
          lines_added: linesAdded,
          lines_removed: 0,
        });

      if (versionError) {
        throw new Error(versionError.message);
      }

      // Success — redirect
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setIsSubmitting(false);
    }
  }

  // ── Derived ──
  const monacoLang = toMonacoLang(selectedLangName);
  const lineCount = code.split("\n").length;
  const charCount = code.length;

  return (
    <div className="flex-1 pb-16">
      {/* ── Page header ── */}
      <header className="relative overflow-hidden border-b border-white/[0.04] bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[200px] w-[500px] rounded-full bg-indigo-500/[0.06] blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 mb-4">
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
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Create a snippet
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Write your code, pick a language, and share it with the community.
          </p>
        </div>
      </header>

      {/* ── Main form area ── */}
      <div className="mx-auto max-w-4xl px-6 pt-8">
        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* ── Glass container ── */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          {/* ── Title input ── */}
          <div>
            <label
              htmlFor="snippet-title"
              className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
            >
              Title
            </label>
            <input
              id="snippet-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React useDebounce Hook"
              maxLength={120}
              className="input-field w-full rounded-xl border border-glass-border bg-slate-950/60 px-4 py-3.5 text-lg font-medium text-white placeholder:text-slate-600 outline-none"
            />
          </div>

          {/* ── Description + Language row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="snippet-description"
                className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
              >
                Description
                <span className="text-slate-600 ml-1 normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <input
                id="snippet-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of what this snippet does"
                maxLength={280}
                className="input-field w-full rounded-xl border border-glass-border bg-slate-950/60 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="snippet-language"
                className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
              >
                Language
              </label>
              <div className="relative">
                <select
                  id="snippet-language"
                  value={languageId ?? ""}
                  onChange={handleLanguageChange}
                  className="input-field w-full appearance-none rounded-xl border border-glass-border bg-slate-950/60 px-4 py-3 pr-10 text-sm text-slate-200 outline-none cursor-pointer"
                >
                  {languages.length === 0 && (
                    <option value="" disabled>
                      Loading…
                    </option>
                  )}
                  {languages.map((lang) => (
                    <option
                      key={lang.id}
                      value={lang.id}
                      className="bg-slate-900 text-slate-200"
                    >
                      {lang.name}
                    </option>
                  ))}
                </select>
                {/* Dropdown chevron */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-4 w-4 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19.5 8.25-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ── Code editor ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                Code
              </label>
              <div className="flex items-center gap-3 text-[11px] text-slate-600 tabular-nums">
                <span>{lineCount} lines</span>
                <span>{charCount} chars</span>
              </div>
            </div>

            {/* Neumorphic editor container */}
            <div
              className="overflow-hidden rounded-xl
                          ring-1 ring-white/[0.04]
                          shadow-[inset_3px_3px_8px_rgba(0,0,0,0.55),inset_-2px_-2px_6px_rgba(255,255,255,0.025)]"
            >
              {/* Editor toolbar */}
              <div className="flex items-center gap-1.5 border-b border-white/[0.04] bg-[#1e1e1e] px-4 py-2.5">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
                <span className="ml-3 text-[11px] text-slate-500 font-mono">
                  {title.trim() || "untitled"}
                  {languages.find((l) => l.id === languageId)?.extension ??
                    ".js"}
                </span>
              </div>

              <Editor
                height="500px"
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
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6,
                  },
                }}
                loading={
                  <div className="flex items-center justify-center h-[500px] bg-[#1e1e1e]">
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

          {/* ── Bottom controls: Commit message + visibility ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="commit-msg"
                className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
              >
                Commit Message
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg
                    className="h-4 w-4 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                    />
                  </svg>
                </div>
                <input
                  id="commit-msg"
                  type="text"
                  value={commitMsg}
                  onChange={(e) => setCommitMsg(e.target.value)}
                  placeholder="Initial commit"
                  maxLength={200}
                  className="input-field w-full rounded-xl border border-glass-border bg-slate-950/60 px-4 py-3 pl-11 text-sm text-slate-200 placeholder:text-slate-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Visibility
              </label>
              <div className="flex rounded-xl border border-glass-border bg-slate-950/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 py-3 text-sm font-medium transition-all cursor-pointer ${
                    isPublic
                      ? "bg-accent/15 text-accent"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 py-3 text-sm font-medium transition-all border-l border-glass-border cursor-pointer ${
                    !isPublic
                      ? "bg-accent/15 text-accent"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Private
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action bar ── */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            ← Cancel
          </button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={handlePublish}
            disabled={isSubmitting || isPending}
            id="publish-snippet-btn"
            className="inline-flex items-center gap-2 rounded-xl bg-accent hover:bg-accent-hover
                       px-6 py-3 text-sm font-semibold text-white transition-colors duration-200
                       shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30
                       disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting || isPending ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
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
                Publishing…
              </>
            ) : (
              <>
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
                    d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                  />
                </svg>
                Publish Snippet
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

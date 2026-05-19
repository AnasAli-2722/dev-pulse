import SnippetFeed from "./components/snippet-feed";
import type { SnippetWithAuthor } from "./components/snippet-card";

/* ------------------------------------------------------------------ */
/*  Mock data — replace with real Supabase queries                     */
/* ------------------------------------------------------------------ */
const MOCK_SNIPPETS: SnippetWithAuthor[] = [
  {
    id: 1,
    title: "React useDebounce Hook",
    description:
      "A lightweight custom hook for debouncing values in React components with configurable delay.",
    language_id: 2,
    owner_id: "u1",
    star_count: 128,
    fork_count: 34,
    view_count: 1420,
    is_public: true,
    forked_from_id: null,
    created_at: "2026-05-18T10:00:00Z",
    updated_at: "2026-05-19T02:30:00Z",
    profiles: { username: "sarah_dev", avatar_url: null },
    languages: { name: "TypeScript", extension: ".ts" },
    code_preview: `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}`,
  },
  {
    id: 2,
    title: "Python FastAPI Auth Middleware",
    description:
      "JWT-based authentication middleware for FastAPI with role-based access control.",
    language_id: 3,
    owner_id: "u2",
    star_count: 256,
    fork_count: 72,
    view_count: 3100,
    is_public: true,
    forked_from_id: null,
    created_at: "2026-05-15T08:00:00Z",
    updated_at: "2026-05-17T14:00:00Z",
    profiles: { username: "backend_ninja", avatar_url: null },
    languages: { name: "Python", extension: ".py" },
    code_preview: `from fastapi import Depends, HTTPException
from jose import JWTError, jwt

async def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGO])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception`,
  },
  {
    id: 3,
    title: "Rust Error Handling Pattern",
    description: "Ergonomic error types with thiserror and anyhow for production Rust apps.",
    language_id: 4,
    owner_id: "u3",
    star_count: 89,
    fork_count: 15,
    view_count: 920,
    is_public: true,
    forked_from_id: null,
    created_at: "2026-05-10T12:00:00Z",
    updated_at: "2026-05-12T09:00:00Z",
    profiles: { username: "rustacean42", avatar_url: null },
    languages: { name: "Rust", extension: ".rs" },
    code_preview: `use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("Not found: {0}")]
    NotFound(String),
    #[error("Unauthorized")]
    Unauthorized,
}`,
  },
  {
    id: 4,
    title: "Go HTTP Server Template",
    description: "Production-ready Go HTTP server with graceful shutdown and structured logging.",
    language_id: 5,
    owner_id: "u4",
    star_count: 312,
    fork_count: 98,
    view_count: 4500,
    is_public: true,
    forked_from_id: null,
    created_at: "2026-05-08T16:00:00Z",
    updated_at: "2026-05-10T20:00:00Z",
    profiles: { username: "go_wizard", avatar_url: null },
    languages: { name: "Go", extension: ".go" },
    code_preview: `func main() {
    srv := &http.Server{
        Addr:         ":8080",
        Handler:      router(),
        ReadTimeout:  5 * time.Second,
        WriteTimeout: 10 * time.Second,
    }

    go func() {
        log.Println("Server starting on :8080")
        if err := srv.ListenAndServe(); err != nil {
            log.Fatal(err)
        }
    }()
}`,
  },
  {
    id: 5,
    title: "CSS Glass Card Component",
    description: "Glassmorphism card with backdrop blur and frosted-glass effect.",
    language_id: 15,
    owner_id: "u5",
    star_count: 67,
    fork_count: 22,
    view_count: 780,
    is_public: true,
    forked_from_id: null,
    created_at: "2026-05-12T14:00:00Z",
    updated_at: "2026-05-14T11:00:00Z",
    profiles: { username: "css_artisan", avatar_url: null },
    languages: { name: "CSS", extension: ".css" },
    code_preview: `.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}`,
  },
  {
    id: 6,
    title: "SQL Window Functions Cheatsheet",
    description: "Common window function patterns for analytics queries in PostgreSQL.",
    language_id: 17,
    owner_id: "u2",
    star_count: 445,
    fork_count: 120,
    view_count: 6200,
    is_public: true,
    forked_from_id: null,
    created_at: "2026-05-01T09:00:00Z",
    updated_at: "2026-05-05T18:00:00Z",
    profiles: { username: "backend_ninja", avatar_url: null },
    languages: { name: "SQL", extension: ".sql" },
    code_preview: `SELECT
  name,
  department,
  salary,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank,
  AVG(salary) OVER (PARTITION BY department) as dept_avg,
  salary - LAG(salary) OVER (ORDER BY hire_date) as diff
FROM employees;`,
  },
  {
    id: 7,
    title: "JavaScript Proxy Observer",
    description: "Reactive state management using ES6 Proxy for automatic change detection.",
    language_id: 1,
    owner_id: "u1",
    star_count: 193,
    fork_count: 41,
    view_count: 2100,
    is_public: true,
    forked_from_id: null,
    created_at: "2026-05-16T11:00:00Z",
    updated_at: "2026-05-18T08:00:00Z",
    profiles: { username: "sarah_dev", avatar_url: null },
    languages: { name: "JavaScript", extension: ".js" },
    code_preview: `function createObservable(target, onChange) {
  return new Proxy(target, {
    set(obj, prop, value) {
      const oldValue = obj[prop];
      obj[prop] = value;
      onChange(prop, value, oldValue);
      return true;
    },
  });
}`,
  },
  {
    id: 8,
    title: "Kotlin Coroutine Flow Utils",
    description: "Utility extensions for Kotlin Flow including retry, throttle, and batch operators.",
    language_id: 12,
    owner_id: "u6",
    star_count: 76,
    fork_count: 18,
    view_count: 650,
    is_public: true,
    forked_from_id: null,
    created_at: "2026-05-14T07:00:00Z",
    updated_at: "2026-05-16T15:00:00Z",
    profiles: { username: "kotlin_dev", avatar_url: null },
    languages: { name: "Kotlin", extension: ".kt" },
    code_preview: `fun <T> Flow<T>.retryWithDelay(
    maxRetries: Int = 3,
    initialDelay: Long = 1000L,
    factor: Double = 2.0
): Flow<T> = retryWhen { cause, attempt ->
    if (attempt < maxRetries) {
        delay((initialDelay * factor.pow(attempt)).toLong())
        true
    } else false
}`,
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <main className="flex-1">
      {/* ── Hero header ── */}
      <header className="relative overflow-hidden border-b border-white/[0.04] bg-gradient-to-b from-slate-900/50 to-transparent">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-indigo-500/[0.07] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-400 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            Community Snippets
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Discover&nbsp;
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Code Snippets
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400">
            Browse production-ready code from the community. Star your
            favorites, fork and iterate, or share your own.
          </p>
        </div>
      </header>

      {/* ── Snippet Feed ── */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        <SnippetFeed snippets={MOCK_SNIPPETS} />
      </div>
    </main>
  );
}

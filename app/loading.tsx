/* ------------------------------------------------------------------ */
/*  Home Feed Skeleton                                                 */
/*  Mimics: Hero header + filter bar + SnippetCard grid                */
/* ------------------------------------------------------------------ */

export default function HomeLoading() {
  return (
    <div className="flex-1 animate-pulse">
      {/* ── Hero header skeleton ── */}
      <header className="relative overflow-hidden border-b border-white/[0.04] bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-indigo-500/[0.04] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-14 text-center">
          {/* Badge */}
          <div className="mx-auto mb-5 h-7 w-44 rounded-full bg-slate-800/50" />
          {/* Title */}
          <div className="mx-auto h-12 w-96 max-w-full rounded-xl bg-slate-800/40" />
          {/* Subtitle */}
          <div className="mx-auto mt-4 h-5 w-80 max-w-full rounded-lg bg-slate-800/30" />
        </div>
      </header>

      {/* ── Filter bar skeleton ── */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
          {/* Search bar */}
          <div className="h-10 flex-1 w-full rounded-xl bg-slate-800/40 ring-1 ring-white/[0.04]" />
          {/* Sort pills */}
          <div className="flex gap-2">
            <div className="h-9 w-20 rounded-lg bg-slate-800/40" />
            <div className="h-9 w-24 rounded-lg bg-slate-800/30" />
            <div className="h-9 w-28 rounded-lg bg-slate-800/30" />
          </div>
        </div>

        {/* ── Snippet Card Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SnippetCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SnippetCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-2xl border border-white/[0.06]
                  bg-gradient-to-br from-slate-900/80 via-slate-900/90 to-slate-950
                  shadow-lg shadow-black/30 overflow-hidden"
    >
      {/* Header: lang pill + time */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="h-6 w-20 rounded-full bg-slate-800/60" />
        <div className="h-3 w-12 rounded bg-slate-800/40" />
      </div>

      {/* Title + description */}
      <div className="px-5 pb-3">
        <div className="h-5 w-3/4 rounded bg-slate-800/50 mb-2" />
        <div className="h-3 w-full rounded bg-slate-800/30" />
        <div className="h-3 w-2/3 rounded bg-slate-800/30 mt-1.5" />
      </div>

      {/* Code preview block */}
      <div className="mx-4 mb-4 flex-1">
        <div
          className="rounded-xl p-4 bg-slate-950/70
                      shadow-[inset_2px_2px_6px_rgba(0,0,0,0.55),inset_-1px_-1px_4px_rgba(255,255,255,0.03)]
                      ring-1 ring-white/[0.04]"
        >
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-3 w-4 rounded bg-slate-800/40" />
                <div
                  className="h-3 rounded bg-slate-800/30"
                  style={{ width: `${60 + Math.random() * 30}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: author + stats */}
      <div className="flex items-center justify-between border-t border-white/[0.04] bg-slate-950/40 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-slate-800/50" />
          <div className="h-3 w-16 rounded bg-slate-800/40" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3 w-8 rounded bg-slate-800/30" />
          <div className="h-3 w-8 rounded bg-slate-800/30" />
          <div className="h-3 w-8 rounded bg-slate-800/30" />
        </div>
      </div>
    </div>
  );
}

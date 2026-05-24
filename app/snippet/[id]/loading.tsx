/* ------------------------------------------------------------------ */
/*  Snippet Detail Skeleton                                            */
/*  Mimics: Header + 2-column (Code viewer + Version timeline)         */
/* ------------------------------------------------------------------ */

export default function SnippetDetailLoading() {
  return (
    <div className="flex-1 pb-12 animate-pulse">
      {/* ── Header skeleton ── */}
      <header className="relative overflow-hidden border-b border-white/[0.04] bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[200px] w-[500px] rounded-full bg-indigo-500/[0.04] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-3 w-10 rounded bg-slate-800/30" />
            <div className="h-3 w-3 rounded bg-slate-800/20" />
            <div className="h-3 w-32 rounded bg-slate-800/40" />
          </div>

          {/* Title + lang pill */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-64 rounded-xl bg-slate-800/50" />
            <div className="h-6 w-20 rounded-full bg-slate-800/40" />
          </div>

          {/* Description */}
          <div className="h-4 w-96 max-w-full rounded bg-slate-800/30 mb-4" />

          {/* Author row */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-slate-800/50" />
            <div className="h-3 w-20 rounded bg-slate-800/40" />
            <div className="h-3 w-1 rounded bg-slate-800/20" />
            <div className="h-3 w-14 rounded bg-slate-800/30" />
          </div>
        </div>
      </header>

      {/* ── 2-Column layout ── */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left: Code Viewer (75%) ── */}
          <div className="flex-1 lg:w-3/4 min-w-0">
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Editor toolbar */}
              <div className="flex items-center justify-between border-b border-white/[0.04] bg-[#1e1e1e] px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/30" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/30" />
                  <div className="h-3 w-3 rounded-full bg-green-500/30" />
                  <div className="ml-3 h-3 w-28 rounded bg-slate-700/40" />
                </div>
                <div className="flex gap-3">
                  <div className="h-3 w-8 rounded bg-slate-700/30" />
                  <div className="h-3 w-14 rounded bg-slate-700/30" />
                </div>
              </div>

              {/* Code area — massive pulsing block */}
              <div
                className="p-6 bg-[#1e1e1e]
                            shadow-[inset_2px_2px_6px_rgba(0,0,0,0.4),inset_-1px_-1px_4px_rgba(255,255,255,0.02)]"
                style={{ height: "560px" }}
              >
                <div className="space-y-3">
                  {Array.from({ length: 22 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      {/* Line number */}
                      <div className="h-3.5 w-5 rounded bg-slate-700/30 shrink-0" />
                      {/* Code line */}
                      <div
                        className="h-3.5 rounded bg-slate-700/20"
                        style={{
                          width: `${20 + Math.sin(i * 0.7) * 30 + Math.random() * 30}%`,
                          marginLeft: `${(i > 3 && i < 18) ? (i > 5 && i < 16 ? 32 : 16) : 0}px`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Version Timeline (25%) ── */}
          <div className="lg:w-1/4 shrink-0">
            <div className="glass-card rounded-2xl p-5">
              {/* Section title */}
              <div className="h-4 w-24 rounded bg-slate-800/40 mb-5" />

              {/* Version rows */}
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl px-4 py-3 bg-slate-950/50
                                shadow-[inset_1px_1px_4px_rgba(0,0,0,0.4)]
                                ring-1 ring-white/[0.04]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 w-12 rounded bg-slate-800/50" />
                      <div className="h-3 w-14 rounded bg-slate-800/30" />
                    </div>
                    <div className="h-3 w-3/4 rounded bg-slate-800/25" />
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-3 w-10 rounded bg-emerald-900/20" />
                      <div className="h-3 w-10 rounded bg-red-900/20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

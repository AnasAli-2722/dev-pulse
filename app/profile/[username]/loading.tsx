/* ------------------------------------------------------------------ */
/*  Profile Page Skeleton                                              */
/*  Mimics: 2-column layout — Identity Panel + Action Hub              */
/* ------------------------------------------------------------------ */

export default function ProfileLoading() {
  return (
    <div className="flex-1 pb-16 animate-pulse">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[400px] w-[500px] rounded-full bg-indigo-500/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ━━━ Left Column: Identity Panel ━━━ */}
          <aside className="lg:col-span-3">
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
              {/* Avatar */}
              <div className="h-24 w-24 rounded-full bg-slate-800/60 ring-2 ring-slate-700/30 mb-5" />

              {/* Name */}
              <div className="h-5 w-32 rounded-lg bg-slate-800/50 mb-2" />
              {/* Username */}
              <div className="h-4 w-24 rounded bg-slate-800/30 mb-3" />

              {/* Bio */}
              <div className="w-full max-w-[200px] space-y-1.5 mb-4">
                <div className="h-3 w-full rounded bg-slate-800/25" />
                <div className="h-3 w-3/4 rounded bg-slate-800/25 mx-auto" />
              </div>

              {/* Joined */}
              <div className="h-3 w-28 rounded bg-slate-800/20 mb-4" />

              {/* Compact Stats Row */}
              <div
                className="w-full rounded-xl py-3 px-2 bg-slate-950/50
                            shadow-[inset_1px_1px_4px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.04]"
              >
                <div className="flex items-center justify-around">
                  <div className="text-center space-y-1.5">
                    <div className="h-5 w-8 rounded bg-slate-800/40 mx-auto" />
                    <div className="h-2 w-6 rounded bg-slate-800/20 mx-auto" />
                  </div>
                  <div className="h-6 w-px bg-white/[0.06]" />
                  <div className="text-center space-y-1.5">
                    <div className="h-5 w-8 rounded bg-slate-800/40 mx-auto" />
                    <div className="h-2 w-8 rounded bg-slate-800/20 mx-auto" />
                  </div>
                  <div className="h-6 w-px bg-white/[0.06]" />
                  <div className="text-center space-y-1.5">
                    <div className="h-5 w-8 rounded bg-slate-800/40 mx-auto" />
                    <div className="h-2 w-10 rounded bg-slate-800/20 mx-auto" />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="w-full mt-4 pt-4 border-t border-white/[0.06] flex justify-center gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 w-9 rounded-xl bg-slate-800/40" />
                ))}
              </div>
            </div>
          </aside>

          {/* ━━━ Right Column: Action Hub ━━━ */}
          <div className="lg:col-span-9 space-y-6">
            {/* Heartbeat chart skeleton */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-slate-800/50" />
                  <div className="h-4 w-16 rounded bg-slate-800/40" />
                </div>
                <div className="h-3 w-24 rounded bg-slate-800/20" />
              </div>
              <div className="h-[100px] w-full rounded-lg bg-slate-800/20 relative overflow-hidden">
                {/* Fake pulse line */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                  <path
                    d="M0,60 L40,60 L50,60 L55,80 L60,20 L65,70 L70,60 L130,60 L140,60 L145,75 L150,25 L155,68 L160,60 L220,60 L230,60 L235,78 L240,15 L245,72 L250,60 L310,60 L320,60 L325,82 L330,22 L335,74 L340,60 L400,60"
                    fill="none"
                    stroke="rgba(52,211,153,0.15)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            {/* Tab bar skeleton */}
            <div
              className="flex rounded-xl p-1 bg-slate-950/60
                          shadow-[inset_1px_1px_4px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.04]"
            >
              <div className="flex-1 h-9 rounded-lg bg-slate-800/40" />
              <div className="flex-1 h-9 rounded-lg bg-slate-800/20 mx-1" />
              <div className="flex-1 h-9 rounded-lg bg-slate-800/20" />
            </div>

            {/* Snippet grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-2xl border border-white/[0.06]
                              bg-gradient-to-br from-slate-900/80 via-slate-900/90 to-slate-950
                              shadow-lg shadow-black/30 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="h-6 w-20 rounded-full bg-slate-800/60" />
                    <div className="h-3 w-12 rounded bg-slate-800/40" />
                  </div>
                  {/* Title */}
                  <div className="px-5 pb-3">
                    <div className="h-5 w-3/4 rounded bg-slate-800/50 mb-2" />
                    <div className="h-3 w-full rounded bg-slate-800/30" />
                  </div>
                  {/* Code preview */}
                  <div className="mx-4 mb-4 flex-1">
                    <div className="rounded-xl p-4 bg-slate-950/70 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.04]">
                      <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={j} className="flex gap-3">
                            <div className="h-3 w-4 rounded bg-slate-800/40" />
                            <div className="h-3 rounded bg-slate-800/30" style={{ width: `${50 + Math.random() * 40}%` }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-white/[0.04] bg-slate-950/40 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-slate-800/50" />
                      <div className="h-3 w-16 rounded bg-slate-800/40" />
                    </div>
                    <div className="flex gap-3">
                      <div className="h-3 w-8 rounded bg-slate-800/30" />
                      <div className="h-3 w-8 rounded bg-slate-800/30" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

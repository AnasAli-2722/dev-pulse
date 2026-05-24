/* ------------------------------------------------------------------ */
/*  Leaderboard Skeleton                                               */
/*  Mimics: Header + Podium (top 3) + Ranked ladder rows               */
/* ------------------------------------------------------------------ */

export default function LeaderboardLoading() {
  return (
    <div className="flex-1 pb-16 animate-pulse">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 h-[450px] w-[800px] rounded-full bg-indigo-500/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-slate-800/40 ring-1 ring-white/[0.06]" />
          <div className="mx-auto h-8 w-48 rounded-xl bg-slate-800/40 mb-3" />
          <div className="mx-auto h-4 w-72 rounded-lg bg-slate-800/25" />
          {/* Tier legend */}
          <div className="mt-5 flex items-center justify-center gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-slate-800/50" />
                <div className="h-2.5 w-10 rounded bg-slate-800/25" />
              </div>
            ))}
          </div>
        </div>

        {/* Podium */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 lg:items-end mb-12">
          {[false, true, false].map((isCenter, i) => (
            <div key={i} className={isCenter ? "sm:order-2 lg:scale-105 lg:-translate-y-3" : i === 0 ? "sm:order-1" : "sm:order-3"}>
              <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
                <div className="h-8 w-8 rounded-full bg-slate-800/50 mb-4" />
                <div className={`rounded-full bg-slate-800/50 mb-3 ${isCenter ? "h-20 w-20" : "h-16 w-16"}`} />
                <div className="h-4 w-24 rounded bg-slate-800/40 mb-1.5" />
                <div className="h-3 w-16 rounded bg-slate-800/25 mb-4" />
                <div className="flex items-center gap-4">
                  <div className="text-center space-y-1">
                    <div className="h-5 w-10 rounded bg-slate-800/40 mx-auto" />
                    <div className="h-2 w-6 rounded bg-slate-800/20 mx-auto" />
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="text-center space-y-1">
                    <div className="h-5 w-10 rounded bg-slate-800/40 mx-auto" />
                    <div className="h-2 w-8 rounded bg-slate-800/20 mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="h-3 w-24 rounded bg-slate-800/25" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* Ranked rows */}
        <div className="space-y-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl px-5 py-3.5
                          bg-slate-950/50
                          shadow-[inset_1px_1px_4px_rgba(0,0,0,0.4)]
                          ring-1 ring-white/[0.04]"
            >
              <div className="h-8 w-8 rounded-lg bg-slate-800/50" />
              <div className="h-2 w-2 rounded-full bg-slate-800/40" />
              <div className="h-9 w-9 rounded-full bg-slate-800/50" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-slate-800/40" />
                <div className="h-2.5 w-20 rounded bg-slate-800/20" />
              </div>
              <div className="h-3 w-10 rounded bg-slate-800/30" />
              <div className="text-right space-y-1">
                <div className="h-3.5 w-12 rounded bg-slate-800/40 ml-auto" />
                <div className="h-2 w-6 rounded bg-slate-800/20 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

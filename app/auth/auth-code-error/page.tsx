import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] pb-20 px-6">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center shadow-2xl shadow-black/50">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
          <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Authentication Failed</h1>
        <p className="text-sm text-slate-400 mb-6">
          Something went wrong during sign-in. This can happen if the link expired or was already used.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-accent hover:bg-accent-hover px-5 py-2.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}

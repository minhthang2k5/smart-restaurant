export default function AuthShell({ title, subtitle, icon, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-pink-100 via-rose-50 to-white" />

      <div className="glass-card w-full max-w-md rounded-3xl p-8 shadow-2xl border-2 border-white/40 bg-white/50 backdrop-blur-xl ring-1 ring-white/40">
        <div className="flex items-start gap-4 mb-8">
          <div className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-linear-to-br from-pink-500 to-rose-400 text-white">
            {icon}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-br from-pink-500 to-rose-400">
              {title}
            </h1>
            {subtitle && (
              <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="w-full">{children}</div>

        {footer && (
          <div className="mt-8 text-center text-sm text-slate-500">
            {footer}
          </div>
        )}

        <div className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-wider">
          Powered by pink glass ✨
        </div>
      </div>
    </div>
  );
}

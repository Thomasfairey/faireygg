"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-space-900 flex flex-col items-center justify-center gap-6 px-8">
      <div className="text-4xl">⚠️</div>
      <div className="text-lg font-bold text-white/70">Something went wrong</div>
      <div className="text-xs text-white/30 text-center max-w-xs">
        The neural link experienced interference. Try again.
      </div>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider cursor-pointer bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 transition-all"
      >
        Reconnect
      </button>
    </div>
  );
}

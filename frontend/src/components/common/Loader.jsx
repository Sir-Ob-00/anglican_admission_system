export default function Loader({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center rounded-3xl border border-white/40 bg-white/60 p-6 shadow-sm backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[color:var(--brand)]" />
        <div className="text-sm font-semibold text-slate-800">{label}</div>
      </div>
    </div>
  );
}

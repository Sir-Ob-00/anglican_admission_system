import { cx } from "../../utils/helpers";

export default function StatCard({ title, value, hint, tone = "brand", icon: Icon }) {
  const toneClass =
    tone === "brand"
      ? "from-[color:var(--brand)]/15 to-white/40"
      : tone === "teal"
        ? "from-[color:var(--brand2)]/15 to-white/40"
        : tone === "gold"
          ? "from-[color:var(--gold)]/18 to-white/40"
          : "from-slate-900/10 to-white/40";

  const iconWrap =
    tone === "brand"
      ? "bg-[color:var(--brand)]/15 text-[color:var(--brand)]"
      : tone === "teal"
        ? "bg-[color:var(--brand2)]/15 text-[color:var(--brand2)]"
        : tone === "gold"
          ? "bg-[color:var(--gold)]/20 text-[color:var(--gold)]"
          : "bg-slate-900/10 text-slate-700";

  return (
    <div
      className={cx(
        "rounded-3xl border border-white/40 bg-gradient-to-br p-4 shadow-sm backdrop-blur-xl",
        toneClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</div>
          <div className="mt-1 font-display text-3xl font-semibold text-slate-900">{value}</div>
        </div>
        {Icon ? (
          <div className={cx("inline-flex h-11 w-11 items-center justify-center rounded-2xl", iconWrap)}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      {hint && <div className="mt-2 text-sm text-slate-600">{hint}</div>}
    </div>
  );
}

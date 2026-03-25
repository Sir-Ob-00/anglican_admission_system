import { ADMISSION_STATUSES, cx, statusLabel } from "../../utils/helpers";

export default function StatusPipeline({ status }) {
  const normalizedStatus = String(status || "").toLowerCase();
  const idx = Math.max(0, ADMISSION_STATUSES.indexOf(normalizedStatus));
  const max = Math.max(0, ADMISSION_STATUSES.length - 1);
  const isRejectedFlow = normalizedStatus === "rejected" || normalizedStatus === "exam_failed";

  return (
    <div className="rounded-3xl border border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur-xl">
      <div className="text-sm font-semibold text-slate-900">Admission Workflow</div>
      <div className="mt-3 rounded-2xl bg-white/60 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Current stage</div>
        <div className="mt-1 text-sm font-semibold text-slate-900">{statusLabel(ADMISSION_STATUSES[idx])}</div>
        <input
          type="range"
          min={0}
          max={max}
          value={idx}
          readOnly
          disabled
          className="mt-3 w-full accent-[color:var(--brand)]"
        />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ADMISSION_STATUSES.map((s, i) => (
          <div
            key={s}
            className={cx(
              "rounded-2xl border px-3 py-2 text-sm font-semibold",
              i < idx
                ? "border-emerald-200 bg-emerald-600/10 text-emerald-900"
                : s === "rejected" && isRejectedFlow
                  ? "border-rose-200 bg-rose-600/10 text-rose-900"
                  : "border-[color:var(--brand)]/20 bg-[color:var(--brand)]/10 text-slate-900"
            )}
          >
            {statusLabel(s)}
          </div>
        ))}
      </div>
    </div>
  );
}

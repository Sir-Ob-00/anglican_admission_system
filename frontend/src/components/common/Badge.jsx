import { cx } from "../../utils/helpers";

const tones = {
  neutral: "bg-slate-900/5 text-slate-800",
  success: "bg-emerald-600/15 text-emerald-800",
  warning: "bg-amber-600/15 text-amber-900",
  danger: "bg-rose-600/15 text-rose-800",
  info: "bg-sky-600/15 text-sky-800",
};

export default function Badge({ children, tone = "neutral" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone] || tones.neutral
      )}
    >
      {children}
    </span>
  );
}

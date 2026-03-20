import { useEffect } from "react";
import { cx } from "../../utils/helpers";

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (!closeOnEscape) return;
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, closeOnEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6">
      <div
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm"
        onMouseDown={() => {
          if (closeOnBackdrop) onClose?.();
        }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          "relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-2xl backdrop-blur-xl",
          "animate-[fadeIn_.14s_ease-out]"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
          <div className="font-display text-lg font-semibold text-slate-900">{title}</div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-700 hover:bg-slate-900/10"
            onClick={onClose}
            aria-label="Close dialog"
          >
            X
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="border-t border-slate-200/70 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title = "Confirm action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "danger",
  onConfirm,
  onClose,
}) {
  const buttonClass =
    tone === "danger"
      ? "bg-rose-600 hover:bg-rose-700"
      : tone === "warning"
        ? "bg-amber-600 hover:bg-amber-700"
        : "bg-[color:var(--brand)] hover:brightness-110";

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white ${buttonClass}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="text-sm leading-relaxed text-slate-700">{message}</div>
    </Modal>
  );
}

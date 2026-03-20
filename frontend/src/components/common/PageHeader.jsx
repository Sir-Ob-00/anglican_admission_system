export default function PageHeader({ title, subtitle, right }) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="min-w-0">
        <div className="font-display text-2xl font-semibold text-slate-900">{title}</div>
        {subtitle && <div className="mt-1 text-sm text-slate-600">{subtitle}</div>}
      </div>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

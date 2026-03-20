import { useMemo, useState } from "react";
import { cx } from "../../utils/helpers";

export default function Table({
  title,
  columns,
  rows,
  rowKey = "id",
  searchable = true,
  initialPageSize = 10,
  onRowClick,
  actions,
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const filtered = useMemo(() => {
    if (!searchable || !q.trim()) return rows || [];
    const needle = q.trim().toLowerCase();
    return (rows || []).filter((r) =>
      Object.values(r || {}).some((v) => String(v ?? "").toLowerCase().includes(needle))
    );
  }, [rows, q, searchable]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const slice = filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  return (
    <section className="rounded-3xl border border-white/40 bg-white/60 shadow-sm backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/70 px-4 py-4">
        <div className="min-w-0">
          <div className="font-display text-lg font-semibold text-slate-900">{title}</div>
          <div className="text-xs text-slate-600">{filtered.length} records</div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {searchable && (
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              className="h-10 w-[220px] rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-800 outline-none focus:border-[color:var(--brand)]"
            />
          )}

          {actions}
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/60 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {slice.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-600">
                  No results.
                </td>
              </tr>
            ) : (
              slice.map((r, idx) => (
                <tr
                  key={String(r?.[rowKey] ?? `${clampedPage}:${idx}`)}
                  className={cx(
                    "transition",
                    onRowClick ? "cursor-pointer hover:bg-white/50" : ""
                  )}
                  onClick={() => onRowClick?.(r)}
                >
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-slate-800">
                      {c.render ? c.render(r) : String(r?.[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 px-4 py-3 text-sm text-slate-700">
        <div>
          Page <span className="font-semibold text-slate-900">{clampedPage}</span> of{" "}
          <span className="font-semibold text-slate-900">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-9 rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-800 outline-none"
            aria-label="Rows per page"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900/5 px-3 font-semibold text-slate-800 hover:bg-slate-900/10 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={clampedPage <= 1}
          >
            Prev
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900/5 px-3 font-semibold text-slate-800 hover:bg-slate-900/10 disabled:opacity-40"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={clampedPage >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

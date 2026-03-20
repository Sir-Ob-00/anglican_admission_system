import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { formatDate } from "../../utils/helpers";
import * as backupService from "../../services/backupService";
import { useAuth } from "../../context/AuthContext";

export default function BackupSystem() {
  const [rows, setRows] = useState([]);
  const { role } = useAuth();
  const allowed = role === "admin" || role === "headteacher";

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (!allowed) {
          if (!ignore) setRows([]);
          return;
        }
        const data = await backupService.listBackups();
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) setRows(items);
      } catch {
        if (!ignore) setRows([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [allowed]);

  const columns = useMemo(
    () => [
      { key: "name", header: "Backup" },
      { key: "createdAt", header: "Created", render: (r) => formatDate(r.createdAt) },
      { key: "status", header: "Status", render: (r) => <Badge tone="success">{String(r.status).toUpperCase()}</Badge> },
      {
        key: "actions",
        header: "Actions",
        render: (r) => (
          <div className="flex flex-wrap items-center gap-2">
            <a
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900/5 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-900/10"
              href={backupService.backupDownloadUrl(r._id || r.id)}
              target="_blank"
              rel="noreferrer"
            >
              Download
            </a>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-amber-600 px-3 text-xs font-semibold text-white hover:bg-amber-700"
              onClick={async () => {
                try {
                  const res = await backupService.restoreBackup(r._id || r.id, false);
                  alert(`Dry run restore. Counts: ${JSON.stringify(res.counts)}`);
                } catch {
                  alert("Restore check failed.");
                }
              }}
            >
              Restore (Dry)
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <PageHeader title="System Backup" subtitle="Create backups, view history, and restore." />

      {!allowed ? (
        <Panel className="p-5">
          <div className="font-display text-lg font-semibold text-slate-900">Access denied</div>
          <div className="mt-2 text-sm text-slate-600">
            Only Admin and Headteacher can perform backups.
          </div>
        </Panel>
      ) : null}

      <Panel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-lg font-semibold text-slate-900">Create backup</div>
            <div className="mt-1 text-sm text-slate-600">Backend hook: `POST /api/backups/create`.</div>
          </div>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
            onClick={async () => {
              try {
                await backupService.createBackup();
                const data = await backupService.listBackups();
                setRows(Array.isArray(data) ? data : data.items || []);
              } catch {
                alert("Backup create failed. Check backend permissions.");
              }
            }}
          >
            Create Backup
          </button>
        </div>
      </Panel>

      <Table title="Backup History" rows={rows} columns={columns} searchable={false} />
    </div>
  );
}

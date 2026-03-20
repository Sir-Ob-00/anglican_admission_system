import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import { formatDate } from "../../utils/helpers";
import { listActivityLogs } from "../../services/activityLogService";
import { useAuth } from "../../context/AuthContext";
import Panel from "../../components/common/Panel";

export default function ActivityLogs() {
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
        const data = await listActivityLogs({ limit: 200 });
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
      { key: "user", header: "User", render: (r) => r.user?.name || r.user || "—" },
      { key: "action", header: "Action" },
      { key: "date", header: "Date", render: (r) => formatDate(r.timestamp || r.date) },
      { key: "ip", header: "IP Address", render: (r) => r.ipAddress || r.ip || "—" },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Activity Logs" subtitle="Audit log of system actions." />
      {!allowed ? (
        <Panel className="p-5">
          <div className="font-display text-lg font-semibold text-slate-900">Access denied</div>
          <div className="mt-2 text-sm text-slate-600">
            Only Admin and Headteacher can view activity logs.
          </div>
        </Panel>
      ) : null}
      <Table title="Activity Logs" rows={rows} columns={columns} searchable={true} />
    </div>
  );
}

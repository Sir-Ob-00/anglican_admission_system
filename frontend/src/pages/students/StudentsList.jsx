import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { listStudents } from "../../services/studentService";

export default function StudentsList() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await listStudents();
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) {
          setRows(
            items.map((s) => ({
              id: s._id || s.id,
              name: s.fullName || s.name,
              className: s.classAssigned?.name || "—",
              status: "active",
            }))
          );
        }
      } catch {
        if (!ignore) setRows([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);
  const columns = useMemo(
    () => [
      { key: "name", header: "Student" },
      { key: "className", header: "Class" },
      {
        key: "status",
        header: "Status",
        render: (r) => (
          <Badge tone={r.status === "active" ? "success" : "neutral"}>
            {String(r.status).toUpperCase()}
          </Badge>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Students" subtitle="Admitted students list." />
      <Table title="Students List" rows={rows} columns={columns} />
    </div>
  );
}

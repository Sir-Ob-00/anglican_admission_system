import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import { useAuth } from "../../context/AuthContext";
import { createClass, listClasses, updateClass } from "../../services/classService";
import { listTeachers } from "../../services/teacherService";

export default function ClassesList() {
  const { role } = useAuth();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(40);
  const [teacherId, setTeacherId] = useState("");
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await listClasses();
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) setRows(items);
      } catch {
        if (!ignore) setRows([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    if (!open) return;
    (async () => {
      try {
        const data = await listTeachers();
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) setTeachers(items);
      } catch {
        if (!ignore) setTeachers([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [open]);

  async function refresh() {
    const data = await listClasses();
    const items = Array.isArray(data) ? data : data.items || [];
    setRows(items);
  }
  const columns = useMemo(
    () => [
      { key: "name", header: "Class" },
      {
        key: "teacher",
        header: "Class Teacher",
        render: (r) => r.teacher?.user?.name || r.teacher?.name || "—",
      },
      { key: "students", header: "Capacity", render: (r) => r.capacity ?? r.students ?? "—" },
      ...(role === "headteacher"
        ? [
            {
              key: "actions",
              header: "Actions",
              render: (r) => (
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900/5 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-900/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(r);
                    setName(r.name || "");
                    setCapacity(Number(r.capacity || 40));
                    setTeacherId(r.teacher?._id || "");
                    setOpen(true);
                  }}
                >
                  Edit
                </button>
              ),
            },
          ]
        : []),
    ],
    [role]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Classes"
        subtitle="Class lists and assignments."
        right={
          role === "headteacher" ? (
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
              onClick={() => {
                setEditing(null);
                setName("");
                setCapacity(40);
                setTeacherId("");
                setOpen(true);
              }}
            >
              Create Class
            </button>
          ) : null
        }
      />
      <Table title="Classes List" rows={rows} columns={columns} />

      <Modal
        open={open}
        title={editing ? "Edit Class" : "Create Class"}
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white hover:brightness-110"
              onClick={async () => {
                try {
                  if (editing) {
                    await updateClass(editing._id || editing.id, { name, capacity, teacher: teacherId || null });
                  } else {
                    await createClass({ name, capacity, teacher: teacherId || null });
                  }
                  await refresh();
                  setOpen(false);
                } catch {
                  alert("Save failed.");
                }
              }}
              disabled={!name}
            >
              Save
            </button>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-800">Class Name</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Primary 3"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Capacity</label>
            <input
              type="number"
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              min={1}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-800">Class Teacher</label>
            <select
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {teachers.map((t) => (
                <option key={t._id || t.id} value={t._id || t.id}>
                  {t.user?.name || "Teacher"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

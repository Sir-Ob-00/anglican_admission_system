import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import { useAuth } from "../../context/AuthContext";
import {
  activateTeacher,
  createTeacher,
  deactivateTeacher,
  listTeachers,
  resetTeacherPassword,
  updateTeacher,
} from "../../services/teacherService";

export default function TeachersList() {
  const { role } = useAuth();
  const [rows, setRows] = useState([]);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTeacher, setResetTeacher] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [userId, setUserId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [subject, setSubject] = useState("");

  async function refresh() {
    const data = await listTeachers();
    const items = Array.isArray(data) ? data : data.items || [];
    setRows(items);
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        await refresh();
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
      { key: "name", header: "Teacher", render: (r) => r.user?.name || r.name },
      { key: "subject", header: "Subject", render: (r) => r.subject || r.user?.subject || "—" },
      {
        key: "status",
        header: "Status",
        render: (r) => (
          <Badge tone={r.user?.isActive === false ? "neutral" : "success"}>
            {r.user?.isActive === false ? "INACTIVE" : "ACTIVE"}
          </Badge>
        ),
      },
      ...(role === "headteacher"
        ? [
            {
              key: "edit",
              header: "Edit",
              render: (r) => (
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900/5 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-900/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(r);
                    setUserId(r.user?._id || r.user || "");
                    setStaffId(r.staffId || "");
                    setSubject(r.subject || "");
                    setEditOpen(true);
                  }}
                >
                  Edit
                </button>
              ),
            },
          ]
        : []),
      ...(role === "admin"
        ? [
            {
              key: "actions",
              header: "Actions",
              render: (r) => (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900/5 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-900/10"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await activateTeacher(r._id || r.id);
                        await refresh();
                      } catch {
                        alert("Activate failed.");
                      }
                    }}
                  >
                    Activate
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-2xl bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await deactivateTeacher(r._id || r.id);
                        await refresh();
                      } catch {
                        alert("Deactivate failed.");
                      }
                    }}
                  >
                    Deactivate
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-3 text-xs font-semibold text-white hover:brightness-110"
                    onClick={(e) => {
                      e.stopPropagation();
                      setResetTeacher(r);
                      setNewPassword("");
                      setResetOpen(true);
                    }}
                  >
                    Reset Password
                  </button>
                </div>
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
        title="Teachers"
        subtitle="Teacher directory."
        right={
          role === "headteacher" ? (
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
              onClick={() => {
                setEditing(null);
                setUserId("");
                setStaffId("");
                setSubject("");
                setEditOpen(true);
              }}
            >
              Add Teacher
            </button>
          ) : null
        }
      />
      <Table title="Teachers List" rows={rows} columns={columns} />

      <Modal
        open={resetOpen}
        title="Reset Teacher Password"
        onClose={() => setResetOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setResetOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white hover:brightness-110"
              onClick={async () => {
                try {
                  await resetTeacherPassword(resetTeacher?._id || resetTeacher?.id, newPassword);
                  setResetOpen(false);
                  await refresh();
                } catch {
                  alert("Reset password failed.");
                }
              }}
              disabled={!newPassword}
            >
              Reset
            </button>
          </div>
        }
      >
        <div className="text-sm text-slate-700">
          Set a new temporary password for{" "}
          <span className="font-semibold text-slate-900">{resetTeacher?.user?.name || "teacher"}</span>.
        </div>
        <input
          type="password"
          className="mt-3 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          placeholder="New temporary password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Modal>

      <Modal
        open={editOpen}
        title={editing ? "Edit Teacher" : "Add Teacher"}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              disabled={!userId}
              onClick={async () => {
                try {
                  if (editing) {
                    await updateTeacher(editing._id || editing.id, { staffId, subject });
                  } else {
                    await createTeacher({ user: userId, staffId, subject });
                  }
                  await refresh();
                  setEditOpen(false);
                } catch {
                  alert(
                    "Save failed. Note: creating a teacher requires an existing User with role=teacher (created by Admin)."
                  );
                }
              }}
            >
              Save
            </button>
          </div>
        }
      >
        {!editing && (
          <div className="mb-3 rounded-2xl bg-white/60 p-3 text-sm text-slate-700">
            Enter the <span className="font-semibold">User ID</span> of a user whose role is
            <span className="font-semibold"> teacher</span>. Headteacher can create Teacher records,
            but cannot create Users.
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-slate-800">User ID</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Mongo ObjectId"
              disabled={Boolean(editing)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Staff ID</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g., TCH-001"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Subject</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Math"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

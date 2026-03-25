import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import { useAuth } from "../../context/AuthContext";
import { createClassV1, assignTeacherToClass, listHeadteacherClasses, getHeadteacherClassById, createHeadteacherClass, updateHeadteacherClass, deleteHeadteacherClass } from "../../services/classService";
import { listTeachers, listAllTeachers } from "../../services/teacherService";

export default function ClassesList() {
  const { role } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [assignTeacherOpen, setAssignTeacherOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(40);
  const [teacherId, setTeacherId] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [teacherUniqueId, setTeacherUniqueId] = useState("");
  const [teacherStaffId, setTeacherStaffId] = useState("");
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (!ignore) setLoading(true);
        const data = await listHeadteacherClasses();
        const items = Array.isArray(data) ? data : data.classes || data.items || data.data || [];
        if (!ignore) setRows(items);
      } catch {
        if (!ignore) setRows([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [role]);

  useEffect(() => {
    let ignore = false;
    if (!open) return;
    // Only fetch teachers for headteacher and assistant headteacher roles
    if (role !== "headteacher" && role !== "assistant_headteacher") return;
    
    (async () => {
      try {
        console.log("Fetching teachers for class assignment...");
        
        // Use headteacher specific endpoint for headteacher and assistant headteacher
        const data = role === "headteacher" || role === "assistant_headteacher" 
          ? await listAllTeachers() 
          : await listTeachers();
          
        const items = Array.isArray(data) ? data : data.teachers || data.items || data.data || [];
        console.log("Teachers data:", items);
        
        // Filter for active teachers who can be assigned to classes
        const activeTeachers = items.filter(teacher => 
          teacher.isActive !== false && 
          (teacher.role === "teacher" || teacher.user?.role === "teacher")
        );
        
        console.log("Active teachers for class assignment:", activeTeachers);
        if (!ignore) setTeachers(activeTeachers);
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
        if (!ignore) setTeachers([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [open, role]);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listHeadteacherClasses();
      const items = Array.isArray(data) ? data : data.classes || data.items || data.data || [];
      setRows(items);
    } finally {
      setLoading(false);
    }
  }
  const columns = useMemo(
    () => [
      { key: "name", header: "Class" },
      {
        key: "teacher",
        header: "Class Teacher",
        render: (r) => r.teacher?.user?.name || r.teacher?.name || r.user?.name || "—",
      },
      { key: "students", header: "Capacity", render: (r) => r.capacity ?? r.students ?? "—" },
      ...(role === "headteacher" || role === "assistant_headteacher"
        ? [
            {
              key: "actions",
              header: "Actions",
              render: (r) => (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900/5 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-900/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(r);
                      setName(r.name || "");
                      setCapacity(Number(r.capacity || 40));
                      setTeacherId(r.teacherId || r.teacher?._id || r.teacher?.id || r.user?.id || r.user?._id || "");
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-2xl bg-red-600/10 px-3 text-xs font-semibold text-red-600 hover:bg-red-600/20"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm("Are you sure you want to delete this class?")) {
                        try {
                          await deleteHeadteacherClass(r._id || r.id);
                          await refresh();
                          setSuccessMessage("Class deleted successfully!");
                          setSuccessModalOpen(true);
                        } catch (err) {
                          setErrorMessage(err.response?.data?.message || "Failed to delete class.");
                          setErrorModalOpen(true);
                        }
                      }
                    }}
                  >
                    Delete
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
        title="Classes"
        subtitle="Class lists and assignments."
        right={
          (role === "headteacher" || role === "assistant_headteacher") ? (
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
      <Table
        title="Classes List"
        rows={rows}
        columns={columns}
        loading={loading}
        loadingText="Loading classes..."
      />

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
                const normalizedInput = name.toLowerCase().replace(/\s+/g, "");
                const isDuplicate = rows.some((r) => {
                  const rId = r._id || r.id;
                  const editingId = editing ? (editing._id || editing.id) : null;
                  if (editing && rId === editingId) return false;
                  return r.name && r.name.toLowerCase().replace(/\s+/g, "") === normalizedInput;
                });

                if (isDuplicate) {
                  setErrorMessage("A class with this name already exists.");
                  setErrorModalOpen(true);
                  return;
                }

                try {
                  if (editing) {
                    await updateHeadteacherClass(editing._id || editing.id, { name, capacity, teacherId: teacherId || null });
                  } else {
                    await createHeadteacherClass({ name, capacity, teacherId: teacherId || null });
                  }
                  await refresh();
                  setOpen(false);
                  setSuccessMessage(editing ? "Class updated successfully!" : "Class created successfully!");
                  setSuccessModalOpen(true);
                } catch (error) {
                  const errorMsg = error.response?.data?.message || "Save failed.";
                  setErrorMessage(errorMsg);
                  setErrorModalOpen(true);
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
          {(role === "headteacher" || role === "assistant_headteacher") && (
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
                    {t.user?.name || t.name || "Teacher"} 
                    {t.uniqueId ? `(${t.uniqueId})` : ""}
                    {t.staffId ? `[${t.staffId}]` : ""}
                  </option>
                ))}
              </select>
              {teachers.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  No teachers available. Please add teachers to the system first.
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Teacher Assignment Modal */}
      <Modal
        open={assignTeacherOpen}
        title="Assign Teacher to Class"
        onClose={() => setAssignTeacherOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setAssignTeacherOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              onClick={async () => {
                try {
                  const payload = {
                    uniqueId: teacherUniqueId,
                    staffId: teacherStaffId || undefined,
                    subject: subjects.length > 0 ? subjects : ["General"],
                    classId: selectedClass?._id || selectedClass?.id
                  };
                  
                  await assignTeacherToClass(payload);
                  await refresh();
                  setAssignTeacherOpen(false);
                  setSuccessMessage("Teacher assigned successfully!");
                  setSuccessModalOpen(true);
                } catch (error) {
                  setErrorMessage(error.response?.data?.message || "Assignment failed.");
                  setErrorModalOpen(true);
                }
              }}
              disabled={!teacherUniqueId || !selectedClass}
            >
              Assign Teacher
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-800">Class</label>
            <div className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)] flex items-center">
              {selectedClass?.name || "No class selected"}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Teacher Unique ID (required)</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              value={teacherUniqueId}
              onChange={(e) => setTeacherUniqueId(e.target.value)}
              placeholder="e.g., TCH001"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Teacher Staff ID (optional)</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              value={teacherStaffId}
              onChange={(e) => setTeacherStaffId(e.target.value)}
              placeholder="e.g., STAFF123"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Subjects (comma-separated)</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              value={subjects.join(", ")}
              onChange={(e) => setSubjects(e.target.value.split(",").map(s => s.trim()).filter(s => s))}
              placeholder="e.g., Mathematics, Physics"
            />
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        open={successModalOpen}
        title="Success"
        onClose={() => setSuccessModalOpen(false)}
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
              onClick={() => setSuccessModalOpen(false)}
            >
              OK
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
            <svg className="h-8 w-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Success</h3>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
              {successMessage}
            </p>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        open={errorModalOpen}
        title="Action Failed"
        onClose={() => setErrorModalOpen(false)}
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
              onClick={() => setErrorModalOpen(false)}
            >
              OK
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Error</h3>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
              {errorMessage}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

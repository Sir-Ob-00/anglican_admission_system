import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Modal from "../../components/common/Modal";
import Table from "../../components/common/Table";
import { useAuth } from "../../context/AuthContext";
import { listParents, createParent, updateParent } from "../../services/parentService";
import { listUsers } from "../../services/userService";
import { listStudents } from "../../services/studentService";

export default function ParentsList() {
  const [rows, setRows] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const { role } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { phone: "", address: "" } });

  async function refresh() {
    const [parentsRes, usersRes, studentsRes] = await Promise.all([
      listParents(), 
      listUsers({ role: "parent" }),
      listStudents()
    ]);
    const parentItems = Array.isArray(parentsRes) ? parentsRes : parentsRes.items || [];
    const userItems = Array.isArray(usersRes) ? usersRes : usersRes.items || [];
    const studentItems = Array.isArray(studentsRes) ? studentsRes : studentsRes.items || [];
    
    setProfiles(parentItems);
    setStudents(studentItems);
    
    // Extract unique classes from students
    const uniqueClasses = [...new Set(studentItems.map(s => s.classAssigned?.name || s.admittedClass).filter(Boolean))];
    setClasses(uniqueClasses.sort());
    
    const profileByUser = new Map(parentItems.map((p) => [String(p.user?._id || p.user), p]));
    const merged = userItems.map((u) => ({
      id: u._id || u.id,
      name: u.name || u.username,
      username: u.username,
      email: u.email,
      user: u,
      profile: profileByUser.get(String(u._id || u.id)) || null,
    }));
    setRows(merged);
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (role !== "admin" && role !== "headteacher" && role !== "assistantHeadteacher") {
          if (!ignore) setRows([]);
          return;
        }
        await refresh();
      } catch {
        if (!ignore) setRows([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [role, reset]);

  // Filter parents based on selected class
  const filteredRows = useMemo(() => {
    if (!selectedClass) return rows;
    
    // Get students in the selected class
    const studentsInClass = students.filter(s => 
      (s.classAssigned?.name || s.admittedClass) === selectedClass
    );
    
    // Get parent user IDs from those students
    const parentUserIds = new Set(studentsInClass.map(s => String(s.parentUser?._id || s.parentUser)));
    
    // Filter parents who have wards in this class
    return rows.filter(parent => parentUserIds.has(String(parent.user?._id || parent.id)));
  }, [rows, students, selectedClass]);

  const columns = useMemo(
    () => [
      { key: "name", header: "Parent", render: (r) => r.name || r.user?.name || "—" },
      { key: "username", header: "Username", render: (r) => r.username || r.user?.username || "—" },
      { key: "phone", header: "Phone", render: (r) => r.profile?.phone || "—" },
      { key: "classes", header: "Ward Classes", render: (r) => {
        // Get all students for this parent
        const parentStudents = students.filter(s => 
          String(s.parentUser?._id || s.parentUser) === String(r.user?._id || r.id)
        );
        // Get unique classes
        const parentClasses = [...new Set(parentStudents.map(s => s.classAssigned?.name || s.admittedClass).filter(Boolean))];
        return parentClasses.length > 0 ? parentClasses.join(", ") : "—";
      }},
      { key: "profile", header: "Profile", render: (r) => (r.profile ? "Complete" : "Missing") },
      {
        key: "actions",
        header: "Actions",
        render: (r) =>
          role === "admin" || role === "headteacher" ? (
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-3 text-xs font-semibold text-white hover:brightness-110"
              onClick={() => {
                setEditing(r);
                reset({
                  phone: r.profile?.phone || "",
                  address: r.profile?.address || "",
                });
                setIsOpen(true);
              }}
            >
              {r.profile ? "Edit Info" : "Add Info"}
            </button>
          ) : (
            <span className="text-xs text-slate-500">—</span>
          ),
      },
    ],
    [role, reset]
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Parents" subtitle="Parent directory and profile information." />
      {role !== "admin" && role !== "headteacher" && role !== "assistantHeadteacher" ? (
        <Panel className="p-5">
          <div className="text-sm text-slate-600">Access denied.</div>
        </Panel>
      ) : null}
      
      {/* Class Filter */}
      {classes.length > 0 && (
        <Panel className="p-4">
          <div className="text-sm font-semibold text-slate-900 mb-3">Filter by Class</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`inline-flex h-8 items-center justify-center rounded-2xl px-3 text-xs font-semibold ${
                selectedClass === "" 
                  ? "bg-[color:var(--brand)] text-white" 
                  : "bg-slate-900/5 text-slate-800 hover:bg-slate-900/10"
              }`}
              onClick={() => setSelectedClass("")}
            >
              All Classes
            </button>
            {classes.map((className) => (
              <button
                key={className}
                type="button"
                className={`inline-flex h-8 items-center justify-center rounded-2xl px-3 text-xs font-semibold ${
                  selectedClass === className 
                    ? "bg-[color:var(--brand)] text-white" 
                    : "bg-slate-900/5 text-slate-800 hover:bg-slate-900/10"
                }`}
                onClick={() => setSelectedClass(className)}
              >
                {className}
              </button>
            ))}
          </div>
          {selectedClass && (
            <div className="mt-3 text-sm text-slate-600">
              Showing parents with wards in <strong>{selectedClass}</strong>
            </div>
          )}
        </Panel>
      )}
      
      <Table title="Parents List" rows={filteredRows} columns={columns} />

      <Modal
        open={isOpen}
        title={editing?.profile ? "Edit Parent Info" : "Add Parent Info"}
        onClose={() => setIsOpen(false)}
      >
        <form
          className="grid gap-4"
          onSubmit={handleSubmit(async (values) => {
            if (!editing?.id) return;
            try {
              if (editing.profile?._id) {
                await updateParent(editing.profile._id, {
                  phone: values.phone,
                  address: values.address,
                });
              } else {
                await createParent({
                  user: editing.id,
                  phone: values.phone,
                  address: values.address,
                });
              }
              await refresh();
              setIsOpen(false);
            } catch {
              alert("Save failed. Ensure you have permission.");
            }
          })}
        >
          <div>
            <label className="text-sm font-semibold text-slate-800">Phone</label>
            <input
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...register("phone")}
              placeholder="e.g., +233..."
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800">Address</label>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...register("address")}
              placeholder="Residential address"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

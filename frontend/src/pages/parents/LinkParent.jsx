import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import { linkParentToStudent } from "../../services/parentService";
import { listUsers } from "../../services/userService";
import { listStudents } from "../../services/studentService";
import { listClasses } from "../../services/classService";

const fallbackTabs = ["JHS1A", "JHS1B", "JHS2A", "JHS2B"];

export default function LinkParent() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [activeTab, setActiveTab] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [parentQuery, setParentQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [classRes, studentRes, parentRes] = await Promise.all([
          listClasses(),
          listStudents(),
          listUsers({ role: "parent" }),
        ]);
        const classItems = Array.isArray(classRes) ? classRes : classRes.items || [];
        const studentItems = Array.isArray(studentRes) ? studentRes : studentRes.items || [];
        const parentItems = Array.isArray(parentRes) ? parentRes : parentRes.items || [];
        if (!ignore) {
          setClasses(classItems);
          setStudents(studentItems);
          setParents(parentItems);
          const firstClass = classItems[0]?.name || fallbackTabs[0];
          setActiveTab(firstClass);
        }
      } catch {
        if (!ignore) {
          setClasses([]);
          setStudents([]);
          setParents([]);
          setActiveTab(fallbackTabs[0]);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const tabs = useMemo(() => {
    const names = classes.map((c) => c.name).filter(Boolean);
    return names.length ? names : fallbackTabs;
  }, [classes]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    return students.filter((s) => {
      const className = s.classAssigned?.name || "";
      if (activeTab && className !== activeTab) return false;
      if (activeTab && !className) return false;
      if (!q) return true;
      const fullName = String(s.fullName || "").toLowerCase();
      return fullName.includes(q);
    });
  }, [students, activeTab, studentQuery]);

  const filteredParents = useMemo(() => {
    const q = parentQuery.trim().toLowerCase();
    if (!q) return parents;
    return parents.filter((p) => {
      const name = String(p.name || "").toLowerCase();
      const username = String(p.username || "").toLowerCase();
      const email = String(p.email || "").toLowerCase();
      return name.includes(q) || username.includes(q) || email.includes(q);
    });
  }, [parents, parentQuery]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Link Parents"
        subtitle="Link an existing parent user to an admitted student."
      />

      <Panel className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              className={`inline-flex h-9 items-center justify-center rounded-2xl px-4 text-xs font-semibold ${
                activeTab === t ? "bg-[color:var(--brand)] text-white" : "bg-slate-900/5 text-slate-800 hover:bg-slate-900/10"
              }`}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Select student</div>
            <input
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-[color:var(--brand)]"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder="Search students in class"
            />
            <div className="mt-3 max-h-[260px] space-y-2 overflow-auto pr-1">
              {filteredStudents.length ? (
                filteredStudents.map((s) => {
                  const id = s._id || s.id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm ${
                        String(selectedStudentId) === String(id)
                          ? "border-blue-300 bg-blue-50 text-blue-900"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                      onClick={() => setSelectedStudentId(id)}
                    >
                      <span className="font-semibold">{s.fullName || "Student"}</span>
                      <span className="text-xs text-slate-500">{s.classAssigned?.name || activeTab}</span>
                    </button>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500">No students found for this class.</div>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-900">Select parent</div>
            <input
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-[color:var(--brand)]"
              value={parentQuery}
              onChange={(e) => setParentQuery(e.target.value)}
              placeholder="Search parent by name, username, or email"
            />
            <div className="mt-3 max-h-[260px] space-y-2 overflow-auto pr-1">
              {filteredParents.length ? (
                filteredParents.map((p) => {
                  const id = p._id || p.id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm ${
                        String(selectedParentId) === String(id)
                          ? "border-blue-300 bg-blue-50 text-blue-900"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                      onClick={() => setSelectedParentId(id)}
                    >
                      <span className="font-semibold">{p.name || p.username || "Parent"}</span>
                      <span className="text-xs text-slate-500">{p.username || p.email || ""}</span>
                    </button>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500">No parents found.</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={!selectedParentId || !selectedStudentId || busy}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-6 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
            onClick={async () => {
              if (!selectedParentId || !selectedStudentId) return;
              try {
                setBusy(true);
                await linkParentToStudent({ parentUserId: selectedParentId, studentId: selectedStudentId });
                alert("Linked successfully.");
              } catch {
                alert("Link failed. Ensure you are logged in as Headteacher and IDs are correct.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Linking..." : "Link Parent"}
          </button>
        </div>
      </Panel>
    </div>
  );
}

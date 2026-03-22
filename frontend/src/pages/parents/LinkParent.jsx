import { useEffect, useMemo, useState, useRef } from "react";
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
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedParentName, setSelectedParentName] = useState("");
  const studentDropdownRef = useRef(null);
  const parentDropdownRef = useRef(null);

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

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudentId(student._id || student.id);
    setSelectedStudentName(student.fullName);
    setShowStudentDropdown(false);
    setStudentQuery(student.fullName);
  };

  // Handle parent selection
  const handleParentSelect = (parent) => {
    setSelectedParentId(parent._id || parent.id);
    setSelectedParentName(parent.name || parent.username);
    setShowParentDropdown(false);
    setParentQuery(parent.name || parent.username);
  };

  // Clear selections
  const clearStudentSelection = () => {
    setSelectedStudentId("");
    setSelectedStudentName("");
    setStudentQuery("");
    setShowStudentDropdown(false);
  };

  const clearParentSelection = () => {
    setSelectedParentId("");
    setSelectedParentName("");
    setParentQuery("");
    setShowParentDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target)) {
        setShowStudentDropdown(false);
      }
      if (parentDropdownRef.current && !parentDropdownRef.current.contains(event.target)) {
        setShowParentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            <div className="relative">
              <input
                className="mt-2 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-[color:var(--brand)]"
                value={studentQuery}
                onChange={(e) => {
                  setStudentQuery(e.target.value);
                  setShowStudentDropdown(true);
                }}
                onFocus={() => setShowStudentDropdown(true)}
                placeholder="Type student name to search..."
              />
              {selectedStudentName && (
                <button
                  type="button"
                  onClick={clearStudentSelection}
                  className="absolute right-2 top-3 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
              
              {showStudentDropdown && studentQuery && (
                <div ref={studentDropdownRef} className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => {
                      const id = s._id || s.id;
                      return (
                        <button
                          key={id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                          onClick={() => handleStudentSelect(s)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{s.fullName}</span>
                            <span className="text-xs text-slate-500">{s.classAssigned?.name || activeTab}</span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-sm text-slate-500">No students found</div>
                  )}
                </div>
              )}
            </div>
            
            {selectedStudentName && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm text-blue-800">
                Selected: <strong>{selectedStudentName}</strong>
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-900">Select parent</div>
            <div className="relative">
              <input
                className="mt-2 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-[color:var(--brand)]"
                value={parentQuery}
                onChange={(e) => {
                  setParentQuery(e.target.value);
                  setShowParentDropdown(true);
                }}
                onFocus={() => setShowParentDropdown(true)}
                placeholder="Type parent name to search..."
              />
              {selectedParentName && (
                <button
                  type="button"
                  onClick={clearParentSelection}
                  className="absolute right-2 top-3 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
              
              {showParentDropdown && parentQuery && (
                <div ref={parentDropdownRef} className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredParents.length > 0 ? (
                    filteredParents.map((p) => {
                      const id = p._id || p.id;
                      return (
                        <button
                          key={id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                          onClick={() => handleParentSelect(p)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{p.name || p.username}</span>
                            <span className="text-xs text-slate-500">{p.username || p.email || ""}</span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-sm text-slate-500">No parents found</div>
                  )}
                </div>
              )}
            </div>
            
            {selectedParentName && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg text-sm text-green-800">
                Selected: <strong>{selectedParentName}</strong>
              </div>
            )}
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

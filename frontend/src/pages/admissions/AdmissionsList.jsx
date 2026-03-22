import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import { formatDate } from "../../utils/helpers";
import * as admissionService from "../../services/admissionService";
import { listStudents } from "../../services/studentService";
import { useAuth } from "../../context/AuthContext";

export default function AdmissionsList() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [rows, setRows] = useState([]);
  const [studentsByApplicant, setStudentsByApplicant] = useState(new Map());
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [admissionsRes, studentsRes] = await Promise.all([
          admissionService.listAdmissions(),
          listStudents(),
        ]);
        const items = Array.isArray(admissionsRes) ? admissionsRes : admissionsRes.items || [];
        const students = Array.isArray(studentsRes) ? studentsRes : studentsRes.items || [];
        if (!ignore) {
          setRows(items);
          const map = new Map();
          for (const s of students) {
            if (s.applicant) map.set(String(s.applicant), s);
          }
          setStudentsByApplicant(map);
        }
      } catch {
        if (!ignore) {
          setRows([]);
          setStudentsByApplicant(new Map());
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const columns = useMemo(
    () => [
      { key: "applicant", header: "Applicant" },
      { key: "classLevel", header: "Class" },
      {
        key: "status",
        header: "Decision",
        render: (r) => (
          <Badge tone={r.status === "admitted" ? "success" : r.status === "rejected" ? "danger" : "neutral"}>
            {String(r.status).toUpperCase()}
          </Badge>
        ),
      },
      { key: "date", header: "Date", render: (r) => formatDate(r.date) },
      {
        key: "actions",
        header: "Actions",
        render: (r) => {
          const student = studentsByApplicant.get(String(r.applicantId || ""));
          const canEdit = role === 'admin' || role === 'headteacher' || role === 'assistantHeadteacher';
          const canDelete = role === 'admin' || role === 'headteacher';
          
          return (
            <div className="flex gap-2">
              {student && (
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admissions/students/${student._id}`);
                  }}
                >
                  Edit Student
                </button>
              )}
              {student && canDelete && (
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete ${student.fullName}? This action cannot be undone.`)) {
                      try {
                        await admissionService.deleteStudent(student._id);
                        alert('Student deleted successfully!');
                        // Refresh the list
                        const [admissionsRes, studentsRes] = await Promise.all([
                          admissionService.listAdmissions(),
                          listStudents(),
                        ]);
                        const items = Array.isArray(admissionsRes) ? admissionsRes : admissionsRes.items || [];
                        const students = Array.isArray(studentsRes) ? studentsRes : studentsRes.items || [];
                        setRows(items);
                        const map = new Map();
                        for (const s of students) {
                          if (s.applicant) map.set(String(s.applicant), s);
                        }
                        setStudentsByApplicant(map);
                      } catch (error) {
                        alert('Failed to delete student: ' + (error?.response?.data?.message || error.message));
                      }
                    }
                  }}
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-3 text-xs font-semibold text-white hover:brightness-110"
                onClick={(e) => {
                  e.stopPropagation();
                  const student = studentsByApplicant.get(String(r.applicantId || ""));
                  if (student) setSelectedStudent(student);
                }}
              >
                View Details
              </button>
            </div>
          );
        },
      },
    ],
    [studentsByApplicant]
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Admissions" subtitle="Final admission decisions and records." />
      <Table
        title="Admissions List"
        rows={rows.map((x) => ({
          id: x._id || x.id,
          applicant: x.applicant?.fullName || "—",
          classLevel: x.applicant?.classApplyingFor || "—",
          status: "admitted",
          date: x.approvedAt || x.createdAt,
          applicantId: x.applicant?._id,
        }))}
        columns={columns}
        onRowClick={(r) => navigate(`/admissions/${r.id}`)}
      />

      <Modal
        open={Boolean(selectedStudent)}
        title="Student Information"
        onClose={() => setSelectedStudent(null)}
      >
        {selectedStudent ? (
          <div className="space-y-2 text-sm text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">Name:</span>{" "}
              {selectedStudent.fullName || "—"}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Admission No.:</span>{" "}
              {selectedStudent.admissionNumber || "—"}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Class:</span>{" "}
              {selectedStudent.classAssigned?.name || "—"}
            </div>
            <div>
              <span className="font-semibold text-slate-900">Parent:</span>{" "}
              {selectedStudent.parentUser?.name || selectedStudent.parentUser?.username || "—"}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

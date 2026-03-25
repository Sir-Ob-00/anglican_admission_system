import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import { listAssignedTeacherExams } from "../../services/teacherExamService";

export default function TeacherAssignedExams() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listAssignedTeacherExams();
        const exams = Array.isArray(data) ? data : data?.exams || data?.items || data?.data || [];
        if (!ignore) {
          setRows(exams);
        }
      } catch (err) {
        if (!ignore) {
          setRows([]);
          setError(err?.response?.data?.message || "Failed to load assigned exams.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Take Exams"
        subtitle="Exams assigned to your class and available for you to conduct."
        right={
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900/5 px-5 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
            onClick={() => navigate("/exams")}
          >
            Back to Exams
          </button>
        }
      />

      <Panel className="p-5">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-6 text-sm text-slate-600">
            <span
              className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[color:var(--brand)]"
              aria-hidden="true"
            />
            <span>Loading assigned exams...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-rose-700">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-slate-600">No assigned exams are available right now.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((exam) => (
              <div
                key={exam.id || exam._id}
                className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-display text-lg font-semibold text-slate-900">{exam.title}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {exam.subject || "Entrance Exam"} - {exam.duration || 0} min
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {exam.class?.name || "No class"} - {exam.assignedApplicantsCount || 0} assigned -{" "}
                    {exam.completedApplicantsCount || 0} completed
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                  onClick={() => navigate(`/exams/assigned/${exam.id || exam._id}`)}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { formatDate } from "../../utils/helpers";
import * as examService from "../../services/examService";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/common/Modal";
import ExamForm from "../../components/forms/ExamForm";

export default function ExamsList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadExams = async () => {
    const data = await examService.listExams();
    const items = Array.isArray(data) ? data : data.items || [];
    setRows(items);
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await examService.listExams();
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

  const columns = useMemo(
    () => [
      { key: "title", header: "Exam" },
      { key: "classLevel", header: "Class" },
      { key: "scheduledAt", header: "Scheduled", render: (r) => formatDate(r.scheduledAt) },
      { key: "durationMinutes", header: "Duration", render: (r) => `${r.durationMinutes} min` },
      {
        key: "status",
        header: "Status",
        render: (r) => (
          <Badge tone={r.status === "scheduled" ? "warning" : r.status === "completed" ? "success" : "neutral"}>
            {String(r.status).toUpperCase()}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        render: (r) => {
          const examId = r._id || r.id;
          const canPublish = (role === "teacher" || role === "assistantHeadteacher") && r.status !== "active";
          const canEdit = (role === "teacher" || role === "assistantHeadteacher") && (r.status === "draft" || r.status === "scheduled" || r.status === "active");
          return (
            <div className="flex flex-wrap items-center gap-2">
              {(role === "teacher" || role === "assistantHeadteacher") && r.code && r.status === "active" ? (
                <a
                  href={`/entrance-exam/${encodeURIComponent(r.code)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-3 text-xs font-semibold text-white hover:brightness-110"
                  onClick={(e) => e.stopPropagation()}
                >
                  Exam Link
                </a>
              ) : null}
              {canPublish ? (
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await examService.publishEntranceExam(examId);
                      await loadExams();
                    } catch (err) {
                      setNotice({
                        title: "Publish failed",
                        message: err?.response?.data?.message || "Unable to publish this exam.",
                      });
                    }
                  }}
                >
                  Publish
                </button>
              ) : null}
              {canEdit ? (
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/exams/${examId}/edit`);
                  }}
                >
                  Edit
                </button>
              ) : null}
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900/5 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/exams/${examId}/questions`);
              }}
            >
              Questions
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900/5 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/exams/${examId}/results`);
              }}
            >
              Results
            </button>
          </div>
          );
        },
      },
    ],
    [navigate, role]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Entrance Exams"
        subtitle="Schedule, conduct, and review entrance exams."
        right={
          role === "headteacher" || role === "teacher" ? (
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
              onClick={() => setOpen(true)}
            >
              Create Exam
            </button>
          ) : null
        }
      />
      <Table title="Exams List" rows={rows} columns={columns} />

      <Modal open={open} title="Create Exam" onClose={() => setOpen(false)}>
        <ExamForm
          submitLabel="Create"
          onSubmit={async (values) => {
            try {
              await examService.createExam(values);
              await loadExams();
              setOpen(false);
            } catch {
              alert("Create exam failed. Headteacher role required.");
            }
          }}
        />
      </Modal>

      <Modal
        open={Boolean(notice)}
        title={notice?.title || "Notice"}
        onClose={() => setNotice(null)}
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setNotice(null)}
            >
              Close
            </button>
          </div>
        }
      >
        <div className="text-sm text-slate-700">{notice?.message}</div>
      </Modal>
    </div>
  );
}

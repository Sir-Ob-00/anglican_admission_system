import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import {
  deleteHeadteacherExam,
  initiateHeadteacherExamForApplicant,
  listHeadteacherExams,
} from "../../services/examService";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/common/Modal";
import { listAllHeadteacherApplicants } from "../../services/applicantService";

function openSecureExamWindow(url) {
  const features = [
    "popup=yes",
    "noopener=yes",
    "noreferrer=yes",
    "width=1440",
    "height=900",
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");

  const nextWindow = window.open(url, "_blank", features);
  if (nextWindow) nextWindow.focus();
  return Boolean(nextWindow);
}

const TAKE_EXAMS_LOAD_ERROR = "Unable to load exams and applicants right now.";
const TAKE_EXAM_START_ERROR = "Unable to start this exam right now. Please try again.";

function safeExamStartMessage(error) {
  const message = String(error?.response?.data?.message || error?.message || "").trim();
  if (!message) return TAKE_EXAM_START_ERROR;
  if (message.includes("Invalid `prisma") || message.includes("<!DOCTYPE html>")) {
    return TAKE_EXAM_START_ERROR;
  }
  return message;
}

export default function ExamsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const [notice, setNotice] = useState(location.state?.notice || null);
  const [takeExamOpen, setTakeExamOpen] = useState(false);
  const [launchExams, setLaunchExams] = useState([]);
  const [launchApplicants, setLaunchApplicants] = useState([]);
  const [selectedLaunchExamId, setSelectedLaunchExamId] = useState("");
  const [selectedApplicantId, setSelectedApplicantId] = useState("");
  const [takeExamLoading, setTakeExamLoading] = useState(false);
  const [takeExamError, setTakeExamError] = useState("");
  const [startingExam, setStartingExam] = useState(false);
  const [takeExamNotice, setTakeExamNotice] = useState(null);

  const loadExams = async () => {
    setLoading(true);
    try {
      const data = await listHeadteacherExams();
      const items = Array.isArray(data) ? data : data.items || data.exams || data.data || [];
      setRows(items);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listHeadteacherExams();
        const items = Array.isArray(data) ? data : data.items || data.exams || data.data || [];
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
  }, []);

  useEffect(() => {
    if (!takeExamOpen || role !== "teacher") return;
    let ignore = false;

    (async () => {
      setTakeExamLoading(true);
      setTakeExamError("");
      try {
        const [examData, applicantData] = await Promise.all([
          listHeadteacherExams(),
          listAllHeadteacherApplicants(),
        ]);
        const examItems = Array.isArray(examData) ? examData : examData?.exams || examData?.items || examData?.data || [];
        const applicantItems = Array.isArray(applicantData)
          ? applicantData
          : applicantData?.applicants || applicantData?.items || applicantData?.data || [];

        if (!ignore) {
          setLaunchExams(examItems);
          setLaunchApplicants(applicantItems);
        }
      } catch (error) {
        if (!ignore) {
          setLaunchExams([]);
          setLaunchApplicants([]);
          setTakeExamError(TAKE_EXAMS_LOAD_ERROR);
        }
      } finally {
        if (!ignore) setTakeExamLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [takeExamOpen, role]);

  const columns = useMemo(
    () => [
      { key: "title", header: "Title" },
      { key: "subject", header: "Subject", render: (r) => r.subject || "-" },
      { key: "duration", header: "Duration", render: (r) => `${r.duration || r.durationMinutes || 0} min` },
      {
        key: "status",
        header: "Status",
        render: (r) => String(r.status || "draft").replaceAll("_", " ").toUpperCase(),
      },
      { key: "id", header: "Exam ID", render: (r) => r.code || r.examCode || r._id || r.id || "-" },
      { key: "classLevel", header: "Class", render: (r) => r.classLevel || r.class?.name || "-" },
      {
        key: "actions",
        header: "Actions",
        render: (r) => {
          const examId = r._id || r.id;
          const canDelete = role === "teacher" || role === "assistantHeadteacher" || role === "headteacher";
          const normalizedStatus = String(r.status || "draft").toLowerCase();
          const deleteBlocked = !["draft", "saved", "unpublished"].includes(normalizedStatus);

          return (
            <div className="flex min-w-0 items-center gap-2 overflow-hidden md:min-w-[220px]">
              <button
                type="button"
                className="inline-flex h-9 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-slate-900/5 px-3 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-900/10"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/exams/${examId}/questions`);
                }}
              >
                <span className="truncate">Questions</span>
              </button>
              <button
                type="button"
                className="inline-flex h-9 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/exams/${examId}/edit`);
                }}
              >
                <span className="truncate">Edit</span>
              </button>
              {canDelete ? (
                <button
                  type="button"
                  disabled={deleteBlocked}
                  title={
                    deleteBlocked
                      ? "Published or assigned exams cannot be deleted because they are already linked to other records."
                      : "Delete this exam"
                  }
                  className={`inline-flex h-9 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-2xl px-3 text-xs font-semibold shadow-sm ${
                    deleteBlocked
                      ? "cursor-not-allowed bg-rose-300 text-white"
                      : "bg-rose-600 text-white hover:bg-rose-700"
                  }`}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (deleteBlocked) {
                      setNotice({
                        title: "Delete unavailable",
                        message: "This exam can no longer be deleted because it is already published or linked to other records.",
                      });
                      return;
                    }
                    if (window.confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
                      try {
                        await deleteHeadteacherExam(examId);
                        await loadExams();
                      } catch (err) {
                        const backendMessage = err?.response?.data?.message || "";
                        const constraintError = String(backendMessage).includes("Foreign key constraint");
                        setNotice({
                          title: "Delete failed",
                          message: constraintError
                            ? "This exam cannot be deleted because it is already linked to assignments or submitted records."
                            : backendMessage || "Unable to delete this exam.",
                        });
                      }
                    }
                  }}
                >
                  <span className="truncate">Delete</span>
                </button>
              ) : null}
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
          <div className="flex flex-wrap items-center gap-2">
            {role === "teacher" ? (
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                onClick={() => {
                  setTakeExamError("");
                  setSelectedLaunchExamId("");
                  setSelectedApplicantId("");
                  setLaunchExams([]);
                  setLaunchApplicants([]);
                  setTakeExamOpen(true);
                }}
              >
                Take Exams
              </button>
            ) : null}
            {role === "headteacher" || role === "teacher" ? (
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                onClick={() => navigate("/exams/new")}
              >
                Create Exam
              </button>
            ) : null}
          </div>
        }
      />
      <Table
        title="Exams List"
        rows={rows}
        columns={columns}
        loading={loading}
        loadingText="Loading exams..."
      />

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

      <Modal
        open={takeExamOpen}
        title="Take Exam"
        onClose={() => setTakeExamOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setTakeExamOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedLaunchExamId || !selectedApplicantId || startingExam}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              onClick={async () => {
                const selectedApplicant = launchApplicants.find(
                  (applicant) => String(applicant.id || applicant._id) === String(selectedApplicantId)
                );
                if (!selectedApplicant) return;

                setStartingExam(true);
                setTakeExamError("");
                try {
                  await initiateHeadteacherExamForApplicant({
                    examId: selectedLaunchExamId,
                    applicantId: selectedApplicantId,
                  });

                  const params = new URLSearchParams({
                    applicantId: selectedApplicantId,
                    fullName: selectedApplicant.fullName || selectedApplicant.full_name || "",
                    kiosk: "1",
                    source: "headteacher-initiate",
                  });

                  const opened = openSecureExamWindow(`/exams/${selectedLaunchExamId}/take?${params.toString()}`);
                  if (!opened) {
                    throw new Error("Popup blocked. Please allow popups for this site and try again.");
                  }

                  setTakeExamOpen(false);
                } catch (error) {
                  setTakeExamNotice({
                    title: "Unable to Start Exam",
                    message: safeExamStartMessage(error),
                  });
                } finally {
                  setStartingExam(false);
                }
              }}
            >
              {startingExam ? "Starting..." : "Start Exam"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-700">
            Select an assigned exam and the applicant you want to conduct the exam for.
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Available Exams</label>
            <select
              value={selectedLaunchExamId}
              onChange={(e) => setSelectedLaunchExamId(e.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-[color:var(--brand)]"
              disabled={takeExamLoading || startingExam}
            >
              <option value="">Select exam...</option>
              {launchExams.map((exam) => {
                const examId = exam.id || exam._id;
                return (
                  <option key={examId} value={examId}>
                    {exam.title} ({exam.class?.name || exam.classLevel || "No class"})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Applicants</label>
            <select
              value={selectedApplicantId}
              onChange={(e) => setSelectedApplicantId(e.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-[color:var(--brand)]"
              disabled={takeExamLoading || startingExam}
            >
              <option value="">Select applicant...</option>
              {launchApplicants.map((applicant) => {
                const applicantId = applicant.id || applicant._id;
                const fullName = applicant.fullName || applicant.full_name || "Applicant";
                const applicationId =
                  applicant.applicationId || applicant.application_id || applicant.applicantId || applicantId;
                return (
                  <option key={applicantId} value={applicantId}>
                    {fullName} ({applicationId})
                  </option>
                );
              })}
            </select>
          </div>

          {takeExamLoading ? (
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span
                className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[color:var(--brand)]"
                aria-hidden="true"
              />
              <span>Loading exam launch options...</span>
            </div>
          ) : null}

          {takeExamError ? <div className="text-sm text-rose-700">{takeExamError}</div> : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(takeExamNotice)}
        title={takeExamNotice?.title || "Notice"}
        onClose={() => setTakeExamNotice(null)}
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setTakeExamNotice(null)}
            >
              Close
            </button>
          </div>
        }
      >
        <div className="text-sm text-slate-700">{takeExamNotice?.message}</div>
      </Modal>
    </div>
  );
}

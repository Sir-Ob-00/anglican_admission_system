import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Modal from "../../components/common/Modal";
import {
  getAssignedTeacherExam,
  resetTeacherExamSession,
  startAssignedTeacherExamSession,
} from "../../services/teacherExamService";

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

  const newWindow = window.open(url, "_blank", features);
  if (newWindow) newWindow.focus();
  return Boolean(newWindow);
}

export default function TeacherAssignedExamDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [notice, setNotice] = useState("");
  const [starting, setStarting] = useState(false);
  const [resettingSessionId, setResettingSessionId] = useState("");

  useEffect(() => {
    let ignore = false;

    (async () => {
      setLoading(true);
      setNotice("");
      try {
        const data = await getAssignedTeacherExam(id);
        if (!ignore) {
          setExam(data?.exam || null);
          setApplicants(Array.isArray(data?.applicants) ? data.applicants : []);
        }
      } catch (err) {
        if (!ignore) {
          setExam(null);
          setApplicants([]);
          setNotice(err?.response?.data?.message || "Failed to load assigned exam details.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [id]);

  const launchExam = async () => {
    if (!selectedApplicant) return;

    setStarting(true);
    setNotice("");
    try {
      const data = await startAssignedTeacherExamSession(id, {
        applicantId: selectedApplicant.id || selectedApplicant._id,
      });

      const session = data?.session;
      if (!session?.id) {
        throw new Error("Session ID was not returned by the server.");
      }

      const params = new URLSearchParams({
        applicantId: session.applicantId || selectedApplicant.id || selectedApplicant._id,
        fullName: session.fullName || selectedApplicant.fullName || selectedApplicant.full_name || "",
        kiosk: "1",
        source: "teacher-assigned",
      });

      const opened = openSecureExamWindow(`/exams/session/${session.id}/take?${params.toString()}`);
      if (!opened) {
        setNotice("Popup blocked. Please allow popups for this site and try again.");
      }
      setSelectedApplicant(null);
    } catch (err) {
      setNotice(err?.response?.data?.message || err.message || "Failed to start exam session.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={exam?.title || "Assigned Exam"}
        subtitle="Assigned applicants for this exam."
        right={
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900/5 px-5 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
            onClick={() => navigate("/exams/assigned")}
          >
            Back to Take Exams
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
            <span>Loading assigned applicants...</span>
          </div>
        ) : applicants.length === 0 ? (
          <div className="text-sm text-slate-600">No assigned applicants were returned for this exam.</div>
        ) : (
          <div className="space-y-3">
            {applicants.map((applicant) => {
              const applicantId = applicant.id || applicant._id;
              const applicationId =
                applicant.applicationId || applicant.application_id || applicant.applicantId || applicantId || "-";
              const status = String(applicant.status || "").toLowerCase();
              const completed = status === "completed";
              const sessionId =
                applicant.sessionId ||
                applicant.session?.id ||
                applicant.examSession?.id ||
                applicant.exam_session?.id ||
                "";

              return (
                <div
                  key={applicantId}
                  className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {applicant.fullName || applicant.full_name || "Applicant"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">Application ID: {applicationId}</div>
                    <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                      Status: {status || "assigned"}
                    </div>
                  </div>
                  {completed ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-100 px-5 text-sm font-semibold text-emerald-800">
                        Completed
                      </span>
                      {sessionId ? (
                        <button
                          type="button"
                          className="inline-flex h-11 items-center justify-center rounded-2xl bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60"
                          disabled={resettingSessionId === sessionId}
                          onClick={async () => {
                            setResettingSessionId(sessionId);
                            setNotice("");
                            try {
                              await resetTeacherExamSession(sessionId, {
                                reason: "Teacher reopened candidate exam session",
                              });
                              const refreshed = await getAssignedTeacherExam(id);
                              setExam(refreshed?.exam || null);
                              setApplicants(Array.isArray(refreshed?.applicants) ? refreshed.applicants : []);
                            } catch (err) {
                              setNotice(err?.response?.data?.message || "Failed to reset exam session.");
                            } finally {
                              setResettingSessionId("");
                            }
                          }}
                        >
                          {resettingSessionId === sessionId ? "Resetting..." : "Reset Session"}
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                        onClick={() => setSelectedApplicant(applicant)}
                      >
                        Start Exam
                      </button>
                      {sessionId ? (
                        <button
                          type="button"
                          className="inline-flex h-11 items-center justify-center rounded-2xl bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60"
                          disabled={resettingSessionId === sessionId}
                          onClick={async () => {
                            setResettingSessionId(sessionId);
                            setNotice("");
                            try {
                              await resetTeacherExamSession(sessionId, {
                                reason: "Teacher reset candidate exam session",
                              });
                              const refreshed = await getAssignedTeacherExam(id);
                              setExam(refreshed?.exam || null);
                              setApplicants(Array.isArray(refreshed?.applicants) ? refreshed.applicants : []);
                            } catch (err) {
                              setNotice(err?.response?.data?.message || "Failed to reset exam session.");
                            } finally {
                              setResettingSessionId("");
                            }
                          }}
                        >
                          {resettingSessionId === sessionId ? "Resetting..." : "Reset Session"}
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {notice ? (
        <Panel className="p-4">
          <div className="text-sm text-rose-700">{notice}</div>
        </Panel>
      ) : null}

      <Modal
        open={Boolean(selectedApplicant)}
        title="Confirm Candidate"
        onClose={() => setSelectedApplicant(null)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setSelectedApplicant(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              onClick={launchExam}
              disabled={starting}
            >
              {starting ? "Starting..." : "Start Exam"}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          <div>
            Name:{" "}
            <span className="font-semibold text-slate-900">
              {selectedApplicant?.fullName || selectedApplicant?.full_name}
            </span>
          </div>
          <div>
            Application ID:{" "}
            <span className="font-semibold text-slate-900">
              {selectedApplicant?.applicationId || selectedApplicant?.application_id || selectedApplicant?.id || selectedApplicant?._id}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

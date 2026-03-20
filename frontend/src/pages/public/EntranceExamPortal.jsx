import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PublicNavbar from "../../components/layout/PublicNavbar";
import Badge from "../../components/common/Badge";
import Panel from "../../components/common/Panel";
import Modal from "../../components/common/Modal";
import {
  getPublicEntranceExam,
  heartbeatPublicEntranceExamSession,
  startPublicEntranceExamSession,
  submitPublicEntranceExam,
} from "../../services/publicExamService";

function secondsToClock(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function getDurationMinutes(questionCount) {
  if (questionCount >= 20) return 25;
  if (questionCount >= 15) return 20;
  return 15;
}

export default function EntranceExamPortal() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicantId = searchParams.get("applicantId") || "";
  const secureMode = searchParams.get("secure") === "1";
  const popupMode = searchParams.get("popup") === "1" || Boolean(window.opener);
  const presetName = searchParams.get("fullName") || "";

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [fullName, setFullName] = useState(presetName);
  const [startOpen, setStartOpen] = useState(true);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [securityBlocked, setSecurityBlocked] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");
  const submitOnce = useRef(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const ex = await getPublicEntranceExam(code);
        if (!ignore) {
          setExam(ex);
          setQuestions([]);
          setSecondsLeft(15 * 60);
          setSessionToken("");
          setSecurityBlocked(false);
          setSecurityMessage("");
        }
      } catch {
        if (!ignore) {
          setExam(null);
          setQuestions([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [code]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (submitOnce.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    if (startOpen || !questions.length || securityBlocked) return;
    const t = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [questions.length, securityBlocked, startOpen]);

  useEffect(() => {
    if (startOpen || securityBlocked || secondsLeft !== 0) return;
    void handleSubmit("Time elapsed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, securityBlocked, startOpen]);

  useEffect(() => {
    if (startOpen || !sessionToken || securityBlocked || submitOnce.current) return;

    let stopped = false;
    const tick = async () => {
      try {
        await heartbeatPublicEntranceExamSession({ sessionToken });
      } catch (e) {
        if (stopped) return;
        const code = e?.response?.data?.code;
        if (code === "IP_CHANGED" || code === "SESSION_BLOCKED") {
          const message =
            e?.response?.data?.message || "Security monitoring blocked this entrance exam session.";
          setSecurityBlocked(true);
          setSecurityMessage(message);
        }
      }
    };

    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, 15000);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [securityBlocked, sessionToken, startOpen]);

  useEffect(() => {
    if (!popupMode) return;
    try {
      window.moveTo?.(0, 0);
      window.resizeTo?.(window.screen.availWidth, window.screen.availHeight);
    } catch {
      // Ignore browser restrictions on popup positioning.
    }
  }, [popupMode]);

  async function requestSecureMode() {
    if (!secureMode) return;
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // Fullscreen is best effort and may be blocked by browser policy.
    }
  }

  async function handleStart() {
    if (!fullName.trim()) {
      alert("Enter the applicant name to start the exam.");
      return;
    }

    setStarting(true);
    try {
      await requestSecureMode();
      const started = await startPublicEntranceExamSession({
        examCode: code,
        fullName: fullName.trim(),
        applicantId: applicantId || undefined,
      });
      const items = Array.isArray(started) ? started : started.items || [];
      setQuestions(items);
      setSessionToken(started.sessionToken || "");
      setIndex(0);
      setAnswers({});
      setSecondsLeft(getDurationMinutes(items.length) * 60);
      setSecurityBlocked(false);
      setSecurityMessage("");
      setStartOpen(false);
    } catch (e) {
      alert(e?.response?.data?.message || "Unable to load this entrance exam.");
    } finally {
      setStarting(false);
    }
  }

  function closeExamWindow() {
    if (!popupMode) return;
    window.opener?.focus?.();
    window.close();
  }

  async function handleSubmit(reason) {
    if (submitOnce.current) return;
    submitOnce.current = true;
    setSubmitting(true);
    try {
      await submitPublicEntranceExam({
        examCode: code,
        reason,
        fullName: fullName || "",
        applicantId: applicantId || undefined,
        sessionToken,
        answers,
      });
      if (popupMode) {
        closeExamWindow();
      } else {
        navigate(`/entrance-exam/${code}/submitted`, { replace: true });
      }
    } catch (e) {
      submitOnce.current = false;
      const code = e?.response?.data?.code;
      if (code === "IP_CHANGED" || code === "SESSION_BLOCKED") {
        setSecurityBlocked(true);
        setSecurityMessage(e?.response?.data?.message || "Security monitoring blocked this entrance exam session.");
      } else {
        alert(e?.response?.data?.message || "Submission failed. Check Exam ID and Full Name.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const q = questions[index] || questions[0];

  return (
    <div className={secureMode ? "min-h-screen bg-slate-950 text-white" : "min-h-full bg-white"}>
      {!secureMode ? <PublicNavbar /> : null}

      <main className={secureMode ? "w-full px-4 py-5 md:px-6" : "mx-auto w-full max-w-[1100px] px-4 py-8 md:px-8"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wide ${secureMode ? "text-slate-300" : "text-slate-600"}`}>
              Entrance Exam Portal
            </div>
            <div className={`mt-1 text-2xl font-extrabold ${secureMode ? "text-white" : "text-slate-900"}`}>
              {exam?.title || (loading ? "Loading..." : "Entrance Exam")}
            </div>
            <div className={`mt-1 text-sm ${secureMode ? "text-slate-300" : "text-slate-600"}`}>
              Exam ID: <span className="font-semibold">{code}</span>
              {exam?.classLevel ? ` - Class: ${exam.classLevel}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge tone={secondsLeft < 60 ? "danger" : "warning"}>{`TIME ${secondsToClock(secondsLeft)}`}</Badge>
            {secureMode ? (
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                disabled={submitting || startOpen}
                onClick={() => {
                  if (window.confirm("Close and forfeit this exam?")) {
                    void handleSubmit("Forfeited by supervisor");
                  }
                }}
              >
                Close Exam
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <Panel className="mt-6 p-6 text-slate-700">Loading entrance exam...</Panel>
        ) : !exam ? (
          <Panel className="mt-6 p-6 text-slate-700">Entrance exam not found for Exam ID {code}.</Panel>
        ) : questions.length === 0 ? (
          <Panel className={`mt-6 p-6 ${secureMode ? "border-slate-700/60 bg-slate-900/80 text-slate-100" : "text-slate-700"}`}>
            {startOpen ? "Click Start Exam to load the questions for this applicant." : "No questions are published for this entrance exam."}
          </Panel>
        ) : securityBlocked ? (
          <Panel className={secureMode ? "mt-6 border-rose-500/40 bg-rose-950/60 p-6 text-rose-50" : "mt-6 border border-rose-200 bg-rose-50 p-6 text-rose-900"}>
            <div className="text-lg font-semibold">Exam session locked</div>
            <div className="mt-2 text-sm">
              {securityMessage || "This entrance exam session was blocked by IP monitoring."}
            </div>
            <div className="mt-4 text-sm">
              The exam cannot continue from this window. Contact the supervisor to restart the session.
            </div>
          </Panel>
        ) : (
          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            <Panel className={secureMode ? "border-slate-700/60 bg-slate-900/80 p-5 lg:col-span-2" : "p-5 lg:col-span-2"}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`text-xs font-semibold uppercase tracking-wide ${secureMode ? "text-slate-300" : "text-slate-600"}`}>
                    Question {index + 1} of {questions.length}
                  </div>
                  <div className={`mt-2 text-xl font-semibold ${secureMode ? "text-white" : "text-slate-900"}`}>{q.text}</div>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                  disabled={submitting || startOpen}
                  onClick={() => handleSubmit("Manual submit")}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {(q.options || []).map((opt, optIdx) => {
                  const qid = q._id || q.id;
                  const picked = answers[qid] === optIdx;
                  return (
                    <button
                      key={`${qid}:${opt}`}
                      type="button"
                      className={
                        picked
                          ? `rounded-3xl border border-[color:var(--brand)]/40 bg-[color:var(--brand)]/10 px-4 py-4 text-left text-sm font-semibold ${
                              secureMode ? "text-white" : "text-slate-900"
                            }`
                          : secureMode
                            ? "rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-4 text-left text-sm text-slate-100 hover:bg-slate-900"
                            : "rounded-3xl border border-slate-200/70 bg-white/70 px-4 py-4 text-left text-sm text-slate-800 hover:bg-white/80"
                      }
                      onClick={() => setAnswers((a) => ({ ...a, [qid]: optIdx }))}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel className={secureMode ? "border-slate-700/60 bg-slate-900/80 p-5" : "p-5"}>
              <div className={`font-semibold ${secureMode ? "text-white" : "text-slate-900"}`}>Navigate</div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {questions.map((qq, i) => {
                  const qid = qq._id || qq.id;
                  const answered = answers[qid] != null;
                  return (
                    <button
                      key={qid}
                      type="button"
                      className={
                        i === index
                          ? "h-10 rounded-2xl bg-[color:var(--brand)] text-sm font-semibold text-white"
                          : answered
                            ? "h-10 rounded-2xl bg-emerald-600/15 text-sm font-semibold text-emerald-800"
                            : secureMode
                              ? "h-10 rounded-2xl bg-slate-800 text-sm font-semibold text-slate-100 hover:bg-slate-700"
                              : "h-10 rounded-2xl bg-slate-900/5 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
                      }
                      onClick={() => setIndex(i)}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10 disabled:opacity-50"
                  disabled={index <= 0}
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10 disabled:opacity-50"
                  disabled={index >= questions.length - 1}
                  onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
                >
                  Next
                </button>
              </div>

              <div className={`mt-4 rounded-2xl p-3 text-sm ${secureMode ? "bg-slate-950/70 text-slate-200" : "bg-white/60 text-slate-700"}`}>
                Do not refresh the page. Your entrance exam auto-submits at 00:00.
              </div>
            </Panel>
          </div>
        )}
      </main>

      <Modal
        open={startOpen && !loading && Boolean(exam)}
        title="Start Entrance Exam"
        onClose={() => {}}
        closeOnBackdrop={false}
        closeOnEscape={false}
        footer={
          <div className="flex justify-end gap-2">
            {popupMode ? (
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
                onClick={closeExamWindow}
              >
                Cancel
              </button>
            ) : null}
            <button
              type="button"
              disabled={starting || !fullName.trim()}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              onClick={handleStart}
            >
              {starting ? "Starting..." : "Start Exam"}
            </button>
          </div>
        }
      >
        <div className="text-sm text-slate-700">
          The applicant should enter the exact name used during registration before the questions are loaded.
        </div>
        <label className="mt-4 block text-sm font-semibold text-slate-800">Applicant Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          placeholder="Enter applicant full name"
        />
        <div className="mt-2 text-xs text-slate-600">
          Timer is set automatically from the question count: 10 questions = 15 minutes, 15 questions = 20 minutes, 20 questions = 25 minutes.
        </div>
      </Modal>
    </div>
  );
}

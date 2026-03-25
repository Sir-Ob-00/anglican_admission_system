import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Badge from "../../components/common/Badge";
import { getHeadteacherExam, submitHeadteacherExam } from "../../services/examService";
import {
  getTeacherExamSession,
  heartbeatTeacherExamSession,
  submitTeacherExamSession,
} from "../../services/teacherExamService";

function secondsToClock(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function extractExamRecord(result) {
  return result?.exam || result?.data?.exam || result?.data || result?.item || result;
}

function extractMarkRecord(result) {
  return result?.mark || result?.data?.mark || result?.data || result?.item || result;
}

export default function TakeExam() {
  const { id, sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const kioskMode = searchParams.get("kiosk") === "1";
  const presetApplicantId = searchParams.get("applicantId") || "";
  const presetFullName = searchParams.get("fullName") || "";
  const activeExamId = id || "";
  const activeSessionId = sessionId || "";
  const storageKey = activeSessionId
    ? `aas_exam_session_submitted_${activeSessionId}`
    : `aas_exam_submitted_${activeExamId}`;
  const alreadySubmitted = localStorage.getItem(storageKey) === "1";

  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [applicantId, setApplicantId] = useState(presetApplicantId);
  const [fullName, setFullName] = useState(presetFullName);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => ({}));
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [securityEvents, setSecurityEvents] = useState([]);
  const [securityMeta, setSecurityMeta] = useState({ fingerprint: "", ipAddress: "" });
  const submitOnce = useRef(false);

  useEffect(() => {
    setApplicantId(presetApplicantId);
    setFullName(presetFullName);
  }, [presetApplicantId, presetFullName]);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setLoadError("");
        setSubmitError("");

        if (activeSessionId) {
          const data = await getTeacherExamSession(activeSessionId);
          const nextSession = data?.session || null;
          const nextExam = data?.exam || null;
          const items = Array.isArray(nextExam?.questions) ? nextExam.questions : [];

          if (ignore) return;

          setSession(nextSession);
          setExam(nextExam);
          setQuestions(items);
          setIndex(0);
          if (nextSession?.applicantId) setApplicantId(nextSession.applicantId);
          if (nextSession?.fullName) setFullName(nextSession.fullName);
          setSecondsLeft(Number(nextExam?.duration || 15) * 60);
          if (!items.length) setLoadError("No questions found for this exam session.");
          return;
        }

        const rawExam = await getHeadteacherExam(activeExamId);
        const ex = extractExamRecord(rawExam);
        const items = Array.isArray(ex?.questions) ? ex.questions : [];

        if (ignore) return;

        setSession(null);
        setExam(ex || null);
        setQuestions(items);
        setIndex(0);
        setSecondsLeft(Number(ex?.duration || ex?.durationMinutes || 15) * 60);
        if (!items.length) setLoadError("No questions found for this exam.");
      } catch (error) {
        if (!ignore) {
          setExam(null);
          setSession(null);
          setQuestions([]);
          setLoadError(error?.response?.data?.message || "Failed to load this exam.");
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [activeExamId, activeSessionId]);

  useEffect(() => {
    if (alreadySubmitted) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [alreadySubmitted]);

  useEffect(() => {
    if (alreadySubmitted || !questions.length) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [alreadySubmitted, questions.length]);

  useEffect(() => {
    if (alreadySubmitted || secondsLeft !== 0) return;
    void handleSubmit("Time elapsed");
  }, [secondsLeft, alreadySubmitted]);

  useEffect(() => {
    if (!kioskMode) return undefined;

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      window.screen.width,
      window.screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency || "na",
    ].join("|");

    setSecurityMeta((prev) => ({ ...prev, fingerprint }));

    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Best effort only.
      }
    };

    void requestFullscreen();

    const logEvent = (message) => {
      setSecurityEvents((prev) => {
        if (prev.includes(message)) return prev;
        return [...prev, message].slice(-5);
      });
    };

    const handleVisibility = () => {
      if (document.hidden) {
        logEvent("Tab switching detected");
      }
    };

    const blockContextMenu = (event) => {
      event.preventDefault();
      logEvent("Right-click was blocked");
    };

    const blockClipboard = (event) => {
      event.preventDefault();
      logEvent(`${event.type} was blocked`);
    };

    const blockKeys = (event) => {
      const key = String(event.key || "").toLowerCase();
      const ctrlOrMeta = event.ctrlKey || event.metaKey;
      if ((ctrlOrMeta && ["c", "v", "x", "p", "s", "u"].includes(key)) || key === "f12") {
        event.preventDefault();
        logEvent("Restricted keyboard shortcut blocked");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("cut", blockClipboard);
    document.addEventListener("paste", blockClipboard);
    window.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
      window.removeEventListener("keydown", blockKeys);
    };
  }, [kioskMode]);

  useEffect(() => {
    if (!kioskMode) return undefined;
    let ignore = false;

    (async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        if (!ignore) {
          setSecurityMeta((prev) => ({ ...prev, ipAddress: data?.ip || "" }));
        }
      } catch {
        if (!ignore) {
          setSecurityMeta((prev) => ({ ...prev, ipAddress: "Unavailable" }));
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [kioskMode]);

  useEffect(() => {
    if (!activeSessionId || !kioskMode || alreadySubmitted) return undefined;

    const sendHeartbeat = async () => {
      try {
        await heartbeatTeacherExamSession(activeSessionId, {
          visibilityState: document.visibilityState,
          fullscreen: Boolean(document.fullscreenElement),
          ipAddress: securityMeta.ipAddress,
          fingerprint: securityMeta.fingerprint,
          events: securityEvents,
        });
      } catch {
        // Keep exam flow uninterrupted if heartbeat fails.
      }
    };

    const interval = window.setInterval(() => {
      void sendHeartbeat();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [activeSessionId, kioskMode, alreadySubmitted, securityEvents, securityMeta]);

  async function handleSubmit(reason) {
    if (submitOnce.current || !questions.length) return;
    submitOnce.current = true;
    setSubmitting(true);
    setSubmitError("");

    try {
      let response;

      if (activeSessionId) {
        response = await submitTeacherExamSession(activeSessionId, {
          examId: exam?.id || session?.examId || activeExamId,
          applicantId: applicantId || session?.applicantId,
          answers,
          securityMeta: {
            ipAddress: securityMeta.ipAddress,
            fingerprint: securityMeta.fingerprint,
            events: securityEvents,
          },
        });
      } else {
        response = await submitHeadteacherExam(activeExamId, {
          examId: activeExamId,
          reason,
          applicantId: applicantId || undefined,
          answers,
        });
      }

      const mark = extractMarkRecord(response);
      localStorage.setItem(storageKey, "1");

      const nextSearchParams = new URLSearchParams();
      if (applicantId) nextSearchParams.set("applicantId", applicantId);
      if (fullName) nextSearchParams.set("fullName", fullName);

      navigate(`/exams/${exam?.id || session?.examId || activeExamId}/score?${nextSearchParams.toString()}`, {
        replace: true,
        state: { result: mark, securityMeta, securityEvents },
      });
    } catch (e) {
      submitOnce.current = false;
      setSubmitError(e?.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const q = questions[index] || questions[0];

  return (
    <div className="space-y-4">
      <PageHeader
        title={exam?.title ? `Take Exam: ${exam.title}` : "Take Exam"}
        subtitle="Timer, question navigation, and auto-submit at time end."
        right={
          <Badge tone={alreadySubmitted ? "success" : secondsLeft < 60 ? "danger" : "warning"}>
            {alreadySubmitted ? "SUBMITTED" : `TIME ${secondsToClock(secondsLeft)}`}
          </Badge>
        }
      />

      {alreadySubmitted ? (
        <Panel className="p-6">
          <div className="font-display text-xl font-semibold text-slate-900">Already submitted</div>
          <div className="mt-2 text-sm text-slate-600">Multiple submissions are blocked for this exam attempt.</div>
        </Panel>
      ) : loadError ? (
        <Panel className="p-6">
          <div className="font-display text-xl font-semibold text-slate-900">Exam not ready</div>
          <div className="mt-2 text-sm text-slate-600">{loadError}</div>
          <button
            type="button"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900/5 px-5 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
            onClick={() => navigate("/exams")}
          >
            Back to exams
          </button>
        </Panel>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          <Panel className="p-5 lg:col-span-2">
            {kioskMode ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Secure exam mode is active. Fullscreen, tab-switch detection, right-click blocking, and clipboard restrictions are enabled.
              </div>
            ) : null}

            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-800">Applicant ID (optional)</label>
                <input
                  value={applicantId}
                  onChange={(e) => setApplicantId(e.target.value)}
                  readOnly={kioskMode && Boolean(presetApplicantId)}
                  className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
                  placeholder="Applicant ID"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-800">Full Name (optional)</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  readOnly={kioskMode && Boolean(presetFullName)}
                  className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
                  placeholder="Applicant name"
                />
              </div>
            </div>

            {submitError ? (
              <div role="alert" className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {submitError}
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Question {index + 1} of {questions.length}
                </div>
                <div className="mt-2 font-display text-xl font-semibold text-slate-900">
                  {q?.question || q?.text || "--"}
                </div>
              </div>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                disabled={submitting}
                onClick={() => handleSubmit("Manual submit")}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(q?.options || []).map((opt) => {
                const qid = q?._id || q?.id;
                const picked = answers[qid] === opt;
                return (
                  <button
                    key={`${qid}:${opt}`}
                    type="button"
                    className={
                      picked
                        ? "rounded-3xl border border-[color:var(--brand)]/40 bg-[color:var(--brand)]/10 px-4 py-4 text-left text-sm font-semibold text-slate-900"
                        : "rounded-3xl border border-slate-200/70 bg-white/70 px-4 py-4 text-left text-sm text-slate-800 hover:bg-white/80"
                    }
                    onClick={() => setAnswers((a) => ({ ...a, [qid]: opt }))}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="font-semibold text-slate-900">Navigate</div>
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

            <div className="mt-4 rounded-2xl bg-white/60 p-3 text-sm text-slate-700">
              Auto-submits when the timer reaches 00:00.
            </div>

            {kioskMode ? (
              <div className="mt-4 rounded-2xl bg-slate-950 p-3 text-xs text-slate-200">
                <div className="font-semibold text-white">Security Monitor</div>
                <div className="mt-2">Fingerprint: {securityMeta.fingerprint || "Collecting..."}</div>
                <div className="mt-1">IP Address: {securityMeta.ipAddress || "Collecting..."}</div>
                <div className="mt-2 space-y-1">
                  {securityEvents.length === 0 ? (
                    <div>No security events detected.</div>
                  ) : (
                    securityEvents.map((event, eventIndex) => (
                      <div key={`${event}-${eventIndex}`}>{event}</div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </Panel>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Badge from "../../components/common/Badge";
import { getExam, getExamQuestions, submitExam } from "../../services/examService";

function secondsToClock(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const storageKey = `aas_exam_submitted_${id}`;
  const alreadySubmitted = localStorage.getItem(storageKey) === "1";

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [applicantId, setApplicantId] = useState("");
  const [fullName, setFullName] = useState("");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => ({}));
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const submitOnce = useRef(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoadError("");
        setSubmitError("");
        const [ex, qs] = await Promise.all([getExam(id), getExamQuestions(id, { shuffle: true })]);
        const items = Array.isArray(qs) ? qs : qs.items || [];
        if (ignore) return;
        setExam(ex || null);
        setQuestions(items);
        setIndex(0);
        const duration = Number(ex?.durationMinutes || 15);
        setSecondsLeft(duration * 60);
        if (!items.length) setLoadError("No questions found for this exam.");
      } catch {
        if (!ignore) {
          setExam(null);
          setQuestions([]);
          setLoadError("Failed to load this exam. Check your backend API.");
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (alreadySubmitted) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      // Triggers the native confirm dialog (browsers ignore custom text).
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [alreadySubmitted]);

  useEffect(() => {
    if (alreadySubmitted) return;
    if (!questions.length) return;
    const t = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [alreadySubmitted, questions.length]);

  useEffect(() => {
    if (alreadySubmitted) return;
    if (secondsLeft !== 0) return;
    void handleSubmit("Time elapsed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, alreadySubmitted]);

  async function handleSubmit(reason) {
    if (submitOnce.current) return;
    if (!questions.length) return;
    submitOnce.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitExam({
        examId: id,
        reason,
        applicantId: applicantId || undefined,
        fullName: fullName || undefined,
        answers,
      });
      localStorage.setItem(storageKey, "1");
      navigate(`/exams/${id}/results`, { replace: true });
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
          <button
            type="button"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
            onClick={() => navigate(`/exams/${id}/results`)}
          >
            View results
          </button>
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
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-800">Applicant ID (optional)</label>
                <input
                  value={applicantId}
                  onChange={(e) => setApplicantId(e.target.value)}
                  className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
                  placeholder="Mongo ObjectId"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-800">Full Name (optional)</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
                  placeholder="Applicant name"
                />
              </div>
            </div>

            {submitError ? (
              <div
                role="alert"
                className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                {submitError}
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Question {index + 1} of {questions.length}
                </div>
                <div className="mt-2 font-display text-xl font-semibold text-slate-900">{q?.text || "--"}</div>
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
              {(q?.options || []).map((opt, optIdx) => {
                const qid = q?._id || q?.id;
                const picked = answers[qid] === optIdx;
                return (
                  <button
                    key={`${qid}:${opt}`}
                    type="button"
                    className={
                      picked
                        ? "rounded-3xl border border-[color:var(--brand)]/40 bg-[color:var(--brand)]/10 px-4 py-4 text-left text-sm font-semibold text-slate-900"
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
          </Panel>
        </div>
      )}
    </div>
  );
}


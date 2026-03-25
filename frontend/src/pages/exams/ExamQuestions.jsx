import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Badge from "../../components/common/Badge";
import { getHeadteacherExam } from "../../services/examService";
import { cx } from "../../utils/helpers";

export default function ExamQuestions() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    (async () => {
      setLoading(true);
      try {
        const data = await getHeadteacherExam(id);
        const nextExam = data?.exam || data?.data || data;
        if (!ignore) {
          setExam(nextExam || null);
        }
      } catch {
        if (!ignore) {
          setExam(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [id]);

  const rows = useMemo(() => {
    if (!exam) return [];
    return Array.isArray(exam.questions) ? exam.questions : [];
  }, [exam]);

  const groupedCount = useMemo(() => {
    const out = { English: 0, Maths: 0, Other: 0 };
    for (const question of rows) {
      const subject = String(question.subject || "").trim();
      if (subject === "English") out.English += 1;
      else if (subject === "Maths") out.Maths += 1;
      else out.Other += 1;
    }
    return out;
  }, [rows]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Entrance Exam Questions"
        subtitle="Read-only exam question view based on the current headteacher exam endpoints."
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
          <div className="text-sm text-slate-700">Loading exam...</div>
        ) : !exam ? (
          <div className="space-y-4">
            <div className="text-sm text-slate-700">Exam not found.</div>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => navigate("/exams")}
            >
              Return to exams list
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-xl font-semibold text-slate-900">{exam.title}</div>
              <div className="mt-1 text-sm text-slate-600">
                Status: <span className="font-semibold">{String(exam.status || "draft").toUpperCase()}</span>
              </div>
              {exam.instructions ? (
                <div className="mt-2 max-w-3xl text-sm text-slate-700">{exam.instructions}</div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{rows.length} total</Badge>
              <Badge tone="neutral">{groupedCount.English} English</Badge>
              <Badge tone="neutral">{groupedCount.Maths} Maths</Badge>
              {groupedCount.Other ? <Badge tone="neutral">{groupedCount.Other} Other</Badge> : null}
            </div>
          </div>
        )}
      </Panel>

      <Panel className="p-5">
        {loading ? (
          <div className="text-sm text-slate-600">Loading questions...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-slate-600">No questions are stored on this exam yet.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((question, idx) => {
              const options = Array.isArray(question.options) ? question.options : [];
              const answer = question.answer;

              return (
                <div
                  key={question._id || question.id || `${id}:${idx}`}
                  className="rounded-3xl bg-white/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {idx + 1}. {question.subject || exam?.subject || "Question"}{" "}
                        {question.marks ? `- ${question.marks} pt` : ""}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {question.question || question.text}
                      </div>
                    </div>
                    <Badge tone="neutral">{question.type || "mcq"}</Badge>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {options.map((option, optionIndex) => (
                      <div
                        key={`${question._id || question.id || idx}:${optionIndex}`}
                        className={cx(
                          "rounded-2xl border px-3 py-2 text-sm",
                          option === answer
                            ? "border-emerald-200 bg-emerald-600/10 text-emerald-900"
                            : "border-slate-200/70 bg-white/70 text-slate-800"
                        )}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

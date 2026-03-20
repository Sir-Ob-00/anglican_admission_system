import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import { getExam, publishEntranceExam } from "../../services/examService";
import {
  createExamQuestion,
  deleteExamQuestion,
  listExamQuestions,
  updateExamQuestion,
} from "../../services/examQuestionService";
import { cx } from "../../utils/helpers";

const SUBJECTS = ["English", "Maths"];

function emptyQuestion(examId) {
  return {
    exam: examId,
    subject: "English",
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    points: 1,
  };
}

export default function ExamQuestions() {
  const { id } = useParams();
  const { role } = useAuth();
  const canEdit = role === "teacher" || role === "assistantHeadteacher";

  const [exam, setExam] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => emptyQuestion(id));
  const [confirm, setConfirm] = useState(null);

  const published = exam?.status === "active";

  async function refresh() {
    const [ex, qs] = await Promise.all([getExam(id), listExamQuestions({ examId: id })]);
    const items = Array.isArray(qs) ? qs : qs.items || [];
    setExam(ex);
    setRows(items);
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch {
        if (!ignore) {
          setExam(null);
          setRows([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const questionCount = rows.length;
  const canPublish = canEdit && !published && questionCount >= 10 && questionCount <= 20;

  const groupedCount = useMemo(() => {
    const out = { English: 0, Maths: 0 };
    for (const q of rows) {
      const s = String(q.subject || "");
      if (s === "English") out.English += 1;
      if (s === "Maths") out.Maths += 1;
    }
    return out;
  }, [rows]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Entrance Exam Questions"
        subtitle="Create, edit and publish questions (10 to 20 total). Published exams cannot be edited."
        right={
          canEdit ? (
            <div className="flex flex-wrap items-center gap-2">
              {exam?.code && published ? (
                <a
                  href={`/entrance-exam/${encodeURIComponent(exam.code)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                >
                  Open Exam Link
                </a>
              ) : null}
              <button
                type="button"
                className={cx(
                  "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white shadow-sm",
                  canPublish ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-600/40"
                )}
                disabled={!canPublish}
                onClick={async () => {
                  try {
                    await publishEntranceExam(id);
                    await refresh();
                  } catch (e) {
                    alert(e?.response?.data?.message || "Publish failed.");
                  }
                }}
                title={!published && canEdit ? "Publish makes the exam available to applicants." : ""}
              >
                {published ? "Published" : "Publish Exam"}
              </button>
              <button
                type="button"
                className={cx(
                  "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold",
                  published
                    ? "bg-slate-900/5 text-slate-400"
                    : "bg-slate-900/5 text-slate-800 hover:bg-slate-900/10"
                )}
                disabled={published}
                onClick={() => {
                  setEditing(null);
                  setForm(emptyQuestion(id));
                  setOpen(true);
                }}
              >
                Add Question
              </button>
            </div>
          ) : null
        }
      />

      <Panel className="p-5">
        {loading ? (
          <div className="text-sm text-slate-700">Loading...</div>
        ) : !exam ? (
          <div className="text-sm text-slate-700">Exam not found.</div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-xl font-semibold text-slate-900">
                {exam.title} {exam.code ? <span className="text-slate-500">({exam.code})</span> : null}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Status:{" "}
                <span className="font-semibold">{published ? "PUBLISHED" : String(exam.status || "draft").toUpperCase()}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{questionCount} total</Badge>
              <Badge tone="neutral">{groupedCount.English} English</Badge>
              <Badge tone="neutral">{groupedCount.Maths} Maths</Badge>
            </div>
          </div>
        )}
      </Panel>

      <Panel className="p-5">
        {rows.length === 0 ? (
          <div className="text-sm text-slate-600">No questions yet.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((q, idx) => (
              <div key={q._id || q.id} className="rounded-3xl bg-white/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {idx + 1}. {q.subject || "English"} {q.points ? `- ${q.points} pt` : ""}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{q.text}</div>
                  </div>
                  {canEdit ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={published}
                        className={cx(
                          "inline-flex h-9 items-center justify-center rounded-2xl px-3 text-xs font-semibold",
                          published
                            ? "bg-slate-900/5 text-slate-400"
                            : "bg-slate-900/5 text-slate-800 hover:bg-slate-900/10"
                        )}
                        onClick={() => {
                          setEditing(q);
                          setForm({
                            exam: id,
                            subject: q.subject || "English",
                            text: q.text || "",
                            options: Array.isArray(q.options) ? [...q.options] : ["", "", "", ""],
                            correctIndex: Number(q.correctIndex || 0),
                            points: Number(q.points || 1),
                          });
                          setOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={published}
                        className={cx(
                          "inline-flex h-9 items-center justify-center rounded-2xl px-3 text-xs font-semibold text-white",
                          published ? "bg-rose-600/40" : "bg-rose-600 hover:bg-rose-700"
                        )}
                        onClick={() => setConfirm(q)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(q.options || []).map((o, i) => (
                    <div
                      key={`${q._id || q.id}:${i}`}
                      className={cx(
                        "rounded-2xl border px-3 py-2 text-sm",
                        i === q.correctIndex
                          ? "border-emerald-200 bg-emerald-600/10 text-emerald-900"
                          : "border-slate-200/70 bg-white/70 text-slate-800"
                      )}
                    >
                      {o}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={open}
        title={editing ? "Edit Question" : "Add Question"}
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              disabled={!form.text.trim() || form.options.some((x) => !String(x).trim())}
              onClick={async () => {
                const payload = {
                  exam: id,
                  subject: form.subject,
                  text: form.text,
                  options: form.options,
                  correctIndex: Number(form.correctIndex),
                  points: Number(form.points || 1),
                };
                try {
                  if (editing) {
                    await updateExamQuestion(editing._id || editing.id, payload);
                  } else {
                    await createExamQuestion(payload);
                  }
                  await refresh();
                  setOpen(false);
                } catch (e) {
                  alert(e?.response?.data?.message || "Save failed.");
                }
              }}
            >
              Save
            </button>
          </div>
        }
      >
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-800">Subject</label>
            <select
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              disabled={published}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Question</label>
            <textarea
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              placeholder="Type the question..."
              disabled={published}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {form.options.map((opt, i) => (
              <div key={i}>
                <label className="text-sm font-semibold text-slate-800">Option {i + 1}</label>
                <input
                  value={opt}
                  onChange={(e) =>
                    setForm((f) => {
                      const next = [...f.options];
                      next[i] = e.target.value;
                      return { ...f, options: next };
                    })
                  }
                  className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
                  disabled={published}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold text-slate-800">Correct Option</label>
              <select
                value={String(form.correctIndex)}
                onChange={(e) => setForm((f) => ({ ...f, correctIndex: Number(e.target.value) }))}
                className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
                disabled={published}
              >
                {[0, 1, 2, 3].map((n) => (
                  <option key={n} value={String(n)}>
                    Option {n + 1}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">Points</label>
              <input
                type="number"
                value={String(form.points ?? 1)}
                onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
                className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
                min={1}
                disabled={published}
              />
            </div>
            <div className="rounded-2xl bg-white/60 p-3 text-sm text-slate-700 md:mt-6">
              Total questions must be between <span className="font-semibold">10</span> and{" "}
              <span className="font-semibold">20</span> to publish.
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete question"
        message="Delete this question? This cannot be undone."
        confirmText="Delete"
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          const target = confirm;
          setConfirm(null);
          try {
            await deleteExamQuestion(target._id || target.id);
          } catch (e) {
            alert(e?.response?.data?.message || "Delete failed.");
          }
          await refresh();
        }}
      />
    </div>
  );
}


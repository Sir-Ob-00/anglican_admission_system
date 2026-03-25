import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listHeadteacherClasses } from "../../services/classService";
import { getTeacherDashboard } from "../../services/dashboardService";
import {
  assignHeadteacherExam,
  getHeadteacherExam,
  updateHeadteacherExam,
} from "../../services/examService";

const IconPlus = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const IconTrash = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const IconSave = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
);
const IconPublish = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);
const IconCheck = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const IconAlert = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);
const IconArrowLeft = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);

function getClassIdentifier(item) {
  return item?._id || item?.id || item?.classId || "";
}

function normalizeTeacherAssignedClass(data) {
  const directAssignedClass = data?.teacher?.assignedClass;
  const firstTeacherClass = data?.teacher?.classes?.[0];
  const rawClass = directAssignedClass || firstTeacherClass;

  if (!rawClass) return null;

  return {
    ...rawClass,
    _id: rawClass._id || rawClass.id || rawClass.classId,
    id: rawClass.id || rawClass._id || rawClass.classId,
    name: rawClass.name || rawClass.className || rawClass.title || "Assigned Class",
  };
}

function normalizeExamRecord(result) {
  return result?.exam || result?.data?.exam || result?.data || result?.item || result;
}

function normalizeQuestion(question) {
  const options = Array.isArray(question?.options) ? [...question.options] : ["", "", "", ""];
  while (options.length < 4) options.push("");

  return {
    question: question?.question || question?.text || "",
    options: options.slice(0, 4),
    answer: question?.answer || "",
    marks: Number(question?.marks || question?.points || 0),
    type: question?.type || "mcq",
  };
}

export default function EditExam() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role } = useAuth();
  const isTeacher = String(role || "").toLowerCase() === "teacher";

  const [examData, setExamData] = useState({
    title: "",
    subject: "",
    duration: "",
    instructions: "",
    status: "draft",
    questions: [],
  });
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const [examRes, classSource] = await Promise.all([
          getHeadteacherExam(id),
          isTeacher ? getTeacherDashboard() : listHeadteacherClasses(),
        ]);

        if (ignore) return;

        const exam = normalizeExamRecord(examRes);
        const classItems = isTeacher
          ? (() => {
              const assignedClass = normalizeTeacherAssignedClass(classSource);
              return assignedClass ? [assignedClass] : [];
            })()
          : Array.isArray(classSource)
            ? classSource
            : classSource?.classes || classSource?.items || classSource?.data || [];

        setClasses(classItems);
        setExamData({
          title: exam?.title || "",
          subject: exam?.subject || "",
          duration: String(exam?.duration || exam?.durationMinutes || ""),
          instructions: exam?.instructions || "",
          status: exam?.status || "draft",
          questions: Array.isArray(exam?.questions) ? exam.questions.map(normalizeQuestion) : [],
        });
        setClassId(getClassIdentifier(exam?.class) || exam?.class_id || exam?.classId || "");
      } catch (error) {
        if (!ignore) {
          setMessage({
            text: error?.response?.data?.message || "Failed to load exam for editing.",
            type: "error",
          });
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
  }, [id, isTeacher]);

  const questionCount = useMemo(() => examData.questions.length, [examData.questions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExamData((prev) => ({ ...prev, [name]: value }));
  };

  const addQuestion = () => {
    setExamData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: "",
          options: ["", "", "", ""],
          answer: "",
          marks: 0,
          type: "mcq",
        },
      ],
    }));
  };

  const updateQuestion = (index, field, value) => {
    const nextQuestions = [...examData.questions];
    nextQuestions[index] = { ...nextQuestions[index], [field]: value };
    setExamData((prev) => ({ ...prev, questions: nextQuestions }));
  };

  const updateOption = (qIndex, oIndex, value) => {
    const nextQuestions = [...examData.questions];
    const nextOptions = [...nextQuestions[qIndex].options];
    nextOptions[oIndex] = value;
    nextQuestions[qIndex] = { ...nextQuestions[qIndex], options: nextOptions };
    setExamData((prev) => ({ ...prev, questions: nextQuestions }));
  };

  const removeQuestion = (index) => {
    setExamData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const buildPayload = (status) => {
    const duration = Number(examData.duration);
    return {
      ...examData,
      status,
      duration,
      durationMinutes: duration,
      questions: examData.questions.map((question) => ({
        question: question.question,
        options: question.options,
        answer: question.answer,
        marks: Number(question.marks || 0),
        type: question.type || "mcq",
      })),
    };
  };

  const saveChanges = async (status) => {
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const payload = buildPayload(status);

      if (!Number.isFinite(payload.duration) || payload.duration <= 0) {
        throw new Error("Duration is required and must be a positive number.");
      }

      await updateHeadteacherExam(id, payload);

      setExamData((prev) => ({ ...prev, status }));
      setMessage({
        text: status === "published" ? "Exam updated and published successfully." : "Exam changes saved successfully.",
        type: "success",
      });

      if (status === "published") {
        navigate("/exams", {
          state: {
            notice: {
              title: "Exam updated",
              message: "The exam was updated successfully and remains available in the exams list.",
            },
          },
        });
      }
    } catch (error) {
      setMessage({
        text: error?.response?.data?.message || error.message || "Unable to update this exam.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const assignExam = async () => {
    if (!classId) {
      setMessage({ text: "Please select a class before assigning the exam.", type: "error" });
      return;
    }

    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      await assignHeadteacherExam(id, { class_id: classId });
      setMessage({ text: "Exam successfully assigned to class!", type: "success" });
    } catch (error) {
      setMessage({ text: error?.response?.data?.message || error.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="flex flex-col gap-6 rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between md:p-8">
        <div>
          <button
            onClick={() => navigate("/exams")}
            className="group mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-800"
          >
            <IconArrowLeft className="text-slate-400 transition-all group-hover:-translate-x-1 group-hover:text-slate-800" />
            Back to Exams
          </button>
          <h1 className="bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Edit Exam
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Update the exam details and questions using the current editor layout.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => saveChanges("draft")}
            disabled={saving || loading}
            className="group flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
          >
            <IconSave className="text-slate-400 transition-colors group-hover:text-slate-600" />
            Save Changes
          </button>
          <button
            onClick={() => saveChanges("published")}
            disabled={saving || loading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:shadow-indigo-600/30 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <IconPublish />
            Update & Publish
          </button>
        </div>
      </div>

      {message.text ? (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-medium shadow-sm transition-all ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
              : "border-rose-200 bg-rose-50/80 text-rose-800"
          }`}
        >
          {message.type === "success" ? <IconCheck className="text-emerald-500" /> : <IconAlert className="text-rose-500" />}
          {message.text}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200/60 bg-white p-8 text-sm text-slate-600 shadow-sm">
          Loading exam editor...
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">1</span>
                Exam Details
              </h2>
              <div className="space-y-5 text-sm">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={examData.title}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400"
                    placeholder="e.g. Mid-Term Mathematics"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={examData.subject}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400"
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    name="duration"
                    value={examData.duration}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400"
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">Instructions</label>
                  <textarea
                    name="instructions"
                    value={examData.instructions}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400"
                    placeholder="Attempt all questions carefully prior to submitting..."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm md:p-8">
              <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-bl-full bg-teal-50 opacity-70"></div>
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">3</span>
                Assign to Class
              </h2>
              <div className="space-y-5 text-sm">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">Exam ID</label>
                  <input
                    type="text"
                    value={id}
                    readOnly
                    className="w-full cursor-not-allowed rounded-2xl border border-slate-100 bg-slate-100/70 px-4 py-3 font-mono text-xs text-slate-500 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">Target Class</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    disabled={isTeacher}
                    className={`w-full appearance-none rounded-2xl border px-4 py-3 pr-10 text-slate-900 outline-none transition-all ${
                      isTeacher
                        ? "cursor-not-allowed border-slate-100 bg-slate-100/70 text-slate-500"
                        : "border-slate-200 bg-slate-50/50 hover:cursor-pointer focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                    } bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-no-repeat`}
                  >
                    <option value="" disabled>Select a class...</option>
                    {classes.map((cls) => (
                      <option key={getClassIdentifier(cls)} value={getClassIdentifier(cls)}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  {isTeacher ? (
                    <p className="mt-2 text-xs text-slate-500">Class teachers can only assign exams to their own class.</p>
                  ) : null}
                </div>
                <button
                  onClick={assignExam}
                  disabled={saving}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <IconCheck size={18} />
                  Assign Exam Now
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="sticky top-4 z-10 flex items-center justify-between bg-slate-50/90 pb-2 pt-2 backdrop-blur-md">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">2</span>
                Questions
                <span className="ml-2 rounded-full bg-slate-200 px-3 py-0.5 text-xs font-bold text-slate-600">
                  {questionCount}
                </span>
              </h2>
              <button
                onClick={addQuestion}
                className="group flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition-all hover:bg-slate-800 hover:shadow-slate-900/20 active:scale-95"
              >
                <IconPlus className="text-slate-300 transition-colors group-hover:text-white" />
                Add Question
              </button>
            </div>

            <div className="space-y-5">
              {examData.questions.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 text-slate-400">
                  <IconPlus size={32} className="opacity-50" />
                  <p className="text-sm font-medium">No questions added yet. Start editing the exam.</p>
                </div>
              ) : (
                examData.questions.map((question, questionIndex) => (
                  <div
                    key={questionIndex}
                    className="group relative rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:border-violet-200 hover:shadow-md"
                  >
                    <button
                      onClick={() => removeQuestion(questionIndex)}
                      className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 opacity-0 transition-all hover:bg-rose-100 hover:text-rose-600 group-hover:opacity-100"
                      title="Remove Question"
                    >
                      <IconTrash />
                    </button>

                    <div className="mb-4">
                      <span className="mb-3 inline-block rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                        Question {questionIndex + 1}
                      </span>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <input
                          type="text"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                          placeholder="What is the question?"
                          value={question.question}
                          onChange={(e) => updateQuestion(questionIndex, "question", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="relative flex items-center">
                            <span className="pointer-events-none absolute left-4 font-bold text-slate-300">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50/30 py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-300 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/10"
                              placeholder="Enter option..."
                              value={option}
                              onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row">
                        <div className="flex-1">
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Correct Answer</label>
                          <select
                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-no-repeat px-4 py-3 pr-10 text-sm outline-none transition-all hover:cursor-pointer focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                            value={question.answer}
                            onChange={(e) => updateQuestion(questionIndex, "answer", e.target.value)}
                          >
                            <option value="" className="text-slate-300">Select correct option...</option>
                            {question.options.map((option, idx) => (
                              <option key={idx} value={option} disabled={!option}>
                                {String.fromCharCode(65 + idx)}: {option.substring(0, 30)}
                                {option.length > 30 ? "..." : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-full sm:w-28">
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Points</label>
                          <input
                            type="number"
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-3 text-sm outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                            value={question.marks}
                            onChange={(e) => updateQuestion(questionIndex, "marks", parseInt(e.target.value, 10) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

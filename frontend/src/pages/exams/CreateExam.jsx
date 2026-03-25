import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listHeadteacherClasses } from "../../services/classService";
import { getTeacherDashboard } from "../../services/dashboardService";
import {
  assignHeadteacherExam,
  createHeadteacherExam,
  saveHeadteacherExamDraft,
  updateHeadteacherExam,
} from "../../services/examService";

const LOCAL_DRAFT_KEY = "aas_create_exam_draft";

// Inline Icons
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

export default function CreateExam() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isTeacher = String(role || "").toLowerCase() === "teacher";
  const hasRestoredDraft = useRef(false);
  const [examData, setExamData] = useState({
    title: "",
    subject: "",
    duration: "",
    instructions: "",
    status: "draft",
    questions: [],
  });

  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [classes, setClasses] = useState([]);
  const [lastSavedAt, setLastSavedAt] = useState("");

  const persistLocalDraft = (nextExamData, nextClassId = classId, nextExamId = examId) => {
    try {
      localStorage.setItem(
        LOCAL_DRAFT_KEY,
        JSON.stringify({
          examData: nextExamData,
          classId: nextClassId,
          examId: nextExamId,
          savedAt: new Date().toISOString(),
        })
      );
      setLastSavedAt(new Date().toISOString());
    } catch (error) {
      console.error("Failed to save exam draft locally", error);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (isTeacher) {
          const data = await getTeacherDashboard();
          const assignedClass = normalizeTeacherAssignedClass(data);
          const items = assignedClass ? [assignedClass] : [];
          if (!ignore) {
            setClasses(items);
            setClassId(getClassIdentifier(assignedClass));
          }
          return;
        }

        const data = await listHeadteacherClasses();
        const items = Array.isArray(data) ? data : data.classes || data.items || data.data || [];
        if (!ignore) setClasses(items);
      } catch (err) {
        console.error("Failed to load classes", err);
        if (!ignore) setClasses([]);
      }
    })();
    return () => { ignore = true; };
  }, [isTeacher, role]);

  useEffect(() => {
    try {
      const rawDraft = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (!rawDraft) {
        hasRestoredDraft.current = true;
        return;
      }

      const parsedDraft = JSON.parse(rawDraft);
      if (parsedDraft?.examData) {
        setExamData((prev) => ({ ...prev, ...parsedDraft.examData }));
      }
      if (!isTeacher && parsedDraft?.classId) setClassId(parsedDraft.classId);
      if (parsedDraft?.examId) setExamId(parsedDraft.examId);
      if (parsedDraft?.savedAt) {
        setLastSavedAt(parsedDraft.savedAt);
        setMessage({
          text: "Recovered your local draft after refresh.",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Failed to restore exam draft", error);
    } finally {
      hasRestoredDraft.current = true;
    }
  }, [isTeacher]);

  useEffect(() => {
    if (!hasRestoredDraft.current) return;

    const timer = window.setTimeout(() => {
      persistLocalDraft(examData, classId, examId);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [classId, examData, examId]);

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
    const newQuestions = [...examData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setExamData({ ...examData, questions: newQuestions });
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...examData.questions];
    const newOptions = [...newQuestions[qIndex].options];
    newOptions[oIndex] = value;
    newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
    setExamData({ ...examData, questions: newQuestions });
  };

  const removeQuestion = (index) => {
    const newQuestions = examData.questions.filter((_, i) => i !== index);
    setExamData({ ...examData, questions: newQuestions });
  };

  const buildExamPayload = (status) => {
    const duration = Number(examData.duration);

    return {
      ...examData,
      status,
      duration,
      durationMinutes: duration,
    };
  };

  const extractExamRecord = (result) =>
    result?.exam ||
    result?.data?.exam ||
    result?.data ||
    result?.item ||
    result;

  const saveExam = async (status) => {
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const payload = buildExamPayload(status);

      if (!Number.isFinite(payload.duration) || payload.duration <= 0) {
        throw new Error("Duration is required and must be a positive number.");
      }

      let result;

      if (status === "draft") {
        result = examId
          ? await updateHeadteacherExam(examId, payload)
          : await saveHeadteacherExamDraft(payload);
      } else {
        result = examId
          ? await updateHeadteacherExam(examId, payload)
          : await createHeadteacherExam(payload);
      }

      console.log("Exam save response:", result);

      const savedExam = extractExamRecord(result);
      const savedExamId = savedExam?._id || savedExam?.id || "";

      setExamData((prev) => ({ ...prev, status }));
      if (savedExamId) {
        setExamId(savedExamId);
      }
      persistLocalDraft(payload, classId, savedExamId || examId);

      if (status === "published") {
        localStorage.removeItem(LOCAL_DRAFT_KEY);
        setLastSavedAt("");
        navigate("/exams", {
          state: {
            notice: {
              title: "Exam published",
              message: "The exam was published successfully and is now available in the exams list.",
            },
          },
        });
        return;
      }
      
      setMessage({
        text: "Exam successfully saved as draft!",
        type: "success",
      });
    } catch (error) {
      console.error("Save Exam Error:", error);
      setMessage({ text: error.response?.data?.message || error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const assignExam = async () => {
    if (!examId || !classId) {
      setMessage({ text: "Please ensure Exam ID is generated and Class ID is provided.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const result = await assignHeadteacherExam(examId, { class_id: classId });
      console.log("Assign exam response:", result);

      setMessage({ text: "Exam successfully assigned to class!", type: "success" });
    } catch (error) {
      console.error("Assign Exam Error:", error);
      setMessage({ text: error.response?.data?.message || error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Page Header Area */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-sm">
        <div>
          <button 
            onClick={() => navigate("/exams")}
            className="group mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <IconArrowLeft className="text-slate-400 group-hover:-translate-x-1 group-hover:text-slate-800 transition-all" />
            Back to Exams
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-900">
            Create Exam
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">Design, author, and publish examinations for your classes.</p>
        </div>
        
        {/* Section 3: Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {lastSavedAt ? (
            <div className="text-xs font-medium text-slate-500">
              Draft saved locally at {new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          ) : null}
          <button
            onClick={() => saveExam("draft")}
            disabled={loading}
            className="group flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
          >
            <IconSave className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            Save Draft
          </button>
          <button
            onClick={() => saveExam("published")}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:shadow-indigo-600/30 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <IconPublish />
            Publish Exam
          </button>
        </div>
      </div>

      {/* Message Toast */}
      {message.text && (
        <div
          className={`overflow-hidden flex items-center gap-3 rounded-2xl p-4 text-sm font-medium border shadow-sm transition-all ${
            message.type === "success" 
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-800" 
              : "bg-rose-50/80 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? <IconCheck className="text-emerald-500" /> : <IconAlert className="text-rose-500" />}
          {message.text}
        </div>
      )}

      {/* Main Grid: 2 Columns on MD */}
      <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
        
        {/* Left Column: Details & Assignment */}
        <div className="space-y-8">
          
          {/* Section 1: Exam Details */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 md:p-8 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">1</span>
              Exam Details
            </h2>
            <div className="space-y-5 text-sm">
              <div>
                <label className="mb-1.5 block font-semibold text-slate-700 text-xs uppercase tracking-wider">Title</label>
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
                <label className="mb-1.5 block font-semibold text-slate-700 text-xs uppercase tracking-wider">Subject</label>
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
                <label className="mb-1.5 block font-semibold text-slate-700 text-xs uppercase tracking-wider">Duration (Minutes)</label>
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
                <label className="mb-1.5 block font-semibold text-slate-700 text-xs uppercase tracking-wider">Instructions</label>
                <textarea
                  name="instructions"
                  value={examData.instructions}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400 resize-none"
                  placeholder="Attempt all questions carefully prior to submitting..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 4: Assign Exam */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -z-10 opacity-70"></div>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600">3</span>
              Assign to Class
            </h2>
            <div className="space-y-5 text-sm">
              <div>
                <label className="mb-1.5 block font-semibold text-slate-700 text-xs uppercase tracking-wider">Exam ID</label>
                <input
                  type="text"
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  readOnly={true}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-100/70 px-4 py-3 text-slate-500 outline-none font-mono text-xs cursor-not-allowed"
                  placeholder="Auto-filled when published"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-semibold text-slate-700 text-xs uppercase tracking-wider">Target Class</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  disabled={isTeacher}
                  className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition-all appearance-none pr-10 ${
                    isTeacher
                      ? "border-slate-100 bg-slate-100/70 text-slate-500 cursor-not-allowed"
                      : "border-slate-200 bg-slate-50/50 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 hover:cursor-pointer"
                  } bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center]`}
                >
                  <option value="" disabled>Select a class...</option>
                  {classes.map(c => (
                    <option key={getClassIdentifier(c)} value={getClassIdentifier(c)}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {isTeacher ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Class teachers can only assign exams to their own class.
                  </p>
                ) : null}
              </div>
              <button
                onClick={assignExam}
                disabled={loading || !examId}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <IconCheck size={18} />
                Assign Exam Now
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Questions */}
        <div className="space-y-6">
          <div className="sticky top-4 flex items-center justify-between z-10 bg-slate-50/90 backdrop-blur-md pb-2 pt-2">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">2</span>
              Questions
              <span className="ml-2 rounded-full bg-slate-200 px-3 py-0.5 text-xs font-bold text-slate-600">
                {examData.questions.length}
              </span>
            </h2>
            <button
              onClick={addQuestion}
              className="group flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-slate-900/10 transition-all hover:bg-slate-800 hover:shadow-slate-900/20 active:scale-95"
            >
              <IconPlus className="text-slate-300 group-hover:text-white transition-colors" />
              Add Question
            </button>
          </div>

          <div className="space-y-5">
            {examData.questions.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 text-slate-400">
                <IconPlus size={32} className="opacity-50" />
                <p className="font-medium text-sm">No questions added yet. Get started!</p>
              </div>
            ) : (
              examData.questions.map((q, qIndex) => (
                <div 
                  key={qIndex} 
                  className="group relative rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-violet-200"
                >
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 opacity-0 transition-all hover:bg-rose-100 hover:text-rose-600 group-hover:opacity-100"
                    title="Remove Question"
                  >
                    <IconTrash />
                  </button>
                  
                  <div className="mb-4">
                    <span className="inline-block rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                      Question {qIndex + 1}
                    </span>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-slate-900 outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10 placeholder:text-slate-400 font-medium"
                        placeholder="What is the question?"
                        value={q.question}
                        onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="relative flex items-center">
                          <span className="absolute left-4 font-bold text-slate-300 pointer-events-none">
                            {String.fromCharCode(65 + oIndex)}
                          </span>
                          <input
                            type="text"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/30 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/10 placeholder:text-slate-300"
                            placeholder="Enter option..."
                            value={opt}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-100 pt-5 mt-2">
                      <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Correct Answer</label>
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] pr-10 hover:cursor-pointer"
                          value={q.answer}
                          onChange={(e) => updateQuestion(qIndex, "answer", e.target.value)}
                        >
                          <option value="" className="text-slate-300">Select correct option...</option>
                          {q.options.map((opt, idx) => (
                            <option key={idx} value={opt} disabled={!opt}>
                              {String.fromCharCode(65 + idx)}: {opt.substring(0, 30)}
                              {opt.length > 30 ? "..." : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full sm:w-28">
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Points</label>
                        <div className="relative">
                          <input
                            type="number"
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-3 text-sm outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                            value={q.marks}
                            onChange={(e) => updateQuestion(qIndex, "marks", parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

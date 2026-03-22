import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import ExamForm from "../../components/forms/ExamForm";
import * as examService from "../../services/examService";
import { useAuth } from "../../context/AuthContext";

export default function EditExam() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { role } = useAuth();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const loadExam = async () => {
      try {
        const data = await examService.getExam(examId);
        setExam(data);
      } catch (err) {
        setNotice({
          title: "Error",
          message: "Failed to load exam details.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId]);

  const handleSubmit = async (values) => {
    try {
      await examService.updateExam(examId, values);
      navigate("/exams");
    } catch (err) {
      setNotice({
        title: "Update failed",
        message: err?.response?.data?.message || "Unable to update this exam.",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Edit Exam" subtitle="Modify exam details and settings." />
        <Panel className="p-5">
          <div className="text-sm text-slate-600">Loading exam details...</div>
        </Panel>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="space-y-4">
        <PageHeader title="Edit Exam" subtitle="Modify exam details and settings." />
        <Panel className="p-5">
          <div className="text-sm text-slate-600">Exam not found.</div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Edit Exam"
        subtitle="Modify exam details and settings."
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
        <ExamForm
          initialValues={exam}
          submitLabel="Update Exam"
          onSubmit={handleSubmit}
        />
      </Panel>

      {notice && (
        <Panel className="p-5">
          <div className="text-sm text-slate-700">
            <strong>{notice.title}:</strong> {notice.message}
          </div>
        </Panel>
      )}
    </div>
  );
}

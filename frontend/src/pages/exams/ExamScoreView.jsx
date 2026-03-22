import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Badge from "../../components/common/Badge";
import { formatDate } from "../../utils/helpers";
import * as examService from "../../services/examService";

export default function ExamScoreView() {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const applicantId = searchParams.get("applicantId");
  const fullName = searchParams.get("fullName");

  useEffect(() => {
    const loadResult = async () => {
      try {
        const data = await examService.getExamResult(examId, applicantId);
        setResult(data);
      } catch (err) {
        setError("Failed to load exam result");
      } finally {
        setLoading(false);
      }
    };

    if (examId && applicantId) {
      loadResult();
    }
  }, [examId, applicantId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Exam Result" subtitle="Loading your exam score..." />
        <Panel className="p-5">
          <div className="text-sm text-slate-600">Please wait...</div>
        </Panel>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="space-y-4">
        <PageHeader title="Exam Result" subtitle="Unable to load your exam result." />
        <Panel className="p-5">
          <div className="text-sm text-slate-600">{error || "Exam result not found."}</div>
        </Panel>
      </div>
    );
  }

  const passed = result.result === "passed";
  const scorePercentage = result.percentage || 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Exam Result"
        subtitle={`Your entrance exam score and performance details.`}
      />

      <Panel className="p-5">
        <div className="text-center space-y-6">
          {/* Score Display */}
          <div className="space-y-2">
            <div className="text-4xl font-bold text-slate-900">
              {scorePercentage.toFixed(1)}%
            </div>
            <Badge 
              tone={passed ? "success" : "danger"} 
              className="text-sm"
            >
              {passed ? "PASSED" : "FAILED"}
            </Badge>
          </div>

          {/* Score Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-slate-900">Score</div>
              <div className="text-slate-600">
                {result.score} / {result.totalPoints}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-900">Pass Mark</div>
              <div className="text-slate-600">
                {result.passMark || 50}%
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <div className="text-sm font-medium text-slate-900">
              {passed 
                ? "Congratulations! You have passed the entrance exam."
                : "You did not meet the passing score. The administration will review your results."
              }
            </div>
            <div className="text-xs text-slate-600 mt-2">
              The administration has been notified of your exam completion.
            </div>
          </div>

          {/* Submission Details */}
          <div className="text-xs text-slate-600 space-y-1">
            <div>Submitted: {formatDate(result.submittedAt)}</div>
            <div>Student: {fullName || "Anonymous"}</div>
          </div>
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="text-center">
          <div className="text-sm text-slate-700">
            <strong>Next Steps:</strong> The school administration will review your exam results 
            and contact you regarding the admission process.
          </div>
        </div>
      </Panel>
    </div>
  );
}

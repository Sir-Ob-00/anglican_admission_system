import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Badge from "../../components/common/Badge";
import { formatDate } from "../../utils/helpers";

export default function ExamScoreView() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState(location.state?.result || null);
  const [error, setError] = useState(null);
  const securityMeta = location.state?.securityMeta || null;
  const securityEvents = Array.isArray(location.state?.securityEvents) ? location.state.securityEvents : [];

  const fullName = searchParams.get("fullName");
  const scorePercentage = useMemo(() => {
    if (!result) return 0;
    if (typeof result.percentage === "number") return result.percentage;
    if (typeof result.score === "number" && typeof result.totalPoints === "number" && result.totalPoints > 0) {
      return (result.score / result.totalPoints) * 100;
    }
    return 0;
  }, [result]);

  useEffect(() => {
    if (!location.state?.result && id) {
      setError("Exam result is not available to reload from this page.");
    }
  }, [id, location.state]);

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

      {(securityMeta || securityEvents.length > 0) ? (
        <Panel className="p-5">
          <div className="font-semibold text-slate-900">Session Security Summary</div>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div>Fingerprint: {securityMeta?.fingerprint || "Unavailable"}</div>
            <div>IP Address: {securityMeta?.ipAddress || "Unavailable"}</div>
            <div>
              Events:
              {securityEvents.length === 0 ? " None recorded" : ""}
            </div>
            {securityEvents.length > 0 ? (
              <div className="space-y-1 rounded-2xl bg-slate-50 p-3">
                {securityEvents.map((event, index) => (
                  <div key={`${event}-${index}`}>{event}</div>
                ))}
              </div>
            ) : null}
          </div>
        </Panel>
      ) : null}

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

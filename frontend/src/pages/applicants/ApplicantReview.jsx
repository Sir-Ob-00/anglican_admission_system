import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Badge from "../../components/common/Badge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { getApplicant } from "../../services/applicantService";
import { decideExamResult, recommendExamResult } from "../../services/examResultService";
import { useAuth } from "../../context/AuthContext";

export default function ApplicantReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(null);
  const [applicant, setApplicant] = useState(null);
  const { role } = useAuth();

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getApplicant(id);
        if (!ignore) setApplicant(data);
      } catch {
        if (!ignore) setApplicant(null);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  const actions = useMemo(
    () => [
      {
        key: "approve",
        label: "Approve Exam",
        tone: "success",
        message: "Approve the exam result and move the applicant to payment stage?",
      },
      {
        key: "reject",
        label: "Reject Exam",
        tone: "danger",
        message: "Reject the exam result and stop the admission process for this applicant?",
      },
      {
        key: "reexam",
        label: "Request Re-exam",
        tone: "warning",
        message: "Request a re-exam and move the applicant back to exam scheduled?",
      },
    ],
    []
  );

  const latestResultId = applicant?.examResults?.[0]?._id || applicant?.examResults?.[0]?.id;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Applicant Review"
        subtitle="Headteacher decision on exam outcome."
        right={
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900/5 px-5 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
            onClick={() => navigate(`/applicants/${id}`)}
          >
            Back to details
          </button>
        }
      />

      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-display text-xl font-semibold text-slate-900">
              Review {applicant?.fullName || `applicant ${id}`}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              This updates the applicant workflow on the backend.
            </div>
          </div>
          <Badge tone={role === "headteacher" ? "info" : "warning"}>
            {role === "headteacher" ? "Headteacher" : "View only"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              className={
                a.tone === "danger"
                  ? "inline-flex h-14 items-center justify-center rounded-3xl bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700"
                  : a.tone === "warning"
                    ? "inline-flex h-14 items-center justify-center rounded-3xl bg-amber-600 px-5 text-sm font-semibold text-white hover:bg-amber-700"
                    : "inline-flex h-14 items-center justify-center rounded-3xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
              }
              onClick={() => setConfirm(a)}
              disabled={role !== "headteacher" || !latestResultId}
            >
              {a.label}
            </button>
          ))}
        </div>

        {role === "assistantHeadteacher" ? (
          <div className="mt-5">
            <div className="text-sm font-semibold text-slate-900">Assistant Recommendation</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                disabled={!latestResultId}
                onClick={async () => {
                  try {
                    await recommendExamResult(latestResultId, "passed", "");
                    alert("Recommended: Pass");
                  } catch {
                    alert("Recommendation failed.");
                  }
                }}
              >
                Recommend Pass
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                disabled={!latestResultId}
                onClick={async () => {
                  try {
                    await recommendExamResult(latestResultId, "failed", "");
                    alert("Recommended: Fail");
                  } catch {
                    alert("Recommendation failed.");
                  }
                }}
              >
                Recommend Fail
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-600">
              Headteacher still makes the final approve/reject decision.
            </div>
          </div>
        ) : null}
        {!latestResultId && (
          <div className="mt-4 rounded-2xl bg-white/60 p-3 text-sm text-slate-700">
            No exam result found for this applicant yet.
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.label}
        message={confirm?.message}
        tone={confirm?.tone}
        confirmText={confirm?.label}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          const target = confirm;
          setConfirm(null);
          try {
            await decideExamResult(latestResultId, target.key);
            navigate(`/applicants/${id}`);
          } catch {
            alert("Action failed. Ensure backend is running and you are logged in as Headteacher.");
          }
        }}
      />
    </div>
  );
}

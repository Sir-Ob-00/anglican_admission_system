import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import PageHeader from "../../components/common/PageHeader";
import { formatDate, normalizeWorkflowStatus, statusLabel, statusTone } from "../../utils/helpers";
import * as applicantService from "../../services/applicantService";
import { useAuth } from "../../context/AuthContext";
import { getApplicantsForParent } from "../../services/parentService";

function deriveApplicantStatus(a) {
  const rawStatus = normalizeWorkflowStatus(a.status);
  const admissionStatus = normalizeWorkflowStatus(a.admissionStatus || a.admission?.status);
  const latestExamResult = normalizeWorkflowStatus(
    a.examResults?.[0]?.result || a.examResult?.result || a.examStatus
  );
  const paymentStatus = normalizeWorkflowStatus(
    a.payments?.[0]?.status || a.paymentStatus
  );
  const hasAssignedExam = Boolean(
    a.exam ||
      a.examId ||
      a.exam_id ||
      a.examCode ||
      a.exam?.code ||
      a.examAssignments?.length
  );

  if (admissionStatus === "admitted" || rawStatus === "admitted") return "admitted";
  if (admissionStatus === "rejected" || rawStatus === "rejected" || latestExamResult === "exam_failed" || rawStatus === "exam_failed") {
    return "rejected";
  }
  if (paymentStatus === "payment_completed") {
    return "payment_completed";
  }
  if (paymentStatus === "awaiting_payment" || rawStatus === "awaiting_payment") {
    return "awaiting_payment";
  }
  if (latestExamResult === "exam_passed" || latestExamResult === "exam_failed" || latestExamResult === "exam_completed") {
    return "exam_completed";
  }
  if (rawStatus === "exam_completed") return "exam_completed";
  if (hasAssignedExam || rawStatus === "exam_scheduled") return "exam_scheduled";
  return rawStatus || "pending_review";
}

function normalizeApplicant(a) {
  return {
    ...a,
    id: a.id || a._id,
    fullName: a.fullName || a.full_name,
    classApplyingFor: a.classApplyingFor || a.class?.name || a.class_applied || "",
    createdAt: a.createdAt || a.created_at,
    status: deriveApplicantStatus(a),
  };
}

export default function ApplicantsList() {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const isHeadteacher = role === "headteacher" || role === "assistant_headteacher" || role === "assistantHeadteacher";
  const isParent = String(role || "").toLowerCase() === "parent";
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const status = searchParams.get("status") || "";

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (!ignore) setLoading(true);
        const data = isParent
          ? await getApplicantsForParent(user?.id || user?._id)
          : await applicantService.listHeadteacherApplicants();
        const items = Array.isArray(data) ? data : data.items || data.applicants || [];
        const normalizedItems = items.map(normalizeApplicant);
        const filteredItems = status
          ? normalizedItems.filter((item) => item.status === String(status).toLowerCase())
          : normalizedItems;

        if (!ignore) {
          setRows(filteredItems);
        }
      } catch (error) {
        if (!ignore) setRows([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [status, role, isParent, user]);

  const columns = useMemo(
    () => [
      { key: "fullName", header: "Applicant" },
      { key: "classApplyingFor", header: "Class" },
      { key: "examCode", header: "Exam ID", render: (r) => r.exam?.code || "--" },
      {
        key: "status",
        header: "Status",
        render: (r) => <Badge tone={statusTone(r.status)}>{statusLabel(r.status)}</Badge>,
      },
      { key: "createdAt", header: "Created", render: (r) => formatDate(r.createdAt) },
      {
        key: "actions",
        header: "Actions",
        render: (r) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900/5 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/applicants/${r.id}`);
              }}
            >
              View
            </button>
            {isHeadteacher ? (
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-2xl bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirm(r);
                }}
              >
                Delete
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    [navigate, role]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title={role === "teacher" ? "Assigned Applicants" : "Applicants"}
        subtitle={
          role === "teacher"
            ? "Applicants assigned to your entrance exams. Use Conduct to launch a supervised exam session."
            : isParent
              ? "Track your linked applicants and their admission progress."
              : "Search, review, and manage admission applicants."
        }
        right={
          isHeadteacher ? (
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
              onClick={() => navigate("/applicants/new")}
            >
              Add Applicant
            </button>
          ) : null
        }
      />

      <Table
        title={role === "teacher" ? "Assigned Applicants" : isParent ? "My Applicants" : "Applicants List"}
        rows={rows}
        columns={columns}
        loading={loading}
        loadingText="Loading applicants..."
        actions={
          isParent ? (
            <div className="flex flex-wrap items-center gap-2">
              {[
                ["", "All", "bg-[color:var(--brand)]/10 text-[color:var(--brand)] hover:bg-[color:var(--brand)]/20"],
                ["pending_review", "Pending Review", "bg-slate-100 text-slate-800 hover:bg-slate-200"],
                ["exam_scheduled", "Exam Scheduled", "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"],
                ["exam_completed", "Exam Completed", "bg-blue-100 text-blue-800 hover:bg-blue-200"],
                ["awaiting_payment", "Awaiting Payment", "bg-amber-100 text-amber-800 hover:bg-amber-200"],
                ["admitted", "Admitted", "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"],
                ["rejected", "Rejected", "bg-rose-100 text-rose-800 hover:bg-rose-200"],
              ].map(([k, label, colorCls]) => (
                <button
                  key={k}
                  type="button"
                  className={`inline-flex h-10 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition-colors ${colorCls} ${
                    status === k ? "ring-2 ring-offset-2 ring-[color:var(--brand)]" : ""
                  }`}
                  onClick={() => {
                    if (!k || status === k) {
                      navigate("/applicants");
                    } else {
                      navigate(`/applicants?status=${k}`);
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {[
                ["", "All", "bg-[color:var(--brand)]/10 text-[color:var(--brand)] hover:bg-[color:var(--brand)]/20"],
                ["pending_review", "Pending Review", "bg-slate-100 text-slate-800 hover:bg-slate-200"],
                ["exam_scheduled", "Exam Scheduled", "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"],
                ["exam_completed", "Exam Completed", "bg-blue-100 text-blue-800 hover:bg-blue-200"],
                ["awaiting_payment", "Awaiting Payment", "bg-amber-100 text-amber-800 hover:bg-amber-200"],
                ["admitted", "Admitted", "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"],
                ["rejected", "Rejected", "bg-rose-100 text-rose-800 hover:bg-rose-200"],
              ].map(([k, label, colorCls]) => (
                <button
                  key={k}
                  type="button"
                  className={`inline-flex h-10 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition-colors ${colorCls} ${
                    status === k ? "ring-2 ring-offset-2 ring-[color:var(--brand)]" : ""
                  }`}
                  onClick={() => {
                    if (!k || status === k) {
                      navigate("/applicants");
                    } else {
                      navigate(`/applicants?status=${k}`);
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )
        }
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete applicant"
        message={`Delete ${confirm?.fullName || "this applicant"}? This cannot be undone.`}
        confirmText="Delete"
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          const target = confirm;
          setConfirm(null);
          try {
            setLoading(true);
            console.log("Deleting applicant for role:", role);
            
            // Use the working headteacher endpoint
            await applicantService.deleteHeadteacherApplicant(target.id);
            
            // Refresh the list
            const refreshData = await applicantService.listHeadteacherApplicants(status ? { status: status.toUpperCase() } : undefined);
            const items = Array.isArray(refreshData) ? refreshData : refreshData.items || refreshData.applicants || [];
            setRows(
              items.map((a) => ({
                ...a,
                id: a.id || a._id,
                fullName: a.fullName || a.full_name,
                classApplyingFor: a.classApplyingFor || a.class?.name || a.class_applied || "",
                createdAt: a.createdAt || a.created_at,
              }))
            );
            
            alert("Applicant deleted successfully!");
          } catch (error) {
            console.error("Failed to delete applicant:", error);
            alert("Failed to delete applicant. Please try again.");
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import PageHeader from "../../components/common/PageHeader";
import { formatDate, statusLabel, statusTone } from "../../utils/helpers";
import * as applicantService from "../../services/applicantService";
import { useAuth } from "../../context/AuthContext";

export default function ApplicantsList() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const status = searchParams.get("status") || "";

  function openConductWindow(applicant) {
    const examCode = applicant?.exam?.code;
    if (!examCode) return;

    const params = new URLSearchParams({
      applicantId: String(applicant.id || applicant._id || ""),
      fullName: applicant.fullName || "",
      secure: "1",
      popup: "1",
    });
    const width = Math.max(window.screen.availWidth, 1200);
    const height = Math.max(window.screen.availHeight, 800);
    const features = [
      "popup=yes",
      "toolbar=no",
      "location=no",
      "status=no",
      "menubar=no",
      "scrollbars=yes",
      "resizable=yes",
      `width=${width}`,
      `height=${height}`,
      "left=0",
      "top=0",
    ].join(",");

    const targetUrl = `${window.location.origin}/entrance-exam/${encodeURIComponent(examCode)}?${params.toString()}`;
    const win = window.open(targetUrl, `conduct-exam-${applicant.id || applicant._id}`, features);
    if (win) win.focus();
    else window.location.assign(targetUrl);
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await applicantService.listApplicants(status ? { status } : undefined);
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) {
          setRows(
            items.map((a) => ({
              ...a,
              id: a.id || a._id,
            }))
          );
        }
      } catch {
        if (!ignore) setRows([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [status]);

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
            {role === "teacher" ? (
              <button
                type="button"
                disabled={!r.exam?.code || r.status !== "exam_scheduled" || r.exam?.status !== "active"}
                className="inline-flex h-9 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-3 text-xs font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  openConductWindow(r);
                }}
              >
                Conduct
              </button>
            ) : null}
            {role === "headteacher" ? (
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
            : "Search, review, and manage admission applicants."
        }
        right={
          role === "headteacher" || role === "assistantHeadteacher" ? (
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
        title={role === "teacher" ? "Assigned Applicants" : "Applicants List"}
        rows={rows}
        columns={columns}
        onRowClick={(r) => navigate(`/applicants/${r.id}`)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {[
              ["pending_review", "Pending Review"],
              ["exam_scheduled", "Exam Scheduled"],
              ["exam_completed", "Exam Completed"],
              ["awaiting_payment", "Awaiting Payment"],
              ["rejected", "Rejected"],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
                onClick={() => navigate(`/applicants?status=${k}`)}
              >
                {label}
              </button>
            ))}
          </div>
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
            await applicantService.deleteApplicant(target.id);
            setRows((r) => r.filter((x) => x.id !== target.id));
          } catch {
            setRows((r) => r.filter((x) => x.id !== target.id));
          }
        }}
      />
    </div>
  );
}

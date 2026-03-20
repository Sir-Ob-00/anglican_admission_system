import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Badge from "../../components/common/Badge";
import StatusPipeline from "../../components/common/StatusPipeline";
import { formatDate, statusLabel, statusTone } from "../../utils/helpers";
import * as applicantService from "../../services/applicantService";
import { listExams, assignExamToApplicantWithSupervisor } from "../../services/examService";
import Modal from "../../components/common/Modal";
import { useAuth } from "../../context/AuthContext";
import { approveAdmission } from "../../services/admissionService";
import ApplicantForm from "../../components/forms/ApplicantForm";
import { listTeachers } from "../../services/teacherService";
import { listUsers } from "../../services/userService";
import { listClasses } from "../../services/classService";
import ConfirmDialog from "../../components/common/ConfirmDialog";

export default function ApplicantDetails() {
  const { id } = useParams();
  const [applicant, setApplicant] = useState(null);
  const [loadError, setLoadError] = useState("");
  const { role } = useAuth();
  const [assignOpen, setAssignOpen] = useState(false);
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [classAssigned, setClassAssigned] = useState("");
  const [classes, setClasses] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [approvalError, setApprovalError] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await applicantService.getApplicant(id);
        if (!ignore) {
          setLoadError("");
          setApplicant(data);
        }
      } catch {
        if (!ignore) {
          setLoadError("Failed to load applicant.");
          setApplicant(null);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    if (role !== "headteacher") return;
    let ignore = false;
    (async () => {
      try {
        const data = await listClasses();
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) {
          setClasses(items);
          if (!classAssigned && applicant?.classApplyingFor) {
            const match = items.find(
              (c) => String(c.name || "").toLowerCase() === String(applicant.classApplyingFor).toLowerCase()
            );
            if (match) setClassAssigned(match._id || match.id || "");
          }
        }
      } catch {
        if (!ignore) setClasses([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [role, applicant, classAssigned]);

  useEffect(() => {
    let ignore = false;
    if (!assignOpen) return;
    (async () => {
      try {
        const data = await listExams();
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) setExams(items);

        const [tRes, aRes] = await Promise.all([
          listTeachers(),
          listUsers({ role: "assistantHeadteacher" }),
        ]);
        const tItems = Array.isArray(tRes) ? tRes : tRes.items || [];
        const aItems = Array.isArray(aRes) ? aRes : aRes.items || [];
        const merged = [
          ...tItems.map((t) => ({
            id: t.user?._id || t.user || t._id || t.id,
            label: `${t.user?.name || "Teacher"} (Teacher)`,
          })),
          ...aItems.map((u) => ({
            id: u._id || u.id,
            label: `${u.name || u.username || "Assistant"} (Assistant Headteacher)`,
          })),
        ].filter((x) => x.id);
        if (!ignore) setSupervisors(merged);
      } catch {
        if (!ignore) {
          setExams([]);
          setSupervisors([]);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [assignOpen]);

  if (!applicant) {
    return (
      <div className="space-y-4">
        <PageHeader title="Applicant Details" subtitle={loadError || "Loading applicant record..."} />
        <Panel>{loadError || "Loading..."}</Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Applicant Details"
        subtitle="Profile, exam status, payment status, documents, and admission progress."
        right={
          <div className="flex flex-wrap items-center gap-2">
            {role === "headteacher" || role === "assistantHeadteacher" ? (
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900/5 px-5 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
                onClick={() => setEditOpen(true)}
              >
                Edit
              </button>
            ) : null}
            {role === "headteacher" ? (
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900/5 px-5 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
                onClick={() => setAssignOpen(true)}
              >
                Assign Exam
              </button>
            ) : null}
            <Link
              to={`/applicants/${id}/review`}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
            >
              Review
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-display text-2xl font-semibold text-slate-900">
                {applicant.fullName}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Created {formatDate(applicant.createdAt)}
              </div>
            </div>
            <Badge tone={statusTone(applicant.status)}>{statusLabel(applicant.status)}</Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Date of Birth
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {applicant.dateOfBirth || "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Gender
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {String(applicant.gender || "—")}
              </div>
            </div>
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Class Applying For
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {applicant.classApplyingFor || "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Parent Contact
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {applicant.parentContact || "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Parent Name
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {applicant.parentName || "—"}
              </div>
            </div>
            <div className="rounded-2xl bg-white/60 p-3 md:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Address
              </div>
              <div className="mt-1 text-sm text-slate-800">{applicant.address || "—"}</div>
            </div>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel>
            <div className="font-semibold text-slate-900">Exam</div>
            <div className="mt-2 text-sm text-slate-700">
              Latest result:{" "}
              <span className="font-semibold">
                {applicant.examResults?.[0]?.result || applicant.examStatus || "—"}
              </span>
            </div>
            {applicant.exam?.code ? (
              <div className="mt-2 text-sm text-slate-700">
                Entrance Exam ID: <span className="font-semibold">{applicant.exam.code}</span>
              </div>
            ) : null}
            {applicant.exam?.code ? (
              <a
                href={`/entrance-exam/${encodeURIComponent(applicant.exam.code)}?applicantId=${encodeURIComponent(
                  applicant._id || applicant.id
                )}&fullName=${encodeURIComponent(applicant.fullName || "")}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white hover:brightness-110"
              >
                Open entrance exam portal
              </a>
            ) : null}
            <Link
              to="/exams"
              className="mt-3 inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
            >
              Go to exams
            </Link>
          </Panel>

          <Panel>
            <div className="font-semibold text-slate-900">Payment</div>
            <div className="mt-2 text-sm text-slate-700">
              Status:{" "}
              <span className="font-semibold">
                {applicant.payments?.[0]?.status || applicant.paymentStatus || "—"}
              </span>
            </div>
            <Link
              to="/payments"
              className="mt-3 inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
            >
              Go to payments
            </Link>
          </Panel>

          {role === "headteacher" ? (
            <Panel>
              <div className="font-semibold text-slate-900">Admission</div>
              <div className="mt-2 text-sm text-slate-700">
                Status: <span className="font-semibold">{applicant.admissionStatus || "—"}</span>
              </div>
              <div className="mt-3 grid gap-2">
                <select
                  value={classAssigned}
                  onChange={(e) => setClassAssigned(e.target.value)}
                  className="h-10 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-[color:var(--brand)]"
                >
                  <option value="">Assign class (optional)</option>
                  {classes.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                  onClick={() => setConfirmApprove(true)}
                >
                  Approve Admission
                </button>
              </div>
            </Panel>
          ) : null}

          <Panel>
            <div className="font-semibold text-slate-900">Documents</div>
            <div className="mt-2 space-y-2 text-sm text-slate-700">
              {(applicant.documents || []).length ? (
                applicant.documents.map((d) => (
                  <div key={d._id || d.id || d.originalName} className="flex items-center justify-between">
                    <div className="capitalize">
                      {String(d.documentType || "").replaceAll("_", " ")}
                    </div>
                    <Badge tone="success">Uploaded</Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No documents uploaded yet.</div>
              )}
            </div>
            <Link
              to="/documents"
              className="mt-3 inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
            >
              Manage documents
            </Link>
          </Panel>
        </div>
      </div>

      <StatusPipeline status={applicant.status} />

      <Modal
        open={assignOpen}
        title="Assign Entrance Exam"
        onClose={() => setAssignOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setAssignOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedExamId || !selectedSupervisorId}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              onClick={async () => {
                try {
                  await assignExamToApplicantWithSupervisor(id, {
                    examId: selectedExamId,
                    supervisorUserId: selectedSupervisorId,
                  });
                  const refreshed = await applicantService.getApplicant(id);
                  setApplicant(refreshed);
                  setAssignOpen(false);
                } catch {
                  alert("Assign exam failed.");
                }
              }}
            >
              Assign
            </button>
          </div>
        }
      >
        <div className="text-sm text-slate-700">
          Select an exam and a supervisor (Class Teacher or Assistant Headteacher). The supervisor will publish the exam
          before the applicant can take it.
        </div>
        <select
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
          className="mt-3 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
        >
          <option value="">Select exam...</option>
          {exams.map((e) => (
            <option key={e._id || e.id} value={e._id || e.id}>
              {e.code ? `${e.code} · ` : ""}{e.title} ({e.classLevel})
            </option>
          ))}
        </select>

        <div className="mt-4">
          <label className="text-sm font-semibold text-slate-800">Supervisor</label>
          <select
            value={selectedSupervisorId}
            onChange={(e) => setSelectedSupervisorId(e.target.value)}
            className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          >
            <option value="">Select supervisor...</option>
            {supervisors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      <Modal
        open={editOpen}
        title="Edit Applicant"
        onClose={() => setEditOpen(false)}
      >
        <ApplicantForm
          initialValues={applicant}
          submitLabel="Save Changes"
          onSubmit={async (values) => {
            try {
              await applicantService.updateApplicant(id, values);
              const refreshed = await applicantService.getApplicant(id);
              setApplicant(refreshed);
              setEditOpen(false);
            } catch {
              alert("Update failed.");
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={confirmApprove}
        title="Approve admission"
        message="Approve admission for this applicant? This creates the student record and updates the admission status."
        confirmText="Approve"
        tone="warning"
        onClose={() => setConfirmApprove(false)}
        onConfirm={async () => {
          setConfirmApprove(false);
          try {
            await approveAdmission(id, classAssigned ? { classAssigned } : undefined);
            const refreshed = await applicantService.getApplicant(id);
            setApplicant(refreshed);
          } catch (e) {
            setApprovalError(e?.response?.data?.message || "Admission approval failed. Ensure payment is verified.");
          }
        }}
      />

      <Modal
        open={Boolean(approvalError)}
        title="Admission approval failed"
        onClose={() => setApprovalError("")}
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setApprovalError("")}
            >
              Close
            </button>
          </div>
        }
      >
        <div className="text-sm text-slate-700">{approvalError}</div>
      </Modal>
    </div>
  );
}

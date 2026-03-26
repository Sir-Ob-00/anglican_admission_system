import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Badge from "../../components/common/Badge";
import StatusPipeline from "../../components/common/StatusPipeline";
import { formatDate, normalizeWorkflowStatus, statusLabel, statusTone } from "../../utils/helpers";
import * as applicantService from "../../services/applicantService";
import Modal from "../../components/common/Modal";
import { useAuth } from "../../context/AuthContext";
import { approveAdmission } from "../../services/admissionService";
import ApplicantForm from "../../components/forms/ApplicantForm";
import { listHeadteacherClasses } from "../../services/classService";
import { assignHeadteacherExam, listAllHeadteacherExams } from "../../services/examService";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import {
  getParentForApplicant,
  linkParentToApplicant,
  listAllParentApplicantParents,
} from "../../services/parentService";
import { initializeAdmissionPayment } from "../../services/paymentService";

const PARENT_OPTIONS_ERROR = "Unable to load parent accounts right now.";
const PARENT_LINK_ERROR = "Unable to link the selected parent to this applicant right now.";

export default function ApplicantDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [applicant, setApplicant] = useState(null);
  const [loadError, setLoadError] = useState("");
  const { role } = useAuth();
  const isHeadteacher = role === "headteacher" || role === "assistant_headteacher" || role === "assistantHeadteacher";
  const [classAssigned, setClassAssigned] = useState("");
  const [classes, setClasses] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [approvalError, setApprovalError] = useState("");
  const [assignExamOpen, setAssignExamOpen] = useState(false);
  const [availableExams, setAvailableExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [assignExamLoading, setAssignExamLoading] = useState(false);
  const [assignExamError, setAssignExamError] = useState("");
  const [parentLinkOpen, setParentLinkOpen] = useState(false);
  const [availableParents, setAvailableParents] = useState([]);
  const [linkedParent, setLinkedParent] = useState(null);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [parentLinkLoading, setParentLinkLoading] = useState(false);
  const [parentLinkError, setParentLinkError] = useState("");
  const [initiatePaymentOpen, setInitiatePaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [availablePaymentApplicants, setAvailablePaymentApplicants] = useState([]);
  const [selectedPaymentApplicantId, setSelectedPaymentApplicantId] = useState("");
  const [paymentInitLoading, setPaymentInitLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const normalizeExamItems = (data) => (Array.isArray(data) ? data : data?.exams || data?.items || data?.data || []);

  const mapApplicantData = (data) => {
    const a = data?.applicant || data;
    if (!a) return null;
    return {
      ...a,
      id: a.id || a._id,
      fullName: a.fullName || a.full_name,
      dateOfBirth: a.dateOfBirth || a.dob,
      gender: a.gender?.toUpperCase() || a.gender,
      classApplyingFor: a.classApplyingFor || a.class?.name || a.class_applied || "",
      parentName: a.parentName || a.parent_name,
      parentContact: a.parentContact || a.parent_contact,
      address: a.address,
      status: normalizeWorkflowStatus(a.status) || "pending_review",
      admissionStatus: normalizeWorkflowStatus(a.admissionStatus || a.admission?.status),
      paymentStatus: normalizeWorkflowStatus(a.paymentStatus || a.payments?.[0]?.status),
      examStatus: normalizeWorkflowStatus(a.examStatus || a.examResults?.[0]?.result),
    };
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (!isHeadteacher) {
          if (!ignore) {
            setLoadError("You do not have permission to view this applicant.");
            setApplicant(null);
          }
          return;
        }

        const data = await applicantService.getHeadteacherApplicantById(id);
        if (!ignore) {
          setLoadError("");
          setApplicant(mapApplicantData(data));
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
  }, [id, isHeadteacher]);

  useEffect(() => {
    if (!isHeadteacher) return;
    let ignore = false;
    (async () => {
      try {
        const data = await listHeadteacherClasses();
        const items = Array.isArray(data) ? data : data.classes || data.items || data.data || [];
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
  }, [isHeadteacher, applicant, classAssigned]);

  useEffect(() => {
    if (!assignExamOpen || !isHeadteacher) return;
    let ignore = false;

    (async () => {
      setAssignExamLoading(true);
      setAssignExamError("");
      try {
        const items = normalizeExamItems(await listAllHeadteacherExams());

        const applicantClassName = String(applicant?.classApplyingFor || "").toLowerCase();
        const publishedItems = items.filter((exam) =>
          ["published", "active"].includes(String(exam?.status || "").toLowerCase())
        );

        const classMatchedItems = (publishedItems.length ? publishedItems : items).filter((exam) => {
          if (!applicantClassName) return true;
          const examClassName = String(exam?.class?.name || exam?.classLevel || "").toLowerCase();
          return !examClassName || examClassName === applicantClassName;
        });

        if (!ignore) {
          setAvailableExams(classMatchedItems);
        }
      } catch (error) {
        if (!ignore) {
          setAvailableExams([]);
          setAssignExamError(error?.response?.data?.message || "Failed to load available exams.");
        }
      } finally {
        if (!ignore) {
          setAssignExamLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [applicant?.classApplyingFor, assignExamOpen, isHeadteacher]);

  useEffect(() => {
    if (!initiatePaymentOpen || !isHeadteacher) return;
    let ignore = false;
    (async () => {
      setAvailablePaymentApplicants([]);
      try {
        const data = await applicantService.listHeadteacherApplicants({ limit: 1000 });
        const items = Array.isArray(data) ? data : data?.applicants || data?.items || data?.data || [];
        if (!ignore) {
          setAvailablePaymentApplicants(items);
        }
      } catch (error) {
        if (!ignore) {
          setPaymentError("Failed to load applicants for payment.");
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [initiatePaymentOpen, isHeadteacher]);

  useEffect(() => {
    if (!applicant?.id || !isHeadteacher) return;
    let ignore = false;

    (async () => {
      try {
        const data = await getParentForApplicant(applicant.id);
        const parent = data?.parent || null;
        if (!ignore) {
          setLinkedParent(parent);
          setSelectedParentId(parent?._id || parent?.id || "");
        }
      } catch {
        if (!ignore) {
          setLinkedParent(null);
          setSelectedParentId("");
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [applicant?.id, isHeadteacher]);

  useEffect(() => {
    if (!parentLinkOpen || !isHeadteacher) return;
    let ignore = false;

    (async () => {
      setParentLinkLoading(true);
      setParentLinkError("");
      try {
        const data = await listAllParentApplicantParents();
        const items = Array.isArray(data) ? data : data?.parents || data?.users || data?.items || data?.data || [];
        if (!ignore) setAvailableParents(items);
      } catch (error) {
        if (!ignore) {
          setAvailableParents([]);
          setParentLinkError(PARENT_OPTIONS_ERROR);
        }
      } finally {
        if (!ignore) setParentLinkLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [parentLinkOpen, isHeadteacher]);

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
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900/5 px-5 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => navigate("/applicants")}
            >
              Back to Applicants
            </button>
            {role === "headteacher" || role === "assistantHeadteacher" ? (
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900/5 px-5 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
                onClick={() => setEditOpen(true)}
              >
                Edit
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
              <div className="font-display text-2xl font-semibold text-slate-900">{applicant.fullName}</div>
              <div className="mt-1 text-sm text-slate-600">Created {formatDate(applicant.createdAt)}</div>
            </div>
            <Badge tone={statusTone(applicant.status)}>{statusLabel(applicant.status)}</Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Date of Birth</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{applicant.dateOfBirth || "-"}</div>
            </div>
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Gender</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{String(applicant.gender || "-")}</div>
            </div>
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Class Applying For</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{applicant.classApplyingFor || "-"}</div>
            </div>
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Parent Contact</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{applicant.parentContact || "-"}</div>
            </div>
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Parent Name</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{applicant.parentName || "-"}</div>
            </div>
            <div className="rounded-2xl bg-white/60 p-3 md:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Address</div>
              <div className="mt-1 text-sm text-slate-800">{applicant.address || "-"}</div>
            </div>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel>
            <div className="font-semibold text-slate-900">Exam</div>
            <div className="mt-2 text-sm text-slate-700">
              Latest result:{" "}
              <span className="font-semibold">
                {applicant.examResults?.[0]?.result || applicant.examStatus || "-"}
              </span>
            </div>
            {applicant.exam?.code ? (
              <div className="mt-2 text-sm text-slate-700">
                Entrance Exam ID: <span className="font-semibold">{applicant.exam.code}</span>
              </div>
            ) : null}
            {isHeadteacher ? (
              <button
                type="button"
                className="mt-3 inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                onClick={() => {
                  setAssignExamError("");
                  setSelectedExamId("");
                  setAssignExamOpen(true);
                }}
              >
                Assign to Exam
              </button>
            ) : null}
          </Panel>

          <Panel>
            <div className="font-semibold text-slate-900">Linked Parent Account</div>
            <div className="mt-2 text-sm text-slate-700">
              Parent:{" "}
              <span className="font-semibold">
                {linkedParent?.name || linkedParent?.username || linkedParent?.email || applicant.parentName || "-"}
              </span>
            </div>
            {linkedParent?.email ? (
              <div className="mt-1 text-sm text-slate-700">
                Email: <span className="font-semibold">{linkedParent.email}</span>
              </div>
            ) : null}
            {isHeadteacher ? (
              <button
                type="button"
                className="mt-3 inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                onClick={() => {
                  setParentLinkError("");
                  setParentLinkOpen(true);
                }}
              >
                {linkedParent ? "Change Parent Link" : "Link Parent"}
              </button>
            ) : null}
          </Panel>

          <Panel>
            <div className="font-semibold text-slate-900">Payment</div>
            <div className="mt-2 text-sm text-slate-700">
              Status:{" "}
              <span className="font-semibold">
                {applicant.payments?.[0]?.status || applicant.paymentStatus || "-"}
              </span>
            </div>
            {isHeadteacher ? (
              <button
                type="button"
                className="mt-3 inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                onClick={() => {
                  setPaymentError("");
                  setSelectedPaymentApplicantId(applicant.id);
                  setPaymentAmount("");
                  setInitiatePaymentOpen(true);
                }}
              >
                Initiate Payment
              </button>
            ) : null}
          </Panel>

          {role === "headteacher" ? (
            <Panel>
              <div className="font-semibold text-slate-900">Admission</div>
              <div className="mt-2 text-sm text-slate-700">
                Status: <span className="font-semibold">{applicant.admissionStatus || "-"}</span>
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
                    <div className="capitalize">{String(d.documentType || "").replaceAll("_", " ")}</div>
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

      <Modal open={editOpen} title="Edit Applicant" onClose={() => setEditOpen(false)}>
        <ApplicantForm
          classes={classes}
          initialValues={applicant}
          submitLabel="Save Changes"
          onSubmit={async (values) => {
            try {
              if (!isHeadteacher) {
                alert("You do not have permission to edit this applicant.");
                return;
              }

              const payload = {
                full_name: values.fullName,
                dob: values.dateOfBirth,
                gender: values.gender,
                class_applied: values.classApplyingFor,
                parent_name: values.parentName,
                parent_contact: values.parentContact,
                address: values.address,
              };
              await applicantService.updateHeadteacherApplicant(id, payload);
              const refreshed = await applicantService.getHeadteacherApplicantById(id);

              setApplicant(mapApplicantData(refreshed));
              setEditOpen(false);
            } catch {
              alert("Update failed.");
            }
          }}
        />
      </Modal>

      <Modal
        open={parentLinkOpen}
        title="Link Parent to Applicant"
        onClose={() => setParentLinkOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setParentLinkOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedParentId || parentLinkLoading}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              onClick={async () => {
                setParentLinkLoading(true);
                setParentLinkError("");
                try {
                  await linkParentToApplicant({ parentId: selectedParentId, applicantId: applicant.id });
                  const refreshedLink = await getParentForApplicant(applicant.id);
                  const nextParent = refreshedLink?.parent || null;
                  setLinkedParent(nextParent);
                  setSelectedParentId(nextParent?._id || nextParent?.id || selectedParentId);
                  setParentLinkOpen(false);
                } catch (error) {
                  setParentLinkError(PARENT_LINK_ERROR);
                } finally {
                  setParentLinkLoading(false);
                }
              }}
            >
              {parentLinkLoading ? "Saving..." : linkedParent ? "Update Link" : "Link Parent"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-700">
            Select the parent account to link with <span className="font-semibold text-slate-900">{applicant.fullName}</span>.
          </div>
          <select
            value={selectedParentId}
            onChange={(e) => setSelectedParentId(e.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-[color:var(--brand)]"
            disabled={parentLinkLoading}
          >
            <option value="">Select parent...</option>
            {availableParents.map((parent) => {
              const parentId = parent._id || parent.id;
              const label = parent.name || parent.username || parent.email || parentId;
              return (
                <option key={parentId} value={parentId}>
                  {label}
                </option>
              );
            })}
          </select>
          {parentLinkError ? <div className="text-sm text-rose-700">{parentLinkError}</div> : null}
          {!parentLinkLoading && availableParents.length === 0 ? (
            <div className="text-sm text-slate-500">No parent accounts found.</div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={assignExamOpen}
        title="Assign Applicant to Exam"
        onClose={() => setAssignExamOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setAssignExamOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedExamId || assignExamLoading}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              onClick={async () => {
                setAssignExamLoading(true);
                setAssignExamError("");
                try {
                  await assignHeadteacherExam(selectedExamId, { applicants: [id] });
                  const refreshed = await applicantService.getHeadteacherApplicantById(id);
                  setApplicant(mapApplicantData(refreshed));
                  setAssignExamOpen(false);
                } catch (error) {
                  setAssignExamError(error?.response?.data?.message || "Failed to assign applicant to exam.");
                } finally {
                  setAssignExamLoading(false);
                }
              }}
            >
              {assignExamLoading ? "Assigning..." : "Assign Exam"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-700">
            Select an available exam for <span className="font-semibold text-slate-900">{applicant.fullName}</span>.
          </div>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-[color:var(--brand)]"
            disabled={assignExamLoading}
          >
            <option value="">Select exam...</option>
            {availableExams.map((exam) => (
              <option key={exam._id || exam.id} value={exam._id || exam.id}>
                {exam.title} ({String(exam.status || "draft").toUpperCase()})
              </option>
            ))}
          </select>
          {assignExamError ? <div className="text-sm text-rose-700">{assignExamError}</div> : null}
          {!assignExamLoading && availableExams.length === 0 ? (
            <div className="text-sm text-slate-500">No available exams found.</div>
          ) : null}
        </div>
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
            const refreshed = await applicantService.getHeadteacherApplicantById(id);
            setApplicant(mapApplicantData(refreshed));
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

      <Modal
        open={initiatePaymentOpen}
        title="Initiate Payment"
        onClose={() => setInitiatePaymentOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setInitiatePaymentOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedPaymentApplicantId || !paymentAmount || paymentInitLoading}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              onClick={async () => {
                setPaymentInitLoading(true);
                setPaymentError("");
                try {
                  const amountInSubUnits = Number(paymentAmount) * 100;
                  const res = await initializeAdmissionPayment(selectedPaymentApplicantId, amountInSubUnits);
                  
                  const authUrl = res?.data?.authorizationUrl || res?.authorizationUrl || res?.data?.authorization_url || res?.authorization_url;
                  const reference = res?.data?.reference || res?.reference;
                  
                  if (authUrl) {
                    window.location.href = authUrl;
                  } else if (reference) {
                    // Route directly to our verification page using the reference
                    window.location.href = `/payments/verify?reference=${reference}`;
                  } else {
                    setPaymentError("Could not retrieve payment link.");
                    setPaymentInitLoading(false);
                  }
                } catch (error) {
                  setPaymentError(error?.response?.data?.message || "Failed to initiate payment.");
                  setPaymentInitLoading(false);
                }
              }}
            >
              {paymentInitLoading ? "Processing..." : "Proceed to Payment"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-700">
            Select an applicant to initialize the admission fee payment. You will be redirected to Paystack.
          </div>
          <select
            value={selectedPaymentApplicantId}
            onChange={(e) => setSelectedPaymentApplicantId(e.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-[color:var(--brand)]"
            disabled={paymentInitLoading}
          >
            <option value="">Select applicant...</option>
            {availablePaymentApplicants.map((a) => {
              const aId = a._id || a.id;
              const label = `${a.fullName || a.full_name || aId} - ${a.status || "Pending"}`;
              return (
                <option key={aId} value={aId}>
                  {label}
                </option>
              );
            })}
          </select>
          <input
            type="number"
            min="1"
            placeholder="Enter Amount (GHS)"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-[color:var(--brand)]"
            disabled={paymentInitLoading}
          />
          {paymentError ? <div className="text-sm text-rose-700">{paymentError}</div> : null}
          {!paymentInitLoading && availablePaymentApplicants.length === 0 ? (
             <div className="text-sm text-slate-500">Loading applicants...</div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

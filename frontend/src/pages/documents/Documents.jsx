import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import DocumentUpload from "../../components/forms/DocumentUpload";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { formatDate } from "../../utils/helpers";
import * as documentService from "../../services/documentService";
import * as applicantService from "../../services/applicantService";
import { useAuth } from "../../context/AuthContext";
import { listStudents } from "../../services/studentService";

export default function Documents() {
  const [rows, setRows] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [selectedApplicantId, setSelectedApplicantId] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const { role } = useAuth();

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const aPromise =
          role === "parent" ? Promise.resolve({ items: [] }) : applicantService.listApplicants();
        const sPromise = role === "parent" ? listStudents() : Promise.resolve({ items: [] });
        const [a, s, d] = await Promise.all([aPromise, sPromise, documentService.listDocuments()]);

        const aItems = Array.isArray(a) ? a : a.items || [];
        if (!ignore) setApplicants(aItems || []);

        const sItems = Array.isArray(s) ? s : s.items || [];
        if (!ignore) setStudents(sItems || []);

        const data = d;
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) setRows(items);
      } catch {
        if (!ignore) {
          setRows([]);
          setApplicants([]);
          setStudents([]);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [role]);

  useEffect(() => {
    let ignore = false;
    if (role === "parent") {
      if (!selectedStudentId) return;
      (async () => {
        try {
          const s = students.find((x) => String(x._id || x.id) === String(selectedStudentId));
          const applicantId = s?.applicant;
          const data = applicantId
            ? await documentService.listDocuments({ applicantId })
            : await documentService.listDocuments();
          const items = Array.isArray(data) ? data : data.items || [];
          if (!ignore) setRows(items);
        } catch {
          /* ignore */
        }
      })();
      return () => {
        ignore = true;
      };
    }

    if (!selectedApplicantId) return;
    (async () => {
      try {
        const data = await documentService.listDocuments({ applicantId: selectedApplicantId });
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) setRows(items);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      ignore = true;
    };
  }, [selectedApplicantId, selectedStudentId, role, students]);

  const columns = useMemo(
    () => [
      {
        key: "applicant",
        header: "Applicant",
        render: (r) => r.applicant?.fullName || "--",
      },
      {
        key: "documentType",
        header: "Document Type",
        render: (r) => String(r.documentType || "--").replaceAll("_", " "),
      },
      { key: "originalName", header: "File" },
      { key: "createdAt", header: "Uploaded", render: (r) => formatDate(r.createdAt || r.uploadedAt) },
      {
        key: "status",
        header: "Status",
        render: (r) => (
          <Badge tone={r.verified ? "success" : "warning"}>{r.verified ? "verified" : "uploaded"}</Badge>
        ),
      },
      ...(role === "assistantHeadteacher" || role === "headteacher"
        ? [
            {
              key: "actions",
              header: "Actions",
              render: (r) =>
                r.verified ? (
                  <span className="text-xs text-slate-500">--</span>
                ) : (
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-2xl bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                    onClick={async () => {
                      try {
                        await documentService.verifyDocument(r._id || r.id);
                        const data = await documentService.listDocuments(
                          selectedApplicantId ? { applicantId: selectedApplicantId } : undefined
                        );
                        const items = Array.isArray(data) ? data : data.items || [];
                        setRows(items);
                      } catch {
                        alert("Verify failed.");
                      }
                    }}
                  >
                    Verify
                  </button>
                ),
            },
          ]
        : []),
    ],
    [role, selectedApplicantId]
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Documents" subtitle="Upload and manage applicant documents." />
      <Panel className="p-5">
        <div className="font-display text-lg font-semibold text-slate-900">Upload Document</div>
        <div className="mt-1 text-sm text-slate-600">Submit to `POST /api/documents/upload`.</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {role === "parent" ? (
            <div>
              <label className="text-sm font-semibold text-slate-800">Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              >
                <option value="">Select admitted student...</option>
                {students.map((s) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.fullName} ({s.classAssigned?.name || "—"})
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-slate-600">
                Parents can upload documents only after admission.
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-semibold text-slate-800">Applicant</label>
              <select
                value={selectedApplicantId}
                onChange={(e) => setSelectedApplicantId(e.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              >
                <option value="">Select applicant...</option>
                {applicants.map((a) => (
                  <option key={a.id || a._id} value={a.id || a._id}>
                    {a.fullName} ({a.classApplyingFor})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4">
          <DocumentUpload
            onSubmit={async ({ documentType, file }) => {
              const f = file?.[0];
              if (!f) return;
              if (role === "parent" && !selectedStudentId) {
                alert("Select an admitted student first.");
                return;
              }
              if (role !== "parent" && !selectedApplicantId) {
                alert("Select an applicant first.");
                return;
              }
              try {
                const created = await documentService.uploadDocument({
                  applicantId: role === "parent" ? undefined : selectedApplicantId,
                  studentId: role === "parent" ? selectedStudentId : undefined,
                  documentType,
                  file: f,
                });
                setRows((r) => [created, ...r]);
              } catch {
                alert("Upload failed. Ensure the student is admitted and try again.");
              }
            }}
          />
        </div>
      </Panel>

      <Table title="Uploaded Documents" rows={rows} columns={columns} />
    </div>
  );
}

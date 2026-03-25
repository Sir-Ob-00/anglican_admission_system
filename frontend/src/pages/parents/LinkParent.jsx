import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Table from "../../components/common/Table";
import { useAuth } from "../../context/AuthContext";
import {
  getApplicantsForParent,
  getParentForApplicant,
  linkParentToApplicant,
  listAllParentApplicantApplicants,
  listAllParentApplicantParents,
} from "../../services/parentService";

function normalizeApplicants(data) {
  const items = Array.isArray(data) ? data : data?.applicants || data?.items || data?.data || [];
  return items.map((a) => ({
    ...a,
    id: a.id || a._id,
    fullName: a.fullName || a.full_name,
    classApplyingFor: a.classApplyingFor || a.class?.name || a.class_applied || "-",
    status: String(a.status || "").toLowerCase(),
  }));
}

const PARENT_LOAD_ERROR = "Unable to load parent and applicant options right now.";
const PARENT_LINK_ERROR = "Unable to link the selected parent to this applicant right now.";

export default function LinkParent() {
  const { role } = useAuth();
  const allowed =
    role === "headteacher" ||
    role === "assistant_headteacher" ||
    role === "assistantHeadteacher";

  const [parents, setParents] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [selectedApplicantId, setSelectedApplicantId] = useState("");
  const [linkedParentsByApplicant, setLinkedParentsByApplicant] = useState({});
  const [selectedParentApplicants, setSelectedParentApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [parentData, applicantData] = await Promise.all([
        listAllParentApplicantParents(),
        listAllParentApplicantApplicants(),
      ]);

      const parentItems = Array.isArray(parentData)
        ? parentData
        : parentData?.parents || parentData?.users || parentData?.items || parentData?.data || [];
      const applicantItems = normalizeApplicants(applicantData);

      setParents(parentItems);
      setApplicants(applicantItems);

      const linkEntries = await Promise.all(
        applicantItems.map(async (applicant) => {
          try {
            const data = await getParentForApplicant(applicant.id);
            return [applicant.id, data?.parent || null];
          } catch {
            return [applicant.id, null];
          }
        })
      );

      setLinkedParentsByApplicant(Object.fromEntries(linkEntries));
    } catch (loadError) {
      setParents([]);
      setApplicants([]);
      setLinkedParentsByApplicant({});
      setError(PARENT_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!allowed) return;
    loadData();
  }, [allowed]);

  useEffect(() => {
    if (!selectedParentId || !allowed) {
      setSelectedParentApplicants([]);
      return;
    }

    let ignore = false;

    (async () => {
      try {
        const data = await getApplicantsForParent(selectedParentId);
        const items = normalizeApplicants(data?.applicants || data);
        if (!ignore) setSelectedParentApplicants(items);
      } catch {
        if (!ignore) setSelectedParentApplicants([]);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [selectedParentId, allowed]);

  const columns = useMemo(
    () => [
      {
        key: "fullName",
        header: "Applicant",
        render: (row) => (
          <Link to={`/applicants/${row.id}`} className="font-semibold text-slate-900 hover:underline">
            {row.fullName}
          </Link>
        ),
      },
      { key: "classApplyingFor", header: "Class" },
      {
        key: "linkedParent",
        header: "Linked Parent",
        render: (row) => {
          const parent = linkedParentsByApplicant[row.id];
          return parent?.name || parent?.username || parent?.email || "Not linked";
        },
      },
      {
        key: "status",
        header: "Status",
        render: (row) => String(row.status || "pending_review").replaceAll("_", " "),
      },
    ],
    [linkedParentsByApplicant]
  );

  if (!allowed) {
    return (
      <div className="space-y-4">
        <PageHeader title="Link Parents" subtitle="Link parent accounts to applicants." />
        <Panel className="p-5">
          <div className="text-sm text-slate-600">Access denied.</div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Link Parents" subtitle="Choose a parent account and an applicant, then link them." />

      <Panel className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-800">Parent Account</label>
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-[color:var(--brand)]"
              disabled={loading || submitting}
            >
              <option value="">Select parent...</option>
              {parents.map((parent) => {
                const parentId = parent._id || parent.id;
                const label = parent.name || parent.username || parent.email || parentId;
                return (
                  <option key={parentId} value={parentId}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Applicant</label>
            <select
              value={selectedApplicantId}
              onChange={(e) => setSelectedApplicantId(e.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-sm text-slate-900 outline-none focus:border-[color:var(--brand)]"
              disabled={loading || submitting}
            >
              <option value="">Select applicant...</option>
              {applicants.map((applicant) => (
                <option key={applicant.id} value={applicant.id}>
                  {applicant.fullName} ({applicant.classApplyingFor})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!selectedParentId || !selectedApplicantId || submitting}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
            onClick={async () => {
              setSubmitting(true);
              setMessage("");
              setError("");
              try {
                await linkParentToApplicant({
                  parentId: selectedParentId,
                  applicantId: selectedApplicantId,
                });
                const refreshedLink = await getParentForApplicant(selectedApplicantId);
                setLinkedParentsByApplicant((current) => ({
                  ...current,
                  [selectedApplicantId]: refreshedLink?.parent || null,
                }));
                setMessage("Parent linked successfully.");
              } catch (submitError) {
                setError(PARENT_LINK_ERROR);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Linking..." : "Link Parent"}
          </button>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900/5 px-5 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
            onClick={() => {
              setSelectedParentId("");
              setSelectedApplicantId("");
              setMessage("");
              setError("");
            }}
          >
            Clear
          </button>
        </div>

        {message ? <div className="text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="text-sm text-rose-700">{error}</div> : null}
      </Panel>

      {selectedParentId ? (
        <Panel className="space-y-3">
          <div className="font-semibold text-slate-900">Applicants Linked to Selected Parent</div>
          {selectedParentApplicants.length ? (
            <div className="grid gap-2">
              {selectedParentApplicants.map((applicant) => (
                <Link
                  key={applicant.id}
                  to={`/applicants/${applicant.id}`}
                  className="rounded-2xl bg-white/60 px-4 py-3 text-sm text-slate-800 hover:bg-white/80"
                >
                  <span className="font-semibold text-slate-900">{applicant.fullName}</span>
                  <span className="ml-2 text-slate-600">({applicant.classApplyingFor})</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No applicants linked to this parent yet.</div>
          )}
        </Panel>
      ) : null}

      <Table
        title="Applicant Parent Links"
        rows={applicants}
        columns={columns}
        loading={loading}
        loadingText="Loading parent links..."
      />
    </div>
  );
}

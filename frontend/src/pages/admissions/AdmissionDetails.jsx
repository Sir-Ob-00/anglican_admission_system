import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import Badge from "../../components/common/Badge";
import { getAdmission } from "../../services/admissionService";
import { formatDate } from "../../utils/helpers";

export default function AdmissionDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getAdmission(id);
        if (!ignore) setItem(data);
      } catch {
        if (!ignore) setItem(null);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  return (
    <div className="space-y-4">
      <PageHeader title="Admission Details" subtitle="Admission record details." />
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-display text-xl font-semibold text-slate-900">Admission {id}</div>
            <div className="mt-1 text-sm text-slate-600">
              Data from `GET /api/admissions/:id`.
            </div>
          </div>
          <Badge tone={item ? "success" : "warning"}>{item ? "Loaded" : "No data"}</Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-white/60 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Applicant</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {item?.applicant?.fullName || "—"}
            </div>
          </div>
          <div className="rounded-2xl bg-white/60 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Decision</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">Admitted</div>
          </div>
          <div className="rounded-2xl bg-white/60 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Admission No.</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {item?.admissionNumber || "—"}
            </div>
          </div>
          <div className="rounded-2xl bg-white/60 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Approved</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {formatDate(item?.approvedAt || item?.createdAt)}
            </div>
          </div>
          <div className="rounded-2xl bg-white/60 p-3 md:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">Notes</div>
            <div className="mt-1 text-sm text-slate-800">
              Admission record details for this applicant.
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, CartesianGrid } from "recharts";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import { getReports } from "../../services/reportService";
import { useAuth } from "../../context/AuthContext";
import { listApplicants } from "../../services/applicantService";
import { listPayments } from "../../services/paymentService";
import { downloadAdmissionConfirmation } from "../../services/admissionService";
import { formatDate } from "../../utils/helpers";

export default function Reports() {
  const [report, setReport] = useState(null);
  const { role } = useAuth();
  const [myApplicants, setMyApplicants] = useState([]);
  const [myPayments, setMyPayments] = useState([]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getReports();
        if (!ignore) setReport(data);
      } catch {
        if (!ignore) setReport(null);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (role !== "parent") return;
    let ignore = false;
    (async () => {
      try {
        const [a, p] = await Promise.all([listApplicants(), listPayments()]);
        const aItems = Array.isArray(a) ? a : a.items || [];
        const pItems = Array.isArray(p) ? p : p.items || [];
        if (!ignore) {
          setMyApplicants(aItems);
          setMyPayments(pItems);
        }
      } catch {
        if (!ignore) {
          setMyApplicants([]);
          setMyPayments([]);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [role]);

  const byClass = useMemo(
    () => [
      ...(report?.applicantsByClass || []).map((x) => ({ name: x.class, value: x.count })),
    ],
    [report]
  );

  const payments = useMemo(
    () => [
      { name: "Total", total: (report?.paymentsSummary?.total || 0) / 1_000_000 },
    ],
    [report]
  );

  const colors = ["rgba(11,59,122,.75)", "rgba(10,159,141,.75)", "rgba(202,162,75,.8)", "rgba(15,23,42,.55)", "rgba(148,163,184,.8)"];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports"
        subtitle="Applicants by class, exam performance, admissions statistics, and payments summary."
      />

      {role === "parent" ? (
        <Panel className="p-5">
          <div className="font-display text-lg font-semibold text-slate-900">My Downloads</div>
          <div className="mt-2 text-sm text-slate-700">
            Download your admission confirmation (after admission) and view payment history.
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-3xl bg-white/60 p-4">
              <div className="font-semibold text-slate-900">Admission Confirmation</div>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                {myApplicants.length ? (
                  myApplicants.map((a) => (
                    <div key={a._id || a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/70 p-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">{a.fullName}</div>
                        <div className="text-xs text-slate-600">
                          Status: {String(a.status || "—").replaceAll("_", " ")} · {formatDate(a.createdAt)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-3 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
                        disabled={String(a.status || "") !== "admitted"}
                        onClick={() => {
                          (async () => {
                            try {
                              const blob = await downloadAdmissionConfirmation(a._id || a.id);
                              const url = URL.createObjectURL(blob);
                              const el = document.createElement("a");
                              el.href = url;
                              el.download = `admission_confirmation_${a.fullName.replaceAll(" ", "_")}.txt`;
                              document.body.appendChild(el);
                              el.click();
                              el.remove();
                              URL.revokeObjectURL(url);
                            } catch {
                              alert("Download failed.");
                            }
                          })();
                        }}
                      >
                        Download
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600">No applicants linked to your account.</div>
                )}
              </div>
              <div className="mt-2 text-xs text-slate-600">
                Download is enabled only after your child is admitted.
              </div>
            </div>

            <div className="rounded-3xl bg-white/60 p-4">
              <div className="font-semibold text-slate-900">Payment History</div>
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                {myPayments.length ? (
                  myPayments.slice(0, 8).map((p) => (
                    <div key={p._id || p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/70 p-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">
                          {p.applicant?.fullName || "Payment"}
                        </div>
                        <div className="text-xs text-slate-600">
                          {String(p.status || "—").toUpperCase()} · {formatDate(p.paidAt || p.createdAt)}
                        </div>
                      </div>
                      <div className="text-xs text-slate-600">{p.reference || "—"}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-600">No payments found.</div>
                )}
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel className="p-4">
          <div className="font-display text-lg font-semibold text-slate-900">Applicants by class</div>
          <div className="mt-1 text-sm text-slate-600">
           Showing applicants of an assigned class.
          </div>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie
                  data={byClass.length ? byClass : [{ name: "No data", value: 1 }]}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={105}
                  innerRadius={60}
                  paddingAngle={3}
                >
                  {byClass.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="p-4">
          <div className="font-display text-lg font-semibold text-slate-900">Payments summary (₦M)</div>
          <div className="mt-1 text-sm text-slate-600">Live total verified payments.</div>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payments}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,.08)" />
                <XAxis dataKey="name" stroke="rgba(71,85,105,.9)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="total" fill="rgba(10,159,141,.75)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <div className="font-display text-lg font-semibold text-slate-900">Show Reports</div>
        <div className="mt-2 text-sm text-slate-700">
          Showing all reports.
        </div>
      </Panel>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Panel from "../../components/common/Panel";
import { getAssistantDashboard, getDashboardSummary, getHeadteacherDashboard, getTeacherDashboard, getParentDashboard } from "../../services/dashboardService";
import { formatDate } from "../../utils/helpers";
import { initializeAdmissionPayment } from "../../services/paymentService";

function IconUsers(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconSchool(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 10l9-6 9 6-9 6-9-6Z" />
      <path d="M5 12v6c0 2 3 4 7 4s7-2 7-4v-6" />
    </svg>
  );
}
function IconBriefcase(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 12h18" />
    </svg>
  );
}
function IconLayers(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 2l9 5-9 5-9-5 9-5Z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </svg>
  );
}
function IconCard(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h6" />
    </svg>
  );
}
function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function IconClipboard(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="M8 11h8" />
      <path d="M8 15h6" />
    </svg>
  );
}
function IconChart(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 6-6" />
    </svg>
  );
}

function iconForTitle(title) {
  const t = String(title || "").toLowerCase();
  if (t.includes("applicant")) return IconUsers;
  if (t.includes("parent")) return IconUsers;
  if (t.includes("student")) return IconSchool;
  if (t.includes("teacher")) return IconBriefcase;
  if (t.includes("class")) return IconLayers;
  if (t.includes("payment")) return IconCard;
  if (t.includes("notification")) return IconBell;
  if (t.includes("admission")) return IconCheck;
  if (t.includes("rate")) return IconChart;
  if (t.includes("review") || t.includes("exam") || t.includes("result")) return IconClipboard;
  if (t.includes("activity") || t.includes("log")) return IconClipboard;
  return null;
}

function roleCards(role) {
  switch (role) {
    case "admin":
      return [
        { title: "Total Applicants", value: "0", tone: "brand" },
        { title: "Total Students", value: "0", tone: "teal" },
        { title: "Total Teachers", value: "0", tone: "gold" },
        { title: "Total Parents", value: "0", tone: "neutral" },
        { title: "Total Payments", value: "0", tone: "teal" },
        { title: "Total Classes", value: "0", tone: "brand" },
      ];
    case "headteacher":
      return [
        { title: "Applicants Pending Review", value: "0", tone: "brand" },
        { title: "Exams Pending", value: "0", tone: "gold" },
        { title: "Admissions Completed", value: "0", tone: "teal" },
        { title: "Payments Completed", value: "0", tone: "brand" },
      ];
    case "assistantHeadteacher":
      return [
        { title: "Awaiting Exam", value: "0", tone: "gold" },
        { title: "Results Pending", value: "0", tone: "brand" },
        { title: "Awaiting Confirmation", value: "0", tone: "teal" },
      ];
    case "teacher":
      return [
        { title: "Assigned Exams", value: "0", tone: "brand" },
        { title: "Pending Submissions", value: "0", tone: "gold" },
        { title: "Students in Class", value: "0", tone: "teal" },
      ];
    default:
      return [
        { title: "Applicant Status", value: "--", tone: "brand" },
        { title: "Payment Status", value: "--", tone: "gold" },
        { title: "Documents Uploaded", value: "0", tone: "teal" },
      ];
  }
}

export default function Dashboard() {
  const { role } = useAuth();
  const [summary, setSummary] = useState(null);
  const [head, setHead] = useState(null);
  const [assistant, setAssistant] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePayAdmissionFee = async (applicantId) => {
    try {
      setLoading(true);
      const response = await initializeAdmissionPayment(applicantId);
      // Redirect to Paystack payment page
      window.location.href = response.authorization_url;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to initialize payment";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (role === "headteacher") {
          const data = await getHeadteacherDashboard();
          if (!ignore) setHead(data);
        } else if (role === "assistantHeadteacher") {
          const data = await getAssistantDashboard();
          if (!ignore) setAssistant(data);
        } else if (role === "teacher") {
          const data = await getTeacherDashboard();
          if (!ignore) setTeacher(data);
        } else if (role === "parent") {
          const data = await getParentDashboard();
          if (!ignore) setParent(data);
        } else {
          const data = await getDashboardSummary();
          if (!ignore) setSummary(data);
        }
      } catch {
        if (!ignore) {
          setSummary(null);
          setHead(null);
          setAssistant(null);
          setTeacher(null);
          setParent(null);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [role]);

  const chartData = useMemo(() => {
    // For admin role, use summary data
    if (role === "admin" && summary) {
      const applicants = Array.isArray(summary.applicantsByClass) ? summary.applicantsByClass : [];
      const admissions = Array.isArray(summary.admissionsByClass) ? summary.admissionsByClass : [];
      const byClass = new Map();

      for (const a of applicants) {
        const key = a.class || "Unspecified";
        const existing = byClass.get(key) || { name: key, applicants: 0, admitted: 0 };
        existing.applicants = Number(a.count || 0);
        byClass.set(key, existing);
      }
      for (const a of admissions) {
        const key = a.class || "Unspecified";
        const existing = byClass.get(key) || { name: key, applicants: 0, admitted: 0 };
        existing.admitted = Number(a.count || 0);
        byClass.set(key, existing);
      }

      return Array.from(byClass.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    // For headteacher role, use head data
    if (role === "headteacher" && head) {
      const applicants = Array.isArray(head.applicantsByClass) ? head.applicantsByClass : [];
      const admissions = Array.isArray(head.admissionsByClass) ? head.admissionsByClass : [];
      const byClass = new Map();

      for (const a of applicants) {
        const key = a.class || "Unspecified";
        const existing = byClass.get(key) || { name: key, applicants: 0, admitted: 0 };
        existing.applicants = Number(a.count || 0);
        byClass.set(key, existing);
      }
      for (const a of admissions) {
        const key = a.class || "Unspecified";
        const existing = byClass.get(key) || { name: key, applicants: 0, admitted: 0 };
        existing.admitted = Number(a.count || 0);
        byClass.set(key, existing);
      }

      return Array.from(byClass.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    // For other roles, return empty array to prevent errors
    return [];
  }, [role, summary, head, assistant, teacher, parent]);

  const cards = useMemo(() => {
    if (role === "headteacher" && head) {
      return [
        { title: "Total Applicants", value: String(head.totals?.totalApplicants || 0), tone: "brand" },
        { title: "Pending Review", value: String(head.workflow?.pendingReview || 0), tone: "gold" },
        { title: "Exams Pending", value: String(head.workflow?.examsPending || 0), tone: "neutral" },
        { title: "Payments Completed", value: String(head.workflow?.paymentsCompleted || 0), tone: "teal" },
        { title: "Total Students", value: String(head.totals?.totalStudents || 0), tone: "brand" },
        { title: "Total Teachers", value: String(head.totals?.totalTeachers || 0), tone: "gold" },
        { title: "Total Parents", value: String(head.totals?.totalParents || 0), tone: "neutral" },
        { title: "Total Classes", value: String(head.totals?.totalClasses || 0), tone: "teal" },
        { title: "Total Payments", value: String(head.totals?.totalPayments || 0), tone: "brand" },
      ];
    }

    if (role === "assistantHeadteacher" && assistant) {
      return [
        { title: "Total Applicants", value: String(assistant.totals?.totalApplicants || 0), tone: "brand" },
        { title: "Applicants Waiting Exam", value: String(assistant.workflow?.waitingExam || 0), tone: "gold" },
        { title: "Exams Conducted", value: String(assistant.workflow?.examsConducted || 0), tone: "teal" },
        { title: "Pending Exam Reviews", value: String(assistant.workflow?.pendingExamReviews || 0), tone: "neutral" },
        { title: "Payments Pending", value: String(assistant.workflow?.paymentsPending || 0), tone: "brand" },
        { title: "Teachers", value: String(assistant.totals?.teachers || 0), tone: "gold" },
        { title: "Students", value: String(assistant.totals?.totalStudents || 0), tone: "teal" },
      ];
    }

    if (role === "teacher" && teacher) {
      return [
        { title: "Total students", value: String(teacher.totals?.students || 0), tone: "brand" },
        {
          title: "Assigned Class",
          value: teacher.teacher?.assignedClass?.name || "Unassigned",
          tone: "teal",
        },
        {
          title: "Total Students in assigned",
          value: String(teacher.workflow?.studentsInAssignedClass || 0),
          tone: "gold",
        },
        { title: "Assigned Exams", value: String(teacher.workflow?.assignedExams || 0), tone: "neutral" },
        { title: "Exams Completed", value: String(teacher.workflow?.examsCompleted || 0), tone: "brand" },
        { title: "Applicants Assigned", value: String(teacher.workflow?.applicantsAssigned || 0), tone: "teal" },
      ];
    }

    if (role === "parent" && parent) {
      const latest = parent.latestApplicant;
      const status = latest?.status ? String(latest.status).replaceAll("_", " ") : "—";
      return [
        { title: "Application Status", value: latest ? status.toUpperCase() : "NO APPLICATION", tone: "brand" },
        {
          title: "Admission Fee Status",
          value:
            latest?.paymentStatus === "payment_completed"
              ? "PAID"
              : latest?.paymentStatus === "awaiting_payment"
                ? "PENDING"
                : "—",
          tone: "gold",
        },
        {
          title: "Admission Decision",
          value: latest?.status === "admitted" ? "ADMITTED" : latest?.status === "rejected" ? "REJECTED" : "PENDING",
          tone: latest?.status === "admitted" ? "teal" : latest?.status === "rejected" ? "gold" : "brand",
        },
        { title: "Class of Student", value: latest?.assignedClass || latest?.classApplyingFor || "—", tone: "neutral" },
        { title: "Name of Teacher of student", value: latest?.teacherName || "—", tone: "teal" },
      ];
    }

    if (!summary) return roleCards(role);

    if (role === "admin") {
      return [
        { title: "Total Applicants", value: String(summary.totals?.totalApplicants || 0), tone: "brand" },
        { title: "Total Students", value: String(summary.totals?.totalStudents || 0), tone: "teal" },
        { title: "Total Teachers", value: String(summary.totals?.totalTeachers || 0), tone: "gold" },
        { title: "Total Parents", value: String(summary.totals?.totalParents || 0), tone: "neutral" },
        { title: "Total Classes", value: String(summary.totals?.totalClasses || 0), tone: "brand" },
        { title: "Total Payments", value: String(summary.totals?.totalPayments || 0), tone: "teal" },
        { title: "Admission Rate", value: `${summary.workflow?.admissionRate || 0}%`, tone: "gold" },
      ];
    }

    return roleCards(role);
  }, [role, summary, head, assistant, teacher, parent]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of applicants, exams, admissions, payments, and activity."
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <StatCard
            key={c.title}
            title={c.title}
            value={c.value}
            hint={c.hint}
            tone={c.tone}
            icon={iconForTitle(c.title)}
          />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel className="p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="font-display text-lg font-semibold text-slate-900">
                Applicants vs Admissions
              </div>
              <div className="text-sm text-slate-600">By class.</div>
            </div>
            <div className="text-xs text-slate-600">Chart.js-ready, using Recharts here</div>
          </div>

          <div className="mt-4 h-[280px]">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,.08)" />
                  <XAxis dataKey="name" stroke="rgba(71,85,105,.9)" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="applicants" fill="rgba(37,99,235,.75)" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="admitted" fill="rgba(10,159,141,.75)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl bg-white/60 text-sm text-slate-600">
                No chart data yet.
              </div>
            )}
          </div>
        </Panel>

        <Panel className="p-4">
          {role === "parent" && parent?.latestApplicant ? (
            <>
              <div className="font-display text-lg font-semibold text-slate-900">Payment Actions</div>
              <div className="mt-3 space-y-3">
                <div className="rounded-2xl bg-white/60 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {parent.latestApplicant.fullName}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Payment Status: {parent.latestApplicant.paymentStatus === 'payment_completed' ? 'Paid ✅' : 'Not Paid ❌'}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Debug: Status="{parent.latestApplicant.status}", PaymentStatus="{parent.latestApplicant.paymentStatus}", ID="{parent.latestApplicant._id}"
                      </div>
                    </div>
                    {parent.latestApplicant.paymentStatus !== 'payment_completed' && (
                      <button
                        onClick={() => handlePayAdmissionFee(parent.latestApplicant._id)}
                        disabled={loading}
                        className="inline-flex h-9 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
                      >
                        {loading ? 'Processing...' : 'Pay Admission Fee'}
                      </button>
                    )}
                  </div>
                </div>
                {parent.latestApplicant.paymentStatus === 'payment_completed' && (
                  <div className="rounded-2xl bg-green-50 p-3 text-sm text-green-800">
                    ✅ Payment completed! Admission fee has been received.
                  </div>
                )}
              </div>
            </>
          ) : role === "parent" ? (
            <>
              <div className="font-display text-lg font-semibold text-slate-900">Payment Actions</div>
              <div className="mt-3 rounded-2xl bg-white/60 p-3 text-sm text-slate-600">
                Debug: No latestApplicant found. Parent data: {JSON.stringify(parent, null, 2)}
              </div>
            </>
          ) : role === "admin" ? (
            <>
              <div className="font-display text-lg font-semibold text-slate-900">Next actions</div>
              <div className="mt-2 grid gap-2 text-sm text-slate-700">
                <div className="rounded-2xl bg-white/60 p-3">
                  Review applicants in <span className="font-semibold">Pending Review</span>.
                </div>
                <div className="rounded-2xl bg-white/60 p-3">
                  Schedule entrance exams and publish questions for the next cohort.
                </div>
                <div className="rounded-2xl bg-white/60 p-3">
                  Follow up on <span className="font-semibold">Awaiting Payment</span> families.
                </div>
                <div className="rounded-2xl bg-white/60 p-3">
                  Upload missing documents to unblock admissions decisions.
                </div>
              </div>
            </>
          ) : role === "headteacher" && head ? (
            <>
              <div className="font-display text-lg font-semibold text-slate-900">Recent Activity</div>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {(head?.recentActivity || []).length ? (
                  head.recentActivity.map((a) => (
                    <div key={a._id} className="rounded-2xl bg-white/60 p-3">
                      <div className="font-semibold text-slate-900">{a.action || 'Unknown action'}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {a.user?.name || "System"} · {formatDate(a.timestamp)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white/60 p-3 text-slate-600">No recent activity.</div>
                )}
              </div>
            </>
          ) : role === "assistantHeadteacher" && assistant ? (
            <>
              <div className="font-display text-lg font-semibold text-slate-900">Recent actions</div>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {(assistant?.recentActions || []).length ? (
                  assistant.recentActions.map((a) => (
                    <div key={a._id} className="rounded-2xl bg-white/60 p-3">
                      <div className="font-semibold text-slate-900">{a.action || 'Unknown action'}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {a.user?.name || "System"} · {formatDate(a.timestamp)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white/60 p-3 text-slate-600">No recent actions.</div>
                )}
              </div>
            </>
          ) : role === "teacher" && teacher ? (
            <>
              <div className="font-display text-lg font-semibold text-slate-900">Recent action</div>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {(teacher?.recentActions || []).length ? (
                  teacher.recentActions.map((a) => (
                    <div key={a._id} className="rounded-2xl bg-white/60 p-3">
                      <div className="font-semibold text-slate-900">{a.action || 'Unknown action'}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {a.user?.name || "System"} · {formatDate(a.timestamp)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white/60 p-3 text-slate-600">No recent actions.</div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="font-display text-lg font-semibold text-slate-900">Next actions</div>
              <div className="mt-2 grid gap-2 text-sm text-slate-700">
                <div className="rounded-2xl bg-white/60 p-3">
                  Review applicants in <span className="font-semibold">Pending Review</span>.
                </div>
                <div className="rounded-2xl bg-white/60 p-3">
                  Schedule entrance exams and publish questions for the next cohort.
                </div>
                <div className="rounded-2xl bg-white/60 p-3">
                  Follow up on <span className="font-semibold">Awaiting Payment</span> families.
                </div>
                <div className="rounded-2xl bg-white/60 p-3">
                  Upload missing documents to unblock admissions decisions.
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}

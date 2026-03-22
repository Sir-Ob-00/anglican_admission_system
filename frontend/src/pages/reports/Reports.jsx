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
import { listStudents } from "../../services/studentService";

export default function Reports() {
  const [report, setReport] = useState(null);
  const { role } = useAuth();
  const [myApplicants, setMyApplicants] = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (role !== "admin" && role !== "headteacher" && role !== "assistantHeadteacher") return;
    let ignore = false;
    (async () => {
      try {
        const [reportData, studentsData] = await Promise.all([
          getReports(),
          listStudents()
        ]);
        const data = Array.isArray(reportData) ? reportData : reportData.items || [];
        const studentItems = Array.isArray(studentsData) ? studentsData : studentsData.items || [];
        if (!ignore) {
          setReport(data);
          setStudents(studentItems);
        }
      } catch {
        if (!ignore) {
          setReport(null);
          setStudents([]);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [role]);

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

  // PDF download functions
  const downloadPDFReport = (reportType, data, filename) => {
    try {
      // Create PDF content
      let content = '';
      
      if (reportType === 'applicants-by-class') {
        content = generateApplicantsByClassPDF(data);
      } else if (reportType === 'admitted-students-by-class') {
        content = generateAdmittedStudentsPDF(data);
      } else if (reportType === 'detailed-payments') {
        content = generateDetailedPaymentsPDF(data);
      }
      
      // Create blob and download
      const blob = new Blob([content], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to download PDF report');
    }
  };

  const generateApplicantsByClassPDF = (data) => {
    let content = `APPLICANTS BY CLASS REPORT\n\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    data.forEach(item => {
      content += `Class: ${item.class}\n`;
      content += `Count: ${item.count}\n\n`;
      content += `---\n`;
    });
    
    return content;
  };

  const generateAdmittedStudentsPDF = (data) => {
    let content = `ADMITTED STUDENTS BY CLASS REPORT\n\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    data.forEach(item => {
      content += `Class: ${item.classAssigned?.name || item.class}\n`;
      content += `Admitted Students: ${item.count}\n\n`;
      content += `---\n`;
    });
    
    return content;
  };

  const generateDetailedPaymentsPDF = (data) => {
    let content = `DETAILED PAYMENTS REPORT\n\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    data.forEach(classData => {
      content += `Class: ${classData.classAssigned?.name || 'Unknown'}\n`;
      content += `Total Payments: ₵${(classData.total / 100).toFixed(2)}\n`;
      content += `Payment Count: ${classData.count}\n\n`;
      content += `---\n`;
      
      if (classData.payments && classData.payments.length > 0) {
        content += `Payment Details:\n`;
        classData.payments.forEach(payment => {
          content += `  Amount: ₵${(payment.amount / 100).toFixed(2)}\n`;
          content += `  Date: ${formatDate(payment.paidAt)}\n`;
          content += `  Method: ${payment.method || 'N/A'}\n`;
          content += `  Reference: ${payment.reference || 'N/A'}\n`;
          content += `  ---\n`;
        });
      }
      content += `===\n\n`;
    });
    
    return content;
  };

  const byClass = useMemo(
    () => [
      ...(report?.applicantsByClass || []).map((x) => ({ name: x.class, value: x.count })),
      ...(report?.admittedStudentsByClass || []).map((x) => ({ name: x.classAssigned?.name || x.class, value: x.count })),
    ],
    [report]
  );

  const payments = useMemo(
    () => [
      { name: "Total", total: (report?.paymentsSummary?.total || 0) / 100 },
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
      
      {/* NEW REPORTS SECTION */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Admitted Students by Class Report */}
        <Panel className="p-4">
          <div className="font-display text-lg font-semibold text-slate-900">Admitted Students by Class</div>
          <div className="mt-1 text-sm text-slate-600">
            Number of admitted students in each class.
          </div>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byClass.length > 0 ? byClass : [{ name: "No data", value: 1 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,.08)" />
                <XAxis dataKey="name" stroke="rgba(71,85,105,.9)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="rgba(10,159,141,.75)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
              onClick={() => downloadPDFReport('admitted-students-by-class', report?.admittedStudentsByClass || [], 'admitted_students_by_class')}
              disabled={!report?.admittedStudentsByClass || report?.admittedStudentsByClass.length === 0}
            >
              📄 Download PDF
            </button>
          </div>
        </Panel>

        {/* Detailed Payments Report */}
        <Panel className="p-4">
          <div className="font-display text-lg font-semibold text-slate-900">Detailed Payments Report</div>
          <div className="mt-1 text-sm text-slate-600">
            Payment details grouped by class with amounts and methods.
          </div>
          <div className="mt-4 space-y-3">
            {report?.detailedPaymentsReport && report?.detailedPaymentsReport.length > 0 ? (
              report.detailedPaymentsReport.map((classData, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="font-semibold text-slate-900 mb-2">
                    {classData.classAssigned?.name || 'Unknown Class'}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Total Amount:</span>
                      <span className="text-slate-900"> ₵{(classData.total / 100).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Payment Count:</span>
                      <span className="text-slate-900"> {classData.count}</span>
                    </div>
                  </div>
                  
                  {classData.payments && classData.payments.length > 0 && (
                    <div className="col-span-2 mt-3">
                      <div className="font-medium text-slate-700 mb-2">Payment Details:</div>
                      <div className="space-y-1">
                        {classData.payments.map((payment, paymentIndex) => (
                          <div key={paymentIndex} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-b-0">
                            <div className="flex-1">
                              <div className="text-xs text-slate-600">Amount: ₵{(payment.amount / 100).toFixed(2)}</div>
                              <div className="text-xs text-slate-600">Date: {formatDate(payment.paidAt)}</div>
                              <div className="text-xs text-slate-600">Method: {payment.method || 'N/A'}</div>
                              <div className="text-xs text-slate-600">Ref: {payment.reference || 'N/A'}</div>
                            </div>
                            <div className="text-xs text-slate-600">
                              {formatDate(payment.paidAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-slate-600">No payment data available.</div>
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
              onClick={() => downloadPDFReport('detailed-payments', report?.detailedPaymentsReport || [], 'detailed_payments_report')}
              disabled={!report?.detailedPaymentsReport || report?.detailedPaymentsReport.length === 0}
            >
              📄 Download PDF
            </button>
          </div>
        </Panel>
      </div>

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
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
              onClick={() => downloadPDFReport('applicants-by-class', report?.applicantsByClass || [], 'applicants_by_class')}
              disabled={!report?.applicantsByClass || report?.applicantsByClass.length === 0}
            >
              📄 Download PDF
            </button>
          </div>
        </Panel>

        <Panel className="p-4">
          <div className="font-display text-lg font-semibold text-slate-900">Payments summary (₵M)</div>
          <div className="mt-1 text-sm text-slate-600">Live total verified payments in Ghana Cedis.</div>
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

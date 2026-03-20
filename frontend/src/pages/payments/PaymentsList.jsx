import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { formatDate } from "../../utils/helpers";
import { useAuth } from "../../context/AuthContext";
import * as paymentService from "../../services/paymentService";

function money(n) {
  if (typeof n !== "number") return "--";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "NGN" }).format(n);
}

export default function PaymentsList() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [rows, setRows] = useState([]);

  async function refresh() {
    const data = await paymentService.listPayments();
    const items = Array.isArray(data) ? data : data.items || [];
    setRows(items);
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await paymentService.listPayments();
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) setRows(items);
      } catch {
        if (!ignore) setRows([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const columns = useMemo(
    () => [
      {
        key: "applicant",
        header: "Applicant",
        render: (r) => r.applicant?.fullName || r.applicant || "--",
      },
      { key: "amount", header: "Amount", render: (r) => money(r.amount) },
      {
        key: "status",
        header: "Payment Status",
        render: (r) => (
          <Badge tone={r.status === "verified" ? "success" : "warning"}>
            {String(r.status).replaceAll("_", " ").toUpperCase()}
          </Badge>
        ),
      },
      { key: "method", header: "Payment Method", render: (r) => String(r.method || "--").replaceAll("_", " ") },
      { key: "date", header: "Date", render: (r) => formatDate(r.paidAt || r.createdAt || r.date) },
      {
        key: "actions",
        header: "Actions",
        render: (r) =>
          role === "parent" && r.status !== "verified" ? (
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-3 text-xs font-semibold text-white hover:brightness-110"
              onClick={(e) => {
                e.stopPropagation();
                (async () => {
                  try {
                    await paymentService.verifyPayment({ paymentId: r._id || r.id });
                    await refresh();
                  } catch {
                    alert("Payment verification failed. Check backend.");
                  }
                })();
              }}
            >
              Pay
            </button>
          ) : role === "parent" && r.status === "verified" ? (
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900/5 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={(e) => {
                e.stopPropagation();
                (async () => {
                  try {
                    const blob = await paymentService.downloadReceipt(r._id || r.id);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `receipt_${r.reference || r._id || r.id}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  } catch {
                    alert("Receipt download failed.");
                  }
                })();
              }}
            >
              Receipt
            </button>
          ) : role === "assistantHeadteacher" || role === "headteacher" ? (
            r.status !== "verified" ? (
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-2xl bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                onClick={(e) => {
                  e.stopPropagation();
                  (async () => {
                    try {
                      await paymentService.verifyPayment({ paymentId: r._id || r.id });
                      await refresh();
                    } catch {
                      alert("Verify failed.");
                    }
                  })();
                }}
              >
                Verify
              </button>
            ) : (
              <span className="text-xs text-slate-500">--</span>
            )
          ) : (
            <span className="text-xs text-slate-500">--</span>
          ),
      },
    ],
    [role]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        subtitle="Track and manage admission fee payments."
        right={
          role === "assistantHeadteacher" || role === "headteacher" ? (
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
              onClick={() => navigate("/payments/initiate")}
            >
              Initiate Payment
            </button>
          ) : null
        }
      />
      <Table title="Payments List" rows={rows} columns={columns} />
    </div>
  );
}

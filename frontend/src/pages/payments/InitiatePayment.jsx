import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import PaymentForm from "../../components/forms/PaymentForm";
import * as paymentService from "../../services/paymentService";
import { useAuth } from "../../context/AuthContext";

export default function InitiatePayment() {
  const { role } = useAuth();
  const allowed = role === "assistantHeadteacher" || role === "headteacher";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Initiate Payment"
        subtitle="Create a payment request for an applicant."
      />
      <div className="grid gap-3 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-2">
          {allowed ? (
            <PaymentForm
              onSubmit={async (values) => {
                try {
                  await paymentService.initiatePayment(values);
                  alert("Payment initiated.");
                } catch (e) {
                  // Show the real backend error so it is actionable (e.g. applicant not exam_passed yet).
                  const msg =
                    e?.response?.data?.message ||
                    "Initiate payment failed. Ensure the applicant has passed the entrance exam.";
                  alert(msg);
                }
              }}
            />
          ) : (
            <div className="text-sm text-slate-700">
              You do not have permission to initiate payments.
            </div>
          )}
        </Panel>
        <Panel className="p-5">
          <div className="font-display text-lg font-semibold text-slate-900">Payment instructions</div>
          <div className="mt-2 text-sm leading-relaxed text-slate-700">
            Parents can pay via bank transfer or card. Once payment is completed, the applicant moves
            to the next workflow step.
          </div>
        </Panel>
      </div>
    </div>
  );
}

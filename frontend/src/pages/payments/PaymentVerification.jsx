import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { verifyHeadteacherPayment, verifyPayment } from "../../services/paymentService";
import { roleHomePath } from "../../utils/helpers";
import Loader from "../../components/common/Loader";

export default function PaymentVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  
  const [status, setStatus] = useState("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setErrorMessage("No payment reference found in the URL.");
      return;
    }

    let ignore = false;

    const verify = async () => {
      try {
        const isHeadteacher = role === "headteacher" || role === "assistant_headteacher" || role === "assistantHeadteacher";
        
        let response;
        if (isHeadteacher) {
          response = await verifyHeadteacherPayment(reference);
        } else {
          // If a parent or other role somehow reaches here, fall back to default verification 
          // or just assume it's valid if backend handles it
          response = await verifyPayment({ reference });
        }
        
        if (!ignore) {
          setStatus("success");
          setTimeout(() => {
            navigate(roleHomePath(role), { replace: true });
          }, 3000); // Redirect after 3 seconds
        }
      } catch (error) {
        if (!ignore) {
          setStatus("error");
          setErrorMessage(error?.response?.data?.message || "Failed to verify the payment. Please contact support.");
        }
      }
    };

    verify();

    return () => {
      ignore = true;
    };
  }, [reference, role, navigate]);

  if (!role) {
      return <Navigate to="/relogin" replace />;
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5">
        {status === "verifying" && (
          <div className="space-y-4">
            <Loader label="Verifying payment..." size="lg" />
            <p className="text-sm text-slate-500">Please wait while we confirm your payment with Paystack.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Payment Successful!</h2>
            <p className="text-sm text-slate-600">
              Your payment has been verified. Redirecting you back to your dashboard...
            </p>
            <button
              onClick={() => navigate(roleHomePath(role), { replace: true })}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-6 text-sm font-semibold text-white shadow-sm hover:brightness-110"
            >
              Go to Dashboard Now
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
              <svg className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Verification Failed</h2>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-rose-700">
              {errorMessage}
            </div>
            <p className="text-sm text-slate-600">
              You can return to your dashboard and check the payment status again.
            </p>
            <button
              onClick={() => navigate(roleHomePath(role), { replace: true })}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900/5 px-6 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import { getPaymentSubmissions, verifyPaymentSubmission } from "../../services/paymentService";

export default function PaymentSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await getPaymentSubmissions();
      setSubmissions(data.items || []);
    } catch (error) {
      console.error("Failed to load payment submissions:", error);
      alert("Failed to load payment submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (submissionId, verified) => {
    try {
      setVerifying(true);
      const notes = verified ? "Payment verified and approved" : "Payment could not be verified";
      await verifyPaymentSubmission(submissionId, notes);
      alert(verified ? "Payment approved successfully" : "Payment rejected");
      loadSubmissions(); // Reload the list
    } catch (error) {
      const message = error?.response?.data?.message || "Verification failed";
      alert(message);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Payment Submissions" subtitle="Review manual payment submissions." />
        <Panel className="p-5">
          <div className="text-center text-slate-600">Loading payment submissions...</div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Payment Submissions" subtitle="Review and verify manual payment submissions." />
      
      <Panel className="p-5">
        {submissions.length === 0 ? (
          <div className="text-center text-slate-600">No pending payment submissions.</div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">
                      {submission.applicantId?.fullName || "Unknown Applicant"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Class: {submission.applicantId?.classApplyingFor || "N/A"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Reference: {submission.reference}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Submitted: {new Date(submission.createdAt).toLocaleDateString()}
                    </div>
                    {submission.proofImage && (
                      <div className="mt-2">
                        <a
                          href={submission.proofImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          View Proof Image
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerify(submission._id, true)}
                      disabled={verifying}
                      className="inline-flex h-8 items-center justify-center rounded-2xl bg-green-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
                    >
                      {verifying ? "Verifying..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleVerify(submission._id, false)}
                      disabled={verifying}
                      className="inline-flex h-8 items-center justify-center rounded-2xl bg-red-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                    >
                      {verifying ? "Verifying..." : "Reject"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

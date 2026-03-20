import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicNavbar from "../../components/layout/PublicNavbar";
import Panel from "../../components/common/Panel";
import { getPublicEntranceExam } from "../../services/publicExamService";

export default function EntranceExamStart() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-full bg-white">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-[900px] px-4 py-10 md:px-8">
        <Panel className="p-8">
          <div className="text-2xl font-extrabold text-slate-900">Take Entrance Exam</div>
          <div className="mt-2 text-sm text-slate-700">
            Enter your Exam ID provided by the school to start.
          </div>

          <div className="mt-6">
            <label className="text-sm font-semibold text-slate-800">Exam ID</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              placeholder="e.g., EXM-123456"
            />
          </div>

          <button
            type="button"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
            disabled={!code.trim() || loading}
            onClick={async () => {
              const c = code.trim();
              setLoading(true);
              try {
                await getPublicEntranceExam(c);
                navigate(`/entrance-exam/${encodeURIComponent(c)}`);
              } catch (e) {
                alert(e?.response?.data?.message || "Entrance exam not found for that Exam ID.");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Checking..." : "Continue"}
          </button>
        </Panel>
      </main>
    </div>
  );
}


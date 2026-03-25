import { useNavigate } from "react-router-dom";
import PublicNavbar from "../../components/layout/PublicNavbar";
import Panel from "../../components/common/Panel";

export default function EntranceExamPortal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-white">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-8">
        <Panel className="mt-6 p-6">
          <div className="text-lg font-semibold text-slate-900">Entrance exam portal not available</div>
          <div className="mt-2 text-sm text-slate-700">
            This public entrance exam flow was removed because the backend does not provide the required public entrance exam endpoints.
          </div>
          <button
            type="button"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900/5 px-5 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
            onClick={() => navigate("/")}
          >
            Back to home
          </button>
        </Panel>
      </main>
    </div>
  );
}

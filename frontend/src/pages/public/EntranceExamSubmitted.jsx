import { useParams } from "react-router-dom";
import PublicNavbar from "../../components/layout/PublicNavbar";
import Panel from "../../components/common/Panel";

export default function EntranceExamSubmitted() {
  const { code } = useParams();
  return (
    <div className="min-h-full bg-white">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-[900px] px-4 py-10 md:px-8">
        <Panel className="p-8">
          <div className="text-2xl font-extrabold text-slate-900">Entrance exam submitted</div>
          <div className="mt-2 text-sm text-slate-700">
            Your entrance exam submission for Exam ID <span className="font-semibold">{code}</span>{" "}
            has been received.
          </div>
          <div className="mt-4 text-sm text-slate-600">
            The school will review your result and update your admission status.
          </div>
        </Panel>
      </main>
    </div>
  );
}


import PublicNavbar from "../../components/layout/PublicNavbar";
import Panel from "../../components/common/Panel";

export default function EntranceExamStart() {
  return (
    <div className="min-h-full bg-white">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-[900px] px-4 py-10 md:px-8">
        <Panel className="p-8">
          <div className="text-2xl font-extrabold text-slate-900">Entrance Exam</div>
          <div className="mt-2 text-sm text-slate-700">
            Public entrance exam access is not available because the backend does not provide the required public exam endpoints.
          </div>
        </Panel>
      </main>
    </div>
  );
}

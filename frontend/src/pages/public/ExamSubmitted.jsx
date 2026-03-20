import { useParams } from "react-router-dom";
import PublicNavbar from "../../components/layout/PublicNavbar";
import Panel from "../../components/common/Panel";

export default function ExamSubmitted() {
  const { id } = useParams();
  return (
    <div className="min-h-full bg-white">
      <PublicNavbar />
      <main className="mx-auto w-full max-w-[900px] px-4 py-10 md:px-8">
        <Panel className="p-8">
          <div className="text-2xl font-extrabold text-slate-900">Submission received</div>
          <div className="mt-2 text-sm text-slate-700">
            Your exam for <span className="font-semibold">ID {id}</span> has been submitted.
          </div>
          <div className="mt-4 text-sm text-slate-600">
            If you provided your applicant ID, your status will update in the admissions portal after review.
          </div>
        </Panel>
      </main>
    </div>
  );
}


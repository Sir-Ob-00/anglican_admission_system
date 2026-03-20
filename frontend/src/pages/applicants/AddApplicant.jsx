import { useNavigate } from "react-router-dom";
import ApplicantForm from "../../components/forms/ApplicantForm";
import PageHeader from "../../components/common/PageHeader";
import Panel from "../../components/common/Panel";
import * as applicantService from "../../services/applicantService";
import { useAuth } from "../../context/AuthContext";

export default function AddApplicant() {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div className="space-y-4">
      <PageHeader title="Add Applicant" subtitle="Create a new admission application." />
      <Panel className="p-5">
        <ApplicantForm
          submitLabel="Create Applicant"
          onSubmit={async (values) => {
            try {
              const created = await applicantService.createApplicant(values);
              const id = created?.id || created?._id;
              navigate(id ? `/applicants/${id}` : "/applicants");
            } catch {
              alert(
                role === "headteacher" || role === "assistantHeadteacher"
                  ? "Create failed. Check backend."
                  : "You do not have permission to add applicants."
              );
            }
          }}
        />
      </Panel>
    </div>
  );
}

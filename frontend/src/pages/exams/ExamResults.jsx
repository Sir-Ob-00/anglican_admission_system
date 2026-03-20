import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import { listExamResults } from "../../services/examResultService";
import { formatDate } from "../../utils/helpers";

export default function ExamResults() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await listExamResults({ examId: id });
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) {
          setRows(
            items.map((r) => ({
              id: r._id || r.id,
              applicant: r.applicant?.fullName || r.fullName || "-",
              score: r.percentage ?? r.score,
              status: r.result,
              ipStatus: r.submissionMeta?.ipConsistent === false ? "mismatch" : "verified",
              ipAddress: r.submissionMeta?.ipAddress || "-",
              submittedAt: r.submittedAt,
            }))
          );
        }
      } catch {
        if (!ignore) setRows([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  const columns = useMemo(
    () => [
      { key: "applicant", header: "Applicant" },
      {
        key: "score",
        header: "Score",
        render: (r) => <span className="font-semibold">{String(r.score ?? "-")}</span>,
      },
      {
        key: "status",
        header: "Result",
        render: (r) => (
          <Badge tone={r.status === "passed" ? "success" : "danger"}>
            {String(r.status).toUpperCase()}
          </Badge>
        ),
      },
      {
        key: "ipStatus",
        header: "IP Check",
        render: (r) => (
          <Badge tone={r.ipStatus === "verified" ? "success" : "danger"}>
            {r.ipStatus === "verified" ? "VERIFIED" : "MISMATCH"}
          </Badge>
        ),
      },
      { key: "ipAddress", header: "Submit IP" },
      {
        key: "submittedAt",
        header: "Submitted",
        render: (r) => formatDate(r.submittedAt),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Exam Results" subtitle="Review auto-graded exam results and IP checks." />
      <Table title={`Results for Exam ${id}`} rows={rows} columns={columns} searchable={true} />
    </div>
  );
}

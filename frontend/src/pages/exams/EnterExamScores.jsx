import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";
import Modal from "../../components/common/Modal";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/helpers";
import { listExamResults, teacherAssessExamResult } from "../../services/examResultService";

function pct(r) {
  const v =
    r.overallPercentage != null
      ? r.overallPercentage
      : r.percentage != null
        ? r.percentage
        : r.score;
  return v == null ? "—" : `${v}%`;
}

export default function EnterExamScores() {
  const { role } = useAuth();
  const [rows, setRows] = useState([]);
  const [includeAssessed, setIncludeAssessed] = useState(false);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [manualScore, setManualScore] = useState("");
  const [manualTotalPoints, setManualTotalPoints] = useState("");
  const [recommendation, setRecommendation] = useState("borderline");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role !== "teacher") return;
    let ignore = false;
    (async () => {
      try {
        const data = await listExamResults({
          mine: true,
          pendingTeacherAssessment: includeAssessed ? "false" : "true",
        });
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) setRows(items);
      } catch {
        if (!ignore) setRows([]);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [role, includeAssessed]);

  const tableRows = useMemo(
    () =>
      rows.map((r) => ({
        id: r._id || r.id,
        exam: r.exam?.title || "—",
        applicant: r.applicant?.fullName || r.fullName || "—",
        score: pct(r),
        status: r.teacherAssessment?.assessedAt ? "assessed" : "pending",
        submittedAt: r.submittedAt,
        _raw: r,
      })),
    [rows]
  );

  const columns = useMemo(
    () => [
      { key: "exam", header: "Exam" },
      { key: "applicant", header: "Applicant" },
      { key: "score", header: "Score" },
      {
        key: "status",
        header: "Assessment",
        render: (r) => (
          <Badge tone={r.status === "assessed" ? "success" : "warning"}>
            {r.status === "assessed" ? "ASSESSED" : "PENDING"}
          </Badge>
        ),
      },
      { key: "submittedAt", header: "Submitted", render: (r) => formatDate(r.submittedAt) },
      {
        key: "actions",
        header: "Actions",
        render: (r) => (
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-3 text-xs font-semibold text-white hover:brightness-110"
            onClick={(e) => {
              e.stopPropagation();
              const raw = r._raw || null;
              setActive(raw);
              setManualScore(String(raw?.manualScore ?? ""));
              setManualTotalPoints(String(raw?.manualTotalPoints ?? ""));
              setRecommendation(raw?.teacherAssessment?.recommendation || "borderline");
              setNote(raw?.teacherAssessment?.note || "");
              setOpen(true);
            }}
          >
            {r.status === "assessed" ? "Edit" : "Assess"}
          </button>
        ),
      },
    ],
    []
  );

  if (role !== "teacher") {
    return (
      <div className="space-y-4">
        <PageHeader title="Enter Exam Scores" subtitle="Teachers only." />
        <div className="rounded-3xl border border-white/40 bg-white/60 p-6 text-slate-700">
          Access denied.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Enter Exam Scores"
        subtitle="Add manual (essay) scores and submit a recommendation."
        right={
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={includeAssessed}
              onChange={(e) => setIncludeAssessed(e.target.checked)}
            />
            Show assessed
          </label>
        }
      />

      <Table title="My Exam Results" rows={tableRows} columns={columns} searchable={true} />

      <Modal
        open={open}
        title="Teacher Assessment"
        onClose={() => {
          setOpen(false);
          setActive(null);
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900/5 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-900/10"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              disabled={!active || saving}
              onClick={async () => {
                if (!active) return;
                setSaving(true);
                try {
                  await teacherAssessExamResult(active._id || active.id, {
                    manualScore: manualScore === "" ? undefined : Number(manualScore),
                    manualTotalPoints: manualTotalPoints === "" ? undefined : Number(manualTotalPoints),
                    recommendation,
                    note,
                  });
                  const data = await listExamResults({
                    mine: true,
                    pendingTeacherAssessment: includeAssessed ? "false" : "true",
                  });
                  const items = Array.isArray(data) ? data : data.items || [];
                  setRows(items);
                  setOpen(false);
                } catch {
                  alert("Save failed. Check values and try again.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-800">Manual Score</label>
              <input
                value={manualScore}
                onChange={(e) => setManualScore(e.target.value)}
                inputMode="decimal"
                className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
                placeholder="e.g., 12"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-800">Manual Total</label>
              <input
                value={manualTotalPoints}
                onChange={(e) => setManualTotalPoints(e.target.value)}
                inputMode="decimal"
                className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
                placeholder="e.g., 20"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Recommendation</label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
            >
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="borderline">Borderline</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              placeholder="Short comment for Headteacher review..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}


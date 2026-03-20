import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as applicantService from "../../services/applicantService";

export default function PaymentForm({ initialValues, onSubmit, submitLabel = "Initiate Payment" }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      applicantId: initialValues?.applicantId || "",
      amount: initialValues?.amount ?? 0,
      method: initialValues?.method || "bank_transfer",
      note: initialValues?.note || "",
    },
  });

  const [mode, setMode] = useState("id");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  const applicantId = watch("applicantId");

  useEffect(() => {
    let ignore = false;
    if (mode !== "search") return;
    if (!query.trim()) {
      setResults([]);
      return;
    }

    (async () => {
      try {
        setSearching(true);
        const data = await applicantService.listApplicants({ q: query.trim() });
        const items = Array.isArray(data) ? data : data.items || [];
        if (!ignore) setResults(items.slice(0, 10));
      } catch {
        if (!ignore) setResults([]);
      } finally {
        if (!ignore) setSearching(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [mode, query]);

  const selectedLabel = useMemo(() => {
    const match = results.find((r) => String(r._id || r.id) === String(applicantId));
    if (!match) return "";
    const klass = match.classApplyingFor ? ` (${match.classApplyingFor})` : "";
    return `${match.fullName || "Applicant"}${klass}`;
  }, [results, applicantId]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-sm font-semibold text-slate-800">Applicant</label>
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-700">
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${mode === "id" ? "bg-blue-600 text-white" : "hover:bg-slate-100"}`}
              onClick={() => setMode("id")}
            >
              Use Applicant ID
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${mode === "search" ? "bg-blue-600 text-white" : "hover:bg-slate-100"}`}
              onClick={() => setMode("search")}
            >
              Search by Name
            </button>
          </div>
        </div>

        {mode === "id" ? (
          <>
            <input
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              {...register("applicantId", { required: "Applicant ID is required" })}
              placeholder="Paste Applicant ObjectId e.g., 65f1..."
            />
            <div className="mt-1 text-xs text-slate-500">Use the applicant `_id` from Applicants list.</div>
          </>
        ) : (
          <>
            <input
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by applicant name"
            />
            <div className="mt-2 grid gap-2">
              {searching ? (
                <div className="text-xs text-slate-500">Searching...</div>
              ) : results.length ? (
                results.map((r) => {
                  const id = r._id || r.id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm ${
                        String(applicantId) === String(id)
                          ? "border-blue-300 bg-blue-50 text-blue-900"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                      onClick={() => setValue("applicantId", id, { shouldValidate: true })}
                    >
                      <span className="font-semibold">{r.fullName || "Applicant"}</span>
                      <span className="text-xs text-slate-500">{r.classApplyingFor || "N/A"}</span>
                    </button>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500">No matches found.</div>
              )}
            </div>
            {selectedLabel ? (
              <div className="mt-2 text-xs text-slate-600">
                Selected: <span className="font-semibold">{selectedLabel}</span>
              </div>
            ) : null}
          </>
        )}

        {errors.applicantId && (
          <div className="mt-1 text-xs text-rose-700">{errors.applicantId.message}</div>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-800">Amount</label>
        <input
          type="number"
          min={0}
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("amount", {
            required: "Amount is required",
            valueAsNumber: true,
            min: { value: 1, message: "Amount must be greater than 0" },
          })}
        />
        {errors.amount && <div className="mt-1 text-xs text-rose-700">{errors.amount.message}</div>}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-800">Payment Method</label>
        <select
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("method", { required: true })}
        >
          <option value="bank_transfer">Bank Transfer</option>
          <option value="card">Card</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-slate-800">Note (optional)</label>
        <textarea
          rows={3}
          className="mt-1 w-full resize-none rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("note")}
          placeholder="e.g., Admission fee for Primary 3"
        />
      </div>

      <div className="md:col-span-2 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

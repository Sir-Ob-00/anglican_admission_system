import { useForm } from "react-hook-form";

export default function ExamForm({ initialValues, onSubmit, submitLabel = "Create Exam" }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: initialValues?.title || "",
      scheduledAt: initialValues?.scheduledAt || "",
      durationMinutes: initialValues?.durationMinutes ?? 30,
      classLevel: initialValues?.classLevel || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-slate-800">Exam Title</label>
        <input
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("title", { required: "Title is required" })}
          placeholder="Entrance Exam - Math"
        />
        {errors.title && <div className="mt-1 text-xs text-rose-700">{errors.title.message}</div>}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-800">Scheduled At</label>
        <input
          type="datetime-local"
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("scheduledAt", { required: "Schedule date/time is required" })}
        />
        {errors.scheduledAt && (
          <div className="mt-1 text-xs text-rose-700">{errors.scheduledAt.message}</div>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-800">Duration (minutes)</label>
        <input
          type="number"
          min={5}
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("durationMinutes", {
            required: "Duration is required",
            valueAsNumber: true,
            min: { value: 5, message: "Minimum is 5 minutes" },
          })}
        />
        {errors.durationMinutes && (
          <div className="mt-1 text-xs text-rose-700">{errors.durationMinutes.message}</div>
        )}
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-slate-800">Class Level</label>
        <input
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("classLevel", { required: "Class level is required" })}
          placeholder="Primary 3"
        />
        {errors.classLevel && (
          <div className="mt-1 text-xs text-rose-700">{errors.classLevel.message}</div>
        )}
      </div>

      <div className="md:col-span-2 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

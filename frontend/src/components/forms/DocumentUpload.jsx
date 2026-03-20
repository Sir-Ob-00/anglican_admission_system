import { useForm } from "react-hook-form";

export default function DocumentUpload({ onSubmit, submitLabel = "Upload Document" }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: { documentType: "birth_certificate", file: null },
  });

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit?.(values);
        reset();
      })}
      className="grid gap-4 md:grid-cols-2"
    >
      <div>
        <label className="text-sm font-semibold text-slate-800">Document Type</label>
        <select
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("documentType", { required: true })}
        >
          <option value="birth_certificate">Birth Certificate</option>
          <option value="passport_photo">Passport Photo</option>
          <option value="medical_record">Medical Record</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-800">File</label>
        <input
          type="file"
          className="mt-1 block w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900/5 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-slate-900/10"
          {...register("file", {
            required: "A file is required",
            validate: (files) => (files?.length ? true : "A file is required"),
          })}
        />
        {errors.file && <div className="mt-1 text-xs text-rose-700">{errors.file.message}</div>}
      </div>

      <div className="md:col-span-2 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60"
        >
          {isSubmitting ? "Uploading..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

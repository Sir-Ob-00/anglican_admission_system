import { useForm } from "react-hook-form";

export default function ApplicantForm({ initialValues, onSubmit, submitLabel = "Save Applicant" }) {
  const today = new Date();
  const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const maxDob = formatDateInput(
    new Date(today.getFullYear() - 10, today.getMonth(), today.getDate())
  );
  const minDob = formatDateInput(
    new Date(today.getFullYear() - 20, today.getMonth(), today.getDate())
  );
  const getAge = (birthDate) => {
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age;
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      fullName: initialValues?.fullName || "",
      dateOfBirth: initialValues?.dateOfBirth || "",
      gender: initialValues?.gender || "male",
      classApplyingFor: initialValues?.classApplyingFor || "",
      parentName: initialValues?.parentName || "",
      parentContact: initialValues?.parentContact || "",
      address: initialValues?.address || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-slate-800">Full Name</label>
        <input
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("fullName", { required: "Full name is required" })}
          placeholder="e.g., Jane N. Okafor"
        />
        {errors.fullName && (
          <div className="mt-1 text-xs text-rose-700">{errors.fullName.message}</div>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-800">Date of Birth</label>
        <input
          type="date"
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          min={minDob}
          max={maxDob}
          {...register("dateOfBirth", {
            required: "Date of birth is required",
            validate: {
              ageRange: (value) => {
                if (!value) return true;
                const birthDate = new Date(`${value}T00:00:00`);
                if (Number.isNaN(birthDate.getTime())) return "Enter a valid date";
                const age = getAge(birthDate);
                if (age < 10 || age > 20) return "Applicant must be 10 to 20 years old";
                return true;
              },
            },
          })}
        />
        {errors.dateOfBirth && (
          <div className="mt-1 text-xs text-rose-700">{errors.dateOfBirth.message}</div>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-800">Gender</label>
        <select
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("gender", { required: true })}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-800">Class Applying For</label>
        <input
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("classApplyingFor", { required: "Class is required" })}
          placeholder="e.g., Primary 3"
        />
        {errors.classApplyingFor && (
          <div className="mt-1 text-xs text-rose-700">{errors.classApplyingFor.message}</div>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-800">Parent Name</label>
        <input
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("parentName")}
          placeholder="e.g., Mrs. Okafor"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-800">Parent Contact</label>
        <input
          className="mt-1 h-11 w-full rounded-2xl border border-slate-200/70 bg-white/80 px-3 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("parentContact", { required: "Parent contact is required" })}
          placeholder="+234..."
        />
        {errors.parentContact && (
          <div className="mt-1 text-xs text-rose-700">{errors.parentContact.message}</div>
        )}
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-semibold text-slate-800">Address</label>
        <textarea
          rows={3}
          className="mt-1 w-full resize-none rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-slate-900 outline-none focus:border-[color:var(--brand)]"
          {...register("address", { required: "Address is required" })}
          placeholder="Street, City, State"
        />
        {errors.address && (
          <div className="mt-1 text-xs text-rose-700">{errors.address.message}</div>
        )}
      </div>

      <div className="md:col-span-2 flex justify-end gap-2">
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

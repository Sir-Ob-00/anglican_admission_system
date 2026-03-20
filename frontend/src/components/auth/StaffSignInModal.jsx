import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../common/Modal";
import { useAuth } from "../../context/AuthContext";
import { roleHomePath } from "../../utils/helpers";

export default function StaffSignInModal({ open, onClose }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;
  const [authError, setAuthError] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    if (!open) return;
    setAuthError("");
    clearErrors();
  }, [open, clearErrors]);

  return (
    <Modal open={open} title="Staff Sign In" onClose={onClose} closeOnBackdrop={false} closeOnEscape={false}>
      <div className="text-sm text-slate-600">
        Sign in to manage applicants, exams, admissions, payments, documents, and notifications.
      </div>

      {authError ? (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {authError}
        </div>
      ) : null}

      <form
        className="mt-5 grid gap-4"
        onSubmit={handleSubmit(async (values) => {
          try {
            setAuthError("");
            clearErrors();
            const data = await login(values);
            onClose?.();
            navigate(from || roleHomePath(data?.user?.role), { replace: true });
          } catch (e) {
            const msg =
              e?.response?.data?.message ||
              e?.response?.data?.error ||
              (e?.response?.status === 401 ? "Invalid username or password." : "") ||
              e?.message ||
              "Sign in failed. Please try again.";
            setAuthError(msg);
            // Mark fields invalid without duplicating the message under each input.
            setError("username", { type: "manual", message: " " });
            setError("password", { type: "manual", message: " " });
          }
        })}
      >
        <div>
          <label className="text-sm font-semibold text-slate-800">Username or Email</label>
          <input
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-blue-500"
            {...register("username", { required: "Username is required" })}
            placeholder="e.g., admin or staff@school.com"
          />
          {errors.username && (
            <div className="mt-1 text-xs text-rose-700">{errors.username.message}</div>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-800">Password</label>
          <input
            type="password"
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-blue-500"
            {...register("password", { required: "Password is required" })}
            placeholder="********"
          />
          {errors.password && (
            <div className="mt-1 text-xs text-rose-700">{errors.password.message}</div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>
    </Modal>
  );
}

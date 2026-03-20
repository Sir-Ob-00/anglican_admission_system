import { Link } from "react-router-dom";
import Panel from "../components/common/Panel";
import { useAuth } from "../context/AuthContext";
import { roleHomePath } from "../utils/helpers";

export default function NotFound() {
  const { isAuthenticated, role } = useAuth();
  const to = isAuthenticated ? roleHomePath(role) : "/";
  return (
    <div className="mx-auto max-w-3xl py-10">
      <Panel className="p-8 text-center">
        <div className="font-display text-3xl font-semibold text-slate-900">Page not found</div>
        <div className="mt-2 text-sm text-slate-600">
          The route you visited does not exist in this frontend.
        </div>
        <Link
          to={to}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[color:var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
        >
          Go home
        </Link>
      </Panel>
    </div>
  );
}

import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cx } from "../../utils/helpers";
import logo from "../../assets/images/anglican.webp";

const roleMenus = {
  admin: [
    { to: "/admin", label: "Dashboard" },
    { to: "/applicants", label: "Applicants" },
    { to: "/admissions", label: "Admissions" },
    { to: "/reports", label: "Reports" },
    { to: "/teachers", label: "Teachers" },
    { to: "/classes", label: "Classes" },
    { to: "/payments", label: "Payments" },
    { to: "/notifications", label: "Notifications" },
    { to: "/settings/logs", label: "Activity Logs" },
    { to: "/settings/backup", label: "System Backup" },
    { to: "/settings/users", label: "Manage Users" },
  ],
  headteacher: [
    { to: "/headteacher", label: "Dashboard" },
    { to: "/applicants/new", label: "Add Applicant" },
    { to: "/applicants", label: "Applicants" },
    { to: "/admissions", label: "Admissions" },
    { to: "/teachers", label: "Teachers" },
    { to: "/classes", label: "Classes" },
    { to: "/parents", label: "Parents" },
    { to: "/parents/link", label: "Link Parents" },
    { to: "/payments", label: "Payments" },
    { to: "/reports", label: "Reports" },
    { to: "/notifications", label: "Notifications" },
    { to: "/settings/logs", label: "Activity Logs" },
    { to: "/settings/users", label: "Users" },
  ],
  assistantHeadteacher: [
    { to: "/assistant-headteacher", label: "Dashboard" },
    { to: "/applicants/new", label: "Add Applicant" },
    { to: "/applicants", label: "Applicants" },
    { to: "/admissions", label: "Admissions" },
    { to: "/teachers", label: "Teachers" },
    { to: "/classes", label: "Classes" },
    { to: "/parents", label: "Parents" },
    { to: "/payments", label: "Payments" },
    { to: "/reports", label: "Reports" },
    { to: "/documents", label: "Documents" },
    { to: "/notifications", label: "Notifications" },
  ],
  teacher: [
    { to: "/teacher", label: "Dashboard" },
    { to: "/exams", label: "Entrance Exams" },
    { to: "/exams/scores", label: "Enter Exam Scores" },
    { to: "/classes", label: "Classes" },
    { to: "/students", label: "Students" },
    { to: "/reports", label: "Reports" },
    { to: "/documents", label: "Documents" },
    { to: "/notifications", label: "Notifications" },
  ],
  parent: [
    { to: "/parent", label: "Dashboard" },
    { to: "/applicants", label: "Applicant Status" },
    { to: "/documents", label: "Upload Documents" },
    { to: "/payments", label: "Payments" },
    { to: "/reports", label: "Reports" },
    { to: "/notifications", label: "Notifications" },
  ],
};

function navItemClass({ isActive }) {
  return cx(
    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
    "hover:bg-white/10",
    isActive ? "bg-white/15 text-white" : "text-blue-50/90"
  );
}

function IconGrid(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 3h8v8H3z" />
      <path d="M13 3h8v8h-8z" />
      <path d="M3 13h8v8H3z" />
      <path d="M13 13h8v8h-8z" />
    </svg>
  );
}
function IconUsers(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function IconChart(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 6-6" />
    </svg>
  );
}
function IconBriefcase(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" />
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 12h18" />
    </svg>
  );
}
function IconLayers(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 2l9 5-9 5-9-5 9-5Z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </svg>
  );
}
function IconCard(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h6" />
    </svg>
  );
}
function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IconFile(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
function IconLink(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
      <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
    </svg>
  );
}
function IconCog(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a7.7 7.7 0 0 0 .1-1l2-1.2-2-3.4-2.3.6a7.7 7.7 0 0 0-1.7-1L15 6h-6l-.5 2a7.7 7.7 0 0 0-1.7 1l-2.3-.6-2 3.4 2 1.2a7.7 7.7 0 0 0 .1 1 7.7 7.7 0 0 0-.1 1l-2 1.2 2 3.4 2.3-.6a7.7 7.7 0 0 0 1.7 1L9 22h6l.5-2a7.7 7.7 0 0 0 1.7-1l2.3.6 2-3.4-2-1.2a7.7 7.7 0 0 0-.1-1Z" />
    </svg>
  );
}
function IconClipboard(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="M8 11h8" />
      <path d="M8 15h6" />
    </svg>
  );
}
function IconExam(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h6" />
    </svg>
  );
}

function iconForItem(it) {
  const to = String(it.to || "");
  if (to === "/dashboard") return IconGrid;
  if (to === "/admin") return IconGrid;
  if (to === "/headteacher") return IconGrid;
  if (to === "/assistant-headteacher") return IconGrid;
  if (to === "/teacher") return IconGrid;
  if (to === "/parent") return IconGrid;
  if (to.startsWith("/applicants/new")) return IconUsers;
  if (to.startsWith("/applicants")) return IconUsers;
  if (to.startsWith("/admissions")) return IconCheck;
  if (to.startsWith("/reports")) return IconChart;
  if (to.startsWith("/teachers")) return IconBriefcase;
  if (to.startsWith("/classes")) return IconLayers;
  if (to.startsWith("/payments")) return IconCard;
  if (to.startsWith("/notifications")) return IconBell;
  if (to.startsWith("/documents")) return IconFile;
  if (to.startsWith("/parents/link")) return IconLink;
  if (to.startsWith("/parents")) return IconUsers;
  if (to.startsWith("/students")) return IconUsers;
  if (to.startsWith("/exams/scores")) return IconClipboard;
  if (to.startsWith("/exams")) return IconExam;
  if (to.startsWith("/settings")) return IconCog;
  return IconGrid;
}

function roleLabel(role) {
  switch (role) {
    case "admin":
      return "Admin";
    case "headteacher":
      return "Headteacher";
    case "assistantHeadteacher":
      return "Assistant Headteacher";
    case "teacher":
      return "Class Teacher";
    default:
      return "Parent";
  }
}

export default function Sidebar({ open, onClose }) {
  const { role, user } = useAuth();
  const items = roleMenus[role] || roleMenus.parent;

  return (
    <>
      <div
        className={cx(
          "fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-sm md:hidden",
          open ? "block" : "hidden"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cx(
          "fixed left-3 top-3 z-40 flex h-[calc(100%-1.5rem)] w-[280px] flex-col rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-600 to-blue-700 p-3 shadow-xl",
          "md:sticky md:left-auto md:top-4 md:z-auto md:flex md:h-[calc(100vh-2rem)]",
          open ? "flex" : "hidden md:flex"
        )}
        aria-label="Sidebar"
      >
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
          <img
            src={logo}
            alt="Anglican School"
            className="h-10 w-10 rounded-2xl object-cover"
          />
          <div className="min-w-0">
            <div className="truncate font-semibold text-white">Admission System</div>
            <div className="truncate text-xs text-blue-100/90">Anglican School</div>
          </div>
          <button
            type="button"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white md:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            X
          </button>
        </div>

        <nav className="mt-3 flex flex-1 flex-col gap-1 overflow-auto px-1 pb-2">
          {items.map((it) => (
            <NavLink key={`${it.to}:${it.label}`} to={it.to} className={navItemClass} end>
              {(() => {
                const Icon = iconForItem(it);
                return <Icon className="h-5 w-5 shrink-0" />;
              })()}
              <span className="truncate">{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-2 rounded-2xl border border-white/10 bg-white/10 p-3">
          <div className="text-xs font-semibold tracking-wide text-blue-100/90">Online</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {roleLabel(role)} online
              </div>
              <div className="truncate text-xs text-blue-50/80">{user?.name || user?.email || ""}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/images/Anglican_logo.png";

function linkClass({ isActive }) {
  return isActive
    ? "text-[color:var(--brand)] font-semibold"
    : "text-slate-700 hover:text-slate-900";
}

export default function PublicNavbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="School logo" className="h-10 w-10 rounded-full object-cover" />
          <div className="font-display text-xl font-semibold text-[color:var(--brand)] md:text-2xl">
            Tanoso Anglican JHS "B"
          </div>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          <NavLink to="/about" className={linkClass} end>
            About Us
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

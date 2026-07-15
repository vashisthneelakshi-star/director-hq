import { LayoutGrid, Calendar, CheckSquare, KeyRound, Briefcase, Search } from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/meetings", label: "Meetings", icon: Calendar },
  { to: "/tasks", label: "Daily Tasks", icon: CheckSquare },
  { to: "/credentials", label: "Credentials", icon: KeyRound },
];

export default function Sidebar({ userName = "Director", userEmail = "you@company.com" }) {
  const initial = userName.trim().charAt(0).toUpperCase() || "D";

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center">
          <Briefcase size={18} />
        </div>
        <div>
          <div className="font-semibold leading-tight">Director HQ</div>
          <div className="text-xs text-slate-400 leading-tight">Command Center</div>
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 bg-slate-800/70 rounded-lg px-3 py-2 text-sm text-slate-400">
          <Search size={15} />
          <span className="flex-1">Search...</span>
          <kbd className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>
      </div>

      <nav className="flex-1 px-3 mt-2 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-500/15 text-brand-100"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-semibold">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{userName}</div>
          <div className="text-xs text-slate-400 truncate">{userEmail}</div>
        </div>
      </div>
    </aside>
  );
}

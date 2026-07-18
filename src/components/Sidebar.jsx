import { useState } from "react";
import {
  LayoutGrid,
  Calendar,
  CheckSquare,
  KeyRound,
  Briefcase,
  Search,
  BarChart3,
  FileText,
  Download,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { isAdminEmail } from "../lib/isAdmin";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/meetings", label: "Meetings", icon: Calendar },
  { to: "/tasks", label: "Daily Tasks", icon: CheckSquare },
  { to: "/credentials", label: "Credentials", icon: KeyRound },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/reports", label: "Reports", icon: Download },
];

function SidebarContent({ onNavigate }) {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Director";
  const initial = displayName.trim().charAt(0).toUpperCase() || "D";
  const navItems = isAdminEmail(user?.email)
    ? [...NAV_ITEMS, { to: "/admin", label: "Admin", icon: ShieldCheck }]
    : NAV_ITEMS;

  return (
    <>
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-lg bg-maroon-500 flex items-center justify-center shrink-0">
          <Briefcase size={18} className="text-gold-200" />
        </div>
        <div className="min-w-0">
          <div className="font-display font-semibold leading-tight truncate">Director HQ</div>
          <div className="text-xs text-ink-400 leading-tight">Command Center</div>
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 bg-ink-800 rounded-lg px-3 py-2 text-sm text-ink-400">
          <Search size={15} />
          <span className="flex-1">Search...</span>
          <kbd className="text-[10px] bg-ink-700 px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>
      </div>

      <nav className="flex-1 px-3 mt-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-maroon-500/20 text-gold-200"
                  : "text-ink-200 hover:bg-ink-800 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-ink-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-maroon-500 flex items-center justify-center text-sm font-semibold shrink-0">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{displayName}</div>
          <div className="text-xs text-ink-400 truncate">{user?.email}</div>
        </div>
        <button
          onClick={signOut}
          title="Log out"
          className="text-ink-400 hover:text-white transition-colors shrink-0"
        >
          <LogOut size={17} />
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-ink-950 text-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-maroon-500 flex items-center justify-center">
            <Briefcase size={14} className="text-gold-200" />
          </div>
          <span className="font-display font-semibold text-sm">Director HQ</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-1.5">
          <Menu size={22} />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-ink-950 text-white flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-ink-950 text-white flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 text-ink-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}

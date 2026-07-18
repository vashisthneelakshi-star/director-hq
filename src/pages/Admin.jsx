import { useEffect, useState } from "react";
import { ShieldCheck, Loader2, X, Mail, KeyRound, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { isAdminEmail } from "../lib/isAdmin";

function HandoverModal({ account, onClose, onSaved }) {
  const [fullName, setFullName] = useState(account.fullName || "");
  const [email, setEmail] = useState(account.email || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: account.id,
          email: email !== account.email ? email : undefined,
          password: password || undefined,
          fullName: fullName !== account.fullName ? fullName : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      onSaved({ ...account, email, fullName });
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Hand over account</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              Changing email/password does not touch this account's meetings, tasks, credentials or notes — the new
              person logging in will see everything the previous person left behind.
            </p>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Name on account</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Login email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input mt-1"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">New password</span>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep the current password"
                className="input mt-1"
              />
              <span className="text-xs text-slate-400 mt-1 block">
                Set this to hand a fresh password to the new employee — at least 6 characters.
              </span>
            </label>
            {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");

  const admin = isAdminEmail(user?.email);

  useEffect(() => {
    if (!admin) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const res = await fetch("/api/admin-users", { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load accounts");
        setAccounts(json.users);
      } catch (err) {
        setError(err.message || "Could not load accounts");
      } finally {
        setLoading(false);
      }
    })();
  }, [admin]);

  if (!admin) return <Navigate to="/" replace />;

  const handleSaved = (updated) => {
    setAccounts((list) => list.map((a) => (a.id === updated.id ? updated : a)));
    setToast(`Updated ${updated.email}`);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={22} className="text-maroon-500" />
        <h1 className="text-2xl font-semibold text-ink_text">Admin</h1>
      </div>
      <p className="text-slate-500 mb-6 text-sm">
        Manage director logins. When someone leaves, change their email and password here — their data stays put
        for whoever takes over.
      </p>

      {toast && (
        <div className="mb-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-maroon-500" size={26} />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      ) : (
        <div className="bg-paper-100 rounded-xl border border-paper-200 overflow-hidden">
          <ul className="divide-y divide-paper-200">
            {accounts.map((a) => (
              <li key={a.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium text-ink_text">
                    <User size={14} className="text-slate-400" />
                    {a.fullName || "(no name set)"}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                    <Mail size={12} /> {a.email}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Joined {new Date(a.createdAt).toLocaleDateString()}
                    {a.lastSignInAt ? ` · Last login ${new Date(a.lastSignInAt).toLocaleDateString()}` : " · Never logged in"}
                  </div>
                </div>
                <button
                  onClick={() => setEditing(a)}
                  className="flex items-center gap-1.5 text-sm font-medium border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 shrink-0"
                >
                  <KeyRound size={14} /> Hand over / edit
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing && <HandoverModal account={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
    </div>
  );
}

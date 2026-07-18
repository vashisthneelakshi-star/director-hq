import { useEffect, useMemo, useRef, useState } from "react";
import { KeyRound, Plus, Search, X, Eye, EyeOff, Trash2, ShieldCheck, Copy, Check, Download, FileSpreadsheet, FileText, Loader2, UserRound } from "lucide-react";
import { store } from "../lib/storage";
import { exportCredentialsCSV, exportCredentialsPDF } from "../lib/export";
import { Linkify } from "../lib/linkify";
import { useAuth } from "../lib/AuthContext";
import { isAdminEmail } from "../lib/isAdmin";
import { useDirectors } from "../lib/useDirectors";

function AddCredentialModal({ onClose, onSave }) {
  const [form, setForm] = useState({ site: "", url: "", username: "", password: "", notes: "" });
  const [showPw, setShowPw] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.site.trim() || !form.username.trim() || !form.password.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Add Credential</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Site Name <span className="text-red-500">*</span>
              </span>
              <input autoFocus value={form.site} onChange={set("site")} placeholder="Google Workspace" className="input mt-1" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Website URL</span>
              <input value={form.url} onChange={set("url")} placeholder="https://example.com" className="input mt-1" />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Username / Email <span className="text-red-500">*</span>
            </span>
            <input value={form.username} onChange={set("username")} placeholder="director@company.com" className="input mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Password <span className="text-red-500">*</span>
            </span>
            <div className="relative mt-1">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                placeholder="••••••••"
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Notes</span>
            <textarea value={form.notes} onChange={set("notes")} placeholder="Additional notes..." className="input mt-1 min-h-[70px]" />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700">
              Save Credential
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CredentialRow({ cred, onDelete, ownerName }) {
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(cred.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard may be unavailable; ignore silently
    }
  };

  return (
    <li className="p-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
        <KeyRound size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-900">{cred.site}</div>
        <div className="text-sm text-slate-500 truncate">{cred.username}</div>
        {cred.url && (
          <div className="text-xs text-slate-400 truncate">
            <Linkify text={cred.url} className="text-brand-500 hover:text-brand-600" />
          </div>
        )}
        {ownerName && (
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <UserRound size={11} /> {ownerName}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-mono text-slate-600 w-28 text-right">
          {reveal ? cred.password : "•".repeat(Math.min(cred.password.length, 10))}
        </span>
        <button onClick={() => setReveal((r) => !r)} className="text-slate-400 hover:text-slate-600">
          {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button onClick={copyPassword} className="text-slate-400 hover:text-slate-600">
          {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
        </button>
        <button onClick={() => onDelete(cred.id)} className="text-slate-400 hover:text-red-500">
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}

function DownloadMenu({ credentials }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const disabled = credentials.length === 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-700 text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
        title={disabled ? "Add a credential first" : "Download credentials"}
      >
        <Download size={16} /> Download
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20">
          <button
            onClick={() => {
              exportCredentialsCSV(credentials);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" /> Export as Excel (CSV)
          </button>
          <button
            onClick={() => {
              exportCredentialsPDF(credentials);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FileText size={15} className="text-red-500" /> Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default function Credentials() {
  const { user } = useAuth();
  const admin = isAdminEmail(user?.email);
  const { nameFor } = useDirectors(admin);
  const [credentials, setCredentials] = useState([]);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setCredentials(await store.getCredentials());
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return credentials;
    return credentials.filter((c) => c.site?.toLowerCase().includes(q) || c.username?.toLowerCase().includes(q));
  }, [credentials, query]);

  const handleSave = async (form) => {
    const created = await store.addCredential(form);
    setCredentials((c) => [created, ...c]);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    await store.deleteCredential(id);
    setCredentials((c) => c.filter((x) => x.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-maroon-500" size={26} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Credentials Vault</h1>
            <ShieldCheck size={20} className="text-emerald-500" />
          </div>
          <p className="text-slate-500 text-sm mt-1">{credentials.length} saved entries</p>
        </div>
        <div className="flex items-center gap-2">
          <DownloadMenu credentials={filtered} />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Plus size={16} /> Add Credential
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-400 -mt-3 mb-5">
        Downloaded files contain plain-text passwords — store them somewhere safe and delete after use.
      </p>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2.5 mb-5">
        <Search size={16} className="text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by site name, username..."
          className="flex-1 outline-none text-sm placeholder:text-slate-400"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
              <KeyRound size={26} className="text-slate-400" />
            </div>
            <div className="font-semibold text-slate-800 mb-1">No credentials yet</div>
            <p className="text-sm text-slate-500 mb-5">Store your website logins securely</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
            >
              Add Credential
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <CredentialRow key={c.id} cred={c} onDelete={handleDelete} ownerName={admin ? nameFor(c.owner_id) : ""} />
            ))}
          </ul>
        )}
      </div>

      {showModal && <AddCredentialModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}

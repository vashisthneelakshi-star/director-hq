import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, Search, Trash2, Loader2 } from "lucide-react";
import { store } from "../lib/storage";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "" });

  useEffect(() => {
    (async () => {
      const all = await store.getNotes();
      setNotes(all);
      if (all.length) {
        setActiveId(all[0].id);
        setDraft({ title: all[0].title, body: all[0].body });
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => n.title?.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q));
  }, [notes, query]);

  const active = notes.find((n) => n.id === activeId);

  const selectNote = (n) => {
    setActiveId(n.id);
    setDraft({ title: n.title, body: n.body });
  };

  const createNote = async () => {
    const created = await store.addNote({ title: "Untitled note", body: "" });
    setNotes((n) => [created, ...n]);
    setActiveId(created.id);
    setDraft({ title: created.title, body: created.body });
  };

  const saveDraft = async () => {
    if (!active) return;
    setSaving(true);
    const updated = await store.updateNote(active.id, draft);
    setNotes((list) => list.map((n) => (n.id === active.id ? updated : n)));
    setSaving(false);
  };

  const deleteNote = async (id) => {
    await store.deleteNote(id);
    const rest = notes.filter((n) => n.id !== id);
    setNotes(rest);
    if (activeId === id) {
      if (rest.length) selectNote(rest[0]);
      else {
        setActiveId(null);
        setDraft({ title: "", body: "" });
      }
    }
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
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-900">Notes</h1>
        <button
          onClick={createNote}
          className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> New Note
        </button>
      </div>
      <div className="masthead-rule mb-5" />

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
        <div className="bg-paper-100 rounded-xl border border-paper-200 flex flex-col max-h-[70vh]">
          <div className="p-3 border-b border-paper-200">
            <div className="flex items-center gap-2 bg-paper border border-paper-200 rounded-lg px-2.5 py-2">
              <Search size={14} className="text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes..."
                className="flex-1 outline-none text-sm bg-transparent placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <FileText size={26} className="text-slate-300 mb-2" />
                <p className="text-sm text-slate-400 mb-3">No notes yet</p>
                <button onClick={createNote} className="text-sm text-maroon-500 font-medium hover:underline">
                  Create your first note
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-paper-200">
                {filtered.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => selectNote(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-paper transition-colors ${
                        n.id === activeId ? "bg-maroon-50" : ""
                      }`}
                    >
                      <div className="font-medium text-sm text-ink_text truncate">{n.title || "Untitled"}</div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {n.body ? n.body.slice(0, 40) : "No content"} · {timeAgo(n.updated_at)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-paper-100 rounded-xl border border-paper-200 p-5 min-h-[60vh] flex flex-col">
          {active ? (
            <>
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                onBlur={saveDraft}
                placeholder="Note title"
                className="text-xl font-display font-semibold outline-none mb-3 bg-transparent"
              />
              <textarea
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                onBlur={saveDraft}
                placeholder="Start writing..."
                className="flex-1 outline-none resize-none text-sm text-ink_text leading-relaxed bg-transparent"
              />
              <div className="flex items-center justify-between pt-3 border-t border-paper-200 mt-3">
                <span className="text-xs text-slate-400">{saving ? "Saving..." : `Updated ${timeAgo(active.updated_at)}`}</span>
                <button
                  onClick={() => deleteNote(active.id)}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600"
                >
                  <Trash2 size={14} /> Delete note
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <FileText size={32} className="text-slate-300 mb-3" />
              <p className="text-slate-400 mb-4">No note selected</p>
              <button onClick={createNote} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg">
                New Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

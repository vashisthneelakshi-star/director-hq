import { useEffect, useMemo, useState } from "react";
import { Calendar, List, Plus, Search, SlidersHorizontal, X, Clock, MapPin, Users, Trash2 } from "lucide-react";
import { store } from "../lib/storage";

const FILTERS = ["All", "Scheduled", "Completed", "Cancelled"];

function EmptyState({ onSchedule }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
        <Calendar size={26} className="text-slate-400" />
      </div>
      <div className="font-semibold text-slate-800 mb-1">No meetings found</div>
      <p className="text-sm text-slate-500 mb-5">Schedule your first meeting to get started</p>
      <button
        onClick={onSchedule}
        className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        Schedule Meeting
      </button>
    </div>
  );
}

function ScheduleModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: "", date: "", time: "", location: "", attendees: "" });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Schedule Meeting</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title" required>
            <input
              autoFocus
              value={form.title}
              onChange={set("title")}
              placeholder="Quarterly review"
              className="input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" required>
              <input type="date" value={form.date} onChange={set("date")} className="input" />
            </Field>
            <Field label="Time">
              <input type="time" value={form.time} onChange={set("time")} className="input" />
            </Field>
          </div>
          <Field label="Location">
            <input value={form.location} onChange={set("location")} placeholder="Meeting room / link" className="input" />
          </Field>
          <Field label="Attendees">
            <input value={form.attendees} onChange={set("attendees")} placeholder="Comma separated names" className="input" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700">
              Save Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [view, setView] = useState("list");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setMeetings(store.getMeetings());
  }, []);

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      const matchesFilter = filter === "All" || m.status === filter.toLowerCase();
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        m.title?.toLowerCase().includes(q) ||
        m.attendees?.toLowerCase().includes(q) ||
        m.location?.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [meetings, filter, query]);

  const handleSave = (form) => {
    const created = store.addMeeting(form);
    setMeetings((m) => [created, ...m]);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    store.deleteMeeting(id);
    setMeetings((m) => m.filter((x) => x.id !== id));
  };

  const setStatus = (id, status) => {
    store.updateMeeting(id, { status });
    setMeetings((m) => m.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meeting Schedule</h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} of {meetings.length} meetings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
                view === "list" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
              }`}
            >
              <List size={15} /> List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
                view === "calendar" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
              }`}
            >
              <Calendar size={15} /> Calendar
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Plus size={16} /> Schedule Meeting
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2.5">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, attendees, location..."
            className="flex-1 outline-none text-sm placeholder:text-slate-400"
          />
        </div>
        <button className="flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600">
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      <div className="flex gap-1 mb-5 bg-slate-100 rounded-lg p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              filter === f ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        {filtered.length === 0 ? (
          <EmptyState onSchedule={() => setShowModal(true)} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((m) => (
              <li key={m.id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-slate-900">{m.title}</div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                    {m.date && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(m.date).toLocaleDateString()} {m.time}
                      </span>
                    )}
                    {m.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {m.location}
                      </span>
                    )}
                    {m.attendees && (
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {m.attendees}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={m.status}
                    onChange={(e) => setStatus(m.id, e.target.value)}
                    className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-600"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button onClick={() => handleDelete(m.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && <ScheduleModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}

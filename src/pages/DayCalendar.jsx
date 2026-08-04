import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, X, Loader2, Save } from "lucide-react";
import { store } from "../lib/storage";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n) {
  return String(n).padStart(2, "0");
}
function toDateStr(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function todayStr() {
  const t = new Date();
  return toDateStr(t.getFullYear(), t.getMonth(), t.getDate());
}

function DayNoteModal({ dateStr, initialContent, onClose, onSave }) {
  const [content, setContent] = useState(initialContent || "");
  const [saving, setSaving] = useState(false);

  const label = new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const save = async () => {
    setSaving(true);
    try {
      await onSave(dateStr, content);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
            <p className="text-xs text-slate-400">What's happening on this day?</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Meetings, reminders, plans for the day..."
          className="input w-full"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-1.5 disabled:opacity-60"
          >
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DayCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [notesByDate, setNotesByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [openDate, setOpenDate] = useState(null);

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const start = toDateStr(year, month, 1);
      const end = toDateStr(year, month, daysInMonth);
      const rows = await store.getCalendarNotesRange(start, end);
      const map = {};
      for (const r of rows || []) map[r.note_date] = r.content;
      setNotesByDate(map);
      setLoading(false);
    })();
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [startWeekday, daysInMonth]);

  const goPrev = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const goNext = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const saveNote = async (dateStr, content) => {
    await store.saveCalendarNote(dateStr, content);
    setNotesByDate((m) => {
      const next = { ...m };
      if (content && content.trim()) next[dateStr] = content;
      else delete next[dateStr];
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays size={24} className="text-brand-600" /> Calendar
          </h1>
          <p className="text-slate-500 text-sm mt-1">Click any day to write what's on your plate</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
            Today
          </button>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg">
            <button onClick={goPrev} className="p-2 text-slate-500 hover:text-slate-800">
              <ChevronLeft size={18} />
            </button>
            <span className="px-2 text-sm font-medium text-slate-800 w-32 text-center">
              {MONTHS[month]} {year}
            </span>
            <button onClick={goNext} className="p-2 text-slate-500 hover:text-slate-800">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-maroon-500" size={22} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-xs font-semibold text-slate-400 py-1">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, idx) => {
                if (d === null) return <div key={idx} className="aspect-square sm:aspect-[4/3]" />;
                const dateStr = toDateStr(year, month, d);
                const hasNote = Boolean(notesByDate[dateStr]);
                const isToday = dateStr === todayStr();
                return (
                  <button
                    key={idx}
                    onClick={() => setOpenDate(dateStr)}
                    className={`aspect-square sm:aspect-[4/3] rounded-lg border p-1.5 sm:p-2 flex flex-col items-start text-left transition-colors ${
                      isToday ? "border-brand-500 bg-brand-50" : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`text-xs sm:text-sm font-medium ${isToday ? "text-brand-700" : "text-slate-700"}`}>{d}</span>
                    {hasNote && (
                      <span className="mt-auto text-[10px] sm:text-xs text-slate-500 line-clamp-2 sm:line-clamp-3 w-full">
                        {notesByDate[dateStr]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {openDate && (
        <DayNoteModal
          dateStr={openDate}
          initialContent={notesByDate[openDate] || ""}
          onClose={() => setOpenDate(null)}
          onSave={saveNote}
        />
      )}
    </div>
  );
}

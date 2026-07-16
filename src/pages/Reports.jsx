import { useEffect, useState } from "react";
import { Download, Calendar, CheckSquare, KeyRound, FileText, BarChart3, Loader2 } from "lucide-react";
import { store } from "../lib/storage";
import { useAuth } from "../lib/AuthContext";
import {
  exportMeetingsCSV,
  exportMeetingsPDF,
  exportTasksCSV,
  exportTasksPDF,
  exportCredentialsCSV,
  exportCredentialsPDF,
  exportNotesIndexCSV,
  exportSummaryPDF,
} from "../lib/export";

function ReportCard({ icon: Icon, tint, title, description, count, countLabel, onCSV, onPDF, csvLabel = "CSV", pdfLabel = "PDF Report", warning }) {
  const disabled = count === 0;
  return (
    <div className="bg-paper-100 rounded-xl border border-paper-200 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
          <Icon size={17} />
        </div>
        <div>
          <div className="font-semibold text-ink_text">{title}</div>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-paper rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600">
          <span className="stat-num font-semibold text-ink_text">{count}</span> {countLabel}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          disabled={disabled}
          onClick={onCSV}
          className="flex-1 flex items-center justify-center gap-1.5 border border-paper-200 text-slate-600 text-sm font-medium py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-paper"
        >
          {csvLabel}
        </button>
        <button
          disabled={disabled}
          onClick={onPDF}
          className="flex-1 flex items-center justify-center gap-1.5 bg-maroon-500 hover:bg-maroon-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pdfLabel}
        </button>
      </div>
      {warning && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 mt-3">{warning}</p>
      )}
    </div>
  );
}

export default function Reports() {
  const { user } = useAuth();
  const ownerName = user?.user_metadata?.full_name || "You";
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [m, t, c, n] = await Promise.all([
        store.getMeetings(),
        store.getTasks(),
        store.getCredentials(),
        store.getNotes(),
      ]);
      setMeetings(m);
      setTasks(t);
      setCredentials(c);
      setNotes(n);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-maroon-500" size={26} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Export &amp; Reports</h1>
      <div className="masthead-rule mb-2" />
      <p className="text-slate-500 text-sm mb-6">Download your data as CSV spreadsheets or formatted PDF reports.</p>

      <div className="rounded-xl p-6 mb-6 bg-gradient-to-r from-maroon-600 to-maroon-500 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-semibold mb-1">
            <BarChart3 size={18} /> Full Productivity Summary
          </div>
          <p className="text-sm text-maroon-100">
            One-click branded PDF with all your meetings, tasks, and vault stats — great for weekly reviews.
          </p>
          <div className="flex gap-4 text-xs text-maroon-100 mt-2">
            <span>{meetings.length} meetings</span>
            <span>{tasks.length} tasks</span>
            <span>{credentials.length} credentials</span>
          </div>
        </div>
        <button
          onClick={() => exportSummaryPDF({ meetings, tasks, credentials }, ownerName)}
          className="flex items-center justify-center gap-2 bg-white text-maroon-600 font-medium text-sm px-4 py-2.5 rounded-lg shrink-0 hover:bg-gold-50"
        >
          <Download size={16} /> Download Summary PDF
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ReportCard
          icon={Calendar}
          tint="bg-blue-100 text-blue-600"
          title="Meetings"
          description="Export your meeting history with dates, durations, and attendees."
          count={meetings.length}
          countLabel="meetings"
          onCSV={() => exportMeetingsCSV(meetings)}
          onPDF={() => exportMeetingsPDF(meetings)}
        />
        <ReportCard
          icon={CheckSquare}
          tint="bg-emerald-100 text-emerald-600"
          title="Tasks"
          description="Export your task list with priorities, statuses, and due dates."
          count={tasks.length}
          countLabel="tasks"
          onCSV={() => exportTasksCSV(tasks, ownerName)}
          onPDF={() => exportTasksPDF(tasks, ownerName)}
        />
        <ReportCard
          icon={KeyRound}
          tint="bg-gold-50 text-gold-600"
          title="Credentials Vault"
          description="Export all saved credentials as a plain CSV. Keep the file secure."
          count={credentials.length}
          countLabel="entries"
          onCSV={() => exportCredentialsCSV(credentials)}
          onPDF={() => exportCredentialsPDF(credentials)}
          warning="This CSV contains plain-text passwords. Store it securely and delete it after use."
        />
        <ReportCard
          icon={FileText}
          tint="bg-slate-100 text-slate-600"
          title="Notes"
          description="Export your notes index as a CSV with titles and excerpts. Note bodies are stored as rich text and not included."
          count={notes.length}
          countLabel="notes"
          csvLabel="Export Notes Index CSV"
          onCSV={() => exportNotesIndexCSV(notes)}
          onPDF={() => exportNotesIndexCSV(notes)}
          pdfLabel="Export Notes Index CSV"
        />
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Calendar, CheckSquare, KeyRound, Clock, AlertCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { store } from "../lib/storage";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function StatCard({ icon: Icon, value, label, tint }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${tint}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function Overview() {
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [credentials, setCredentials] = useState([]);

  useEffect(() => {
    setMeetings(store.getMeetings());
    setTasks(store.getTasks());
    setCredentials(store.getCredentials());
  }, []);

  const today = new Date().toDateString();
  const todaysMeetings = meetings.filter((m) => m.date && new Date(m.date).toDateString() === today);
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const highPriority = tasks.filter((t) => t.priority === "high" && t.status !== "done");
  const upcoming = meetings
    .filter((m) => m.status !== "cancelled" && new Date(m.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-bold text-slate-900">{greeting()}</h1>
        <Sparkles size={20} className="text-brand-500" />
      </div>
      <p className="text-slate-500 mb-6">{dateStr}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Calendar} value={todaysMeetings.length} label="Today's Meetings" tint="bg-blue-100 text-blue-600" />
        <StatCard icon={CheckSquare} value={pendingTasks.length} label="Pending Tasks" tint="bg-amber-100 text-amber-600" />
        <StatCard icon={KeyRound} value={credentials.length} label="Saved Credentials" tint="bg-emerald-100 text-emerald-600" />
        <StatCard icon={Clock} value={meetings.length} label="Total Meetings" tint="bg-violet-100 text-violet-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Calendar size={17} /> Upcoming Meetings
            </div>
            <Link to="/meetings" className="text-sm text-brand-600 font-medium hover:underline">
              View all →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyMini icon={Calendar} text="No upcoming meetings" />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-3 py-2">
                  <span className="font-medium text-slate-800">{m.title}</span>
                  <span className="text-slate-400">{new Date(m.date).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <AlertCircle size={17} className="text-red-500" /> High Priority Tasks
            </div>
            <Link to="/tasks" className="text-sm text-brand-600 font-medium hover:underline">
              View all →
            </Link>
          </div>
          {highPriority.length === 0 ? (
            <EmptyMini icon={CheckSquare} text="No high priority tasks" />
          ) : (
            <ul className="space-y-2">
              {highPriority.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm border border-slate-100 rounded-lg px-3 py-2">
                  <span className="font-medium text-slate-800">{t.title}</span>
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">High</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyMini({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
      <Icon size={26} className="mb-2 opacity-60" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckSquare,
  KeyRound,
  Clock,
  AlertCircle,
  Sparkles,
  AlertTriangle,
  Loader,
  CheckCircle2,
  CalendarCheck,
  CalendarX,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { store } from "../lib/storage";
import { useAuth } from "../lib/AuthContext";
import NotificationCard from "../components/NotificationCard";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function isOverdue(task) {
  if (!task.dueDate && !task.due_date) return false;
  if (task.status === "done") return false;
  const due = task.dueDate || task.due_date;
  return new Date(due + "T23:59:59") < new Date();
}

function StatCard({ icon: Icon, value, label, tint, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-paper-100 rounded-xl border border-paper-200 p-5 flex items-center gap-4 text-left hover:border-maroon-300 hover:shadow-card transition-all"
    >
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="stat-num text-2xl font-semibold text-ink_text">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </button>
  );
}

function MiniStat({ icon: Icon, value, label, tint, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg border border-paper-200 px-3 py-2.5 hover:border-maroon-200 hover:bg-paper transition-colors text-left w-full"
    >
      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${tint}`}>
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="stat-num text-lg font-semibold text-ink_text leading-tight">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
      <ChevronRight size={14} className="text-slate-300" />
    </button>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      const [m, t, c] = await Promise.all([store.getMeetings(), store.getTasks(), store.getCredentials()]);
      if (!alive) return;
      setMeetings(m);
      setTasks(t);
      setCredentials(c);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const today = new Date().toDateString();
  const todaysMeetings = meetings.filter((m) => m.date && new Date(m.date).toDateString() === today);
  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const highPriority = tasks.filter((t) => t.priority === "high" && t.status !== "done");

  const overdueTasks = tasks.filter(isOverdue);
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const upcomingMeetings = meetings.filter(
    (m) => m.status === "scheduled" && new Date(m.date) >= new Date(new Date().toDateString())
  );
  const completedMeetings = meetings.filter((m) => m.status === "completed");
  const cancelledMeetings = meetings.filter((m) => m.status === "cancelled");

  const upcoming = [...upcomingMeetings].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 4);

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const displayName = user?.user_metadata?.full_name?.split(" ")[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-maroon-500" size={26} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-semibold text-ink_text">
          {greeting()}
          {displayName ? `, ${displayName}` : ""}
        </h1>
        <Sparkles size={20} className="text-gold-500" />
      </div>
      <div className="masthead-rule mb-2" />
      <p className="text-slate-500 mb-6 text-sm">{dateStr}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Calendar}
          value={todaysMeetings.length}
          label="Today's Meetings"
          tint="bg-blue-100 text-blue-600"
          onClick={() => navigate("/meetings")}
        />
        <StatCard
          icon={CheckSquare}
          value={pendingTasks.length}
          label="Pending Tasks"
          tint="bg-gold-50 text-gold-600"
          onClick={() => navigate("/tasks?status=To Do")}
        />
        <StatCard
          icon={KeyRound}
          value={credentials.length}
          label="Saved Credentials"
          tint="bg-emerald-100 text-emerald-600"
          onClick={() => navigate("/credentials")}
        />
        <StatCard
          icon={Clock}
          value={meetings.length}
          label="Total Meetings"
          tint="bg-maroon-50 text-maroon-500"
          onClick={() => navigate("/meetings")}
        />
      </div>

      <div className="mb-6">
        <NotificationCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-paper-100 rounded-xl border border-paper-200 p-5">
          <div className="flex items-center gap-2 font-semibold text-ink_text mb-4">
            <CheckSquare size={17} /> Task Breakdown
          </div>
          <div className="space-y-2">
            <MiniStat
              icon={AlertTriangle}
              value={overdueTasks.length}
              label="Overdue — deadline crossed"
              tint="bg-red-100 text-red-600"
              onClick={() => navigate("/tasks?status=Overdue")}
            />
            <MiniStat
              icon={Loader}
              value={inProgressTasks.length}
              label="In progress"
              tint="bg-blue-100 text-blue-600"
              onClick={() => navigate("/tasks?status=In Progress")}
            />
            <MiniStat
              icon={CheckCircle2}
              value={doneTasks.length}
              label="Completed"
              tint="bg-emerald-100 text-emerald-600"
              onClick={() => navigate("/tasks?status=Done")}
            />
          </div>
        </div>

        <div className="bg-paper-100 rounded-xl border border-paper-200 p-5">
          <div className="flex items-center gap-2 font-semibold text-ink_text mb-4">
            <Calendar size={17} /> Meeting Breakdown
          </div>
          <div className="space-y-2">
            <MiniStat
              icon={Calendar}
              value={upcomingMeetings.length}
              label="Upcoming — yet to happen"
              tint="bg-blue-100 text-blue-600"
              onClick={() => navigate("/meetings?status=Scheduled")}
            />
            <MiniStat
              icon={CalendarCheck}
              value={completedMeetings.length}
              label="Completed"
              tint="bg-emerald-100 text-emerald-600"
              onClick={() => navigate("/meetings?status=Completed")}
            />
            <MiniStat
              icon={CalendarX}
              value={cancelledMeetings.length}
              label="Cancelled / didn't happen"
              tint="bg-red-100 text-red-600"
              onClick={() => navigate("/meetings?status=Cancelled")}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-paper-100 rounded-xl border border-paper-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-semibold text-ink_text">
              <Calendar size={17} /> Upcoming Meetings
            </div>
            <Link to="/meetings" className="text-sm text-maroon-500 font-medium hover:underline">
              View all →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyMini icon={Calendar} text="No upcoming meetings" />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => navigate(`/meetings?id=${m.id}`)}
                    className="w-full flex items-center justify-between text-sm border border-paper-200 rounded-lg px-3 py-2 hover:border-maroon-200 hover:bg-paper text-left"
                  >
                    <span className="font-medium text-ink_text">{m.title}</span>
                    <span className="text-slate-400">{new Date(m.date).toLocaleDateString()}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-paper-100 rounded-xl border border-paper-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 font-semibold text-ink_text">
              <AlertCircle size={17} className="text-maroon-500" /> High Priority Tasks
            </div>
            <Link to="/tasks" className="text-sm text-maroon-500 font-medium hover:underline">
              View all →
            </Link>
          </div>
          {highPriority.length === 0 ? (
            <EmptyMini icon={CheckSquare} text="No high priority tasks" />
          ) : (
            <ul className="space-y-2">
              {highPriority.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => navigate(`/tasks?id=${t.id}`)}
                    className="w-full flex items-center justify-between text-sm border border-paper-200 rounded-lg px-3 py-2 hover:border-maroon-200 hover:bg-paper text-left"
                  >
                    <span className="font-medium text-ink_text">{t.title}</span>
                    <span className="text-xs font-medium text-maroon-600 bg-maroon-50 px-2 py-0.5 rounded-full">High</span>
                  </button>
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

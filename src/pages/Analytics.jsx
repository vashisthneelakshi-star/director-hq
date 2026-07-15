import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Calendar, Flame, ListChecks, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { store } from "../lib/storage";

const PRIORITY_COLORS = { high: "#B23A2E", medium: "#B8863E", low: "#8891A0" };
const STATUS_COLORS = { scheduled: "#4C5C77", completed: "#3F7D5C", cancelled: "#B23A2E" };

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
}

function lastNWeeks(n) {
  const weeks = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    weeks.push(startOfWeek(d));
  }
  return weeks;
}

function lastNDays(n) {
  const days = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function fmtWeek(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtDay(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({ icon: Icon, value, label, tint }) {
  return (
    <div className="bg-paper-100 rounded-xl border border-paper-200 p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="stat-num text-xl font-semibold text-ink_text">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [m, t] = await Promise.all([store.getMeetings(), store.getTasks()]);
      setMeetings(m);
      setTasks(t);
      setLoading(false);
    })();
  }, []);

  const meetingsPerWeek = useMemo(() => {
    const weeks = lastNWeeks(8);
    return weeks.map((wStart) => {
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 7);
      const count = meetings.filter((m) => {
        if (!m.date) return false;
        const d = new Date(m.date);
        return d >= wStart && d < wEnd;
      }).length;
      return { label: fmtWeek(wStart), count };
    });
  }, [meetings]);

  const tasksPerDay = useMemo(() => {
    const days = lastNDays(14);
    return days.map((d) => {
      const dayStr = d.toDateString();
      const count = tasks.filter((t) => t.status === "done" && t.dueDate && new Date(t.dueDate).toDateString() === dayStr).length;
      return { label: fmtDay(d), count };
    });
  }, [tasks]);

  const meetingStatusData = useMemo(() => {
    const scheduled = meetings.filter((m) => m.status === "scheduled").length;
    const completed = meetings.filter((m) => m.status === "completed").length;
    const cancelled = meetings.filter((m) => m.status === "cancelled").length;
    return [
      { name: "Scheduled", value: scheduled, color: STATUS_COLORS.scheduled },
      { name: "Completed", value: completed, color: STATUS_COLORS.completed },
      { name: "Cancelled", value: cancelled, color: STATUS_COLORS.cancelled },
    ].filter((d) => d.value > 0);
  }, [meetings]);

  const taskPriorityData = useMemo(() => {
    const high = tasks.filter((t) => t.priority === "high").length;
    const medium = tasks.filter((t) => t.priority === "medium").length;
    const low = tasks.filter((t) => t.priority === "low").length;
    return [
      { name: "High", value: high, color: PRIORITY_COLORS.high },
      { name: "Medium", value: medium, color: PRIORITY_COLORS.medium },
      { name: "Low", value: low, color: PRIORITY_COLORS.low },
    ].filter((d) => d.value > 0);
  }, [tasks]);

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const meetingCompletionPct = meetings.length ? Math.round((meetings.filter((m) => m.status === "completed").length / meetings.length) * 100) : 0;
  const taskCompletionPct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const dayStreak = useMemo(() => {
    const doneDates = new Set(
      tasks.filter((t) => t.status === "done" && t.dueDate).map((t) => new Date(t.dueDate).toDateString())
    );
    let streak = 0;
    let d = new Date();
    while (doneDates.has(d.toDateString())) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-maroon-500" size={26} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
      <div className="masthead-rule mb-2" />
      <p className="text-slate-500 text-sm mb-6">Your productivity at a glance</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard icon={Calendar} value={meetings.length} label="Total Meetings" tint="bg-blue-100 text-blue-600" />
        <StatCard icon={CheckCircle2} value={`${meetingCompletionPct}%`} label="Meeting Completion" tint="bg-emerald-100 text-emerald-600" />
        <StatCard icon={ListChecks} value={tasks.length} label="Total Tasks" tint="bg-gold-50 text-gold-600" />
        <StatCard icon={BarChart3} value={`${taskCompletionPct}%`} label="Task Completion" tint="bg-maroon-50 text-maroon-500" />
        <StatCard icon={Flame} value={dayStreak} label="Day Streak" tint="bg-red-100 text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-paper-100 rounded-xl border border-paper-200 p-5">
          <div className="font-semibold text-ink_text mb-4 flex items-center gap-2">
            <Calendar size={16} /> Meetings per Week
          </div>
          {meetings.length === 0 ? (
            <EmptyChart text="No meeting data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={meetingsPerWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFE9DA" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8891A0" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8891A0" }} />
                <Tooltip />
                <Bar dataKey="count" fill="#7A1E2E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-paper-100 rounded-xl border border-paper-200 p-5">
          <div className="font-semibold text-ink_text mb-4 flex items-center gap-2">
            <Calendar size={16} /> Meeting Status
          </div>
          {meetingStatusData.length === 0 ? (
            <EmptyChart text="No meeting data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={meetingStatusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {meetingStatusData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-paper-100 rounded-xl border border-paper-200 p-5">
          <div className="font-semibold text-ink_text mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} /> Tasks Completed per Day
          </div>
          {tasks.length === 0 ? (
            <EmptyChart text="No tasks yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tasksPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFE9DA" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8891A0" }} interval={1} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8891A0" }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3F7D5C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-paper-100 rounded-xl border border-paper-200 p-5">
          <div className="font-semibold text-ink_text mb-4 flex items-center gap-2">
            <ListChecks size={16} /> Tasks by Priority
          </div>
          {taskPriorityData.length === 0 ? (
            <EmptyChart text="No tasks yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskPriorityData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {taskPriorityData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ text }) {
  return <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">{text}</div>;
}

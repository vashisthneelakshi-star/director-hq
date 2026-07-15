import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Plus, Search, X, Trash2, CalendarClock, AlertTriangle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { store } from "../lib/storage";

const STATUS_FILTERS = ["All", "To Do", "In Progress", "Done", "Overdue"];
const PRIORITY_FILTERS = ["All", "High", "Medium", "Low"];

const STATUS_MAP = { "To Do": "todo", "In Progress": "in_progress", Done: "done" };
const STATUS_LABEL = { todo: "To Do", in_progress: "In Progress", done: "Done" };
const PRIORITY_STYLE = {
  high: "bg-red-50 text-red-600",
  medium: "bg-amber-50 text-amber-600",
  low: "bg-slate-100 text-slate-500",
};

function isOverdue(task) {
  if (!task.dueDate || task.status === "done") return false;
  const due = new Date(task.dueDate + "T23:59:59");
  return due < new Date();
}

function TaskModal({ task, onClose, onSave, onDelete }) {
  const isEdit = Boolean(task?.id);
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    status: task?.status || "todo",
    dueDate: task?.dueDate || "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Task Details" : "Add Task"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Title <span className="text-red-500">*</span>
            </span>
            <input autoFocus value={form.title} onChange={set("title")} placeholder="Review Q3 budget" className="input mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <textarea value={form.description} onChange={set("description")} placeholder="Additional details..." className="input mt-1 min-h-[80px]" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Priority</span>
              <select value={form.priority} onChange={set("priority")} className="input mt-1">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select value={form.status} onChange={set("status")} className="input mt-1">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Deadline</span>
            <input type="date" value={form.dueDate} onChange={set("dueDate")} className="input mt-1" />
          </label>
          <div className="flex justify-between items-center pt-2">
            {isEdit ? (
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700">
                Save Task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const all = store.getTasks();
    setTasks(all);
    const openId = searchParams.get("id");
    if (openId) {
      const found = all.find((t) => t.id === openId);
      if (found) setEditingTask(found);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      let matchesStatus = true;
      if (statusFilter === "Overdue") matchesStatus = isOverdue(t);
      else if (statusFilter !== "All") matchesStatus = t.status === STATUS_MAP[statusFilter];
      const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter.toLowerCase();
      const q = query.toLowerCase();
      const matchesQuery = !q || t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      return matchesStatus && matchesPriority && matchesQuery;
    });
  }, [tasks, statusFilter, priorityFilter, query]);

  const doneCount = tasks.filter((t) => t.status === "done").length;

  const handleAdd = (form) => {
    const created = store.addTask(form);
    setTasks((t) => [created, ...t]);
    setShowAddModal(false);
  };

  const handleEditSave = (form) => {
    store.updateTask(editingTask.id, form);
    setTasks((list) => list.map((t) => (t.id === editingTask.id ? { ...t, ...form } : t)));
    closeEdit();
  };

  const handleDelete = (id) => {
    store.deleteTask(id);
    setTasks((t) => t.filter((x) => x.id !== id));
    closeEdit();
  };

  const closeEdit = () => {
    setEditingTask(null);
    if (searchParams.get("id")) {
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const quickStatusChange = (task, status) => {
    store.updateTask(task.id, { status });
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status } : t)));
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} of {tasks.length} tasks · {doneCount} done
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Add Task
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2.5 mb-4">
        <Search size={16} className="text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks by title or description..."
          className="flex-1 outline-none text-sm placeholder:text-slate-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 ${
                statusFilter === f ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
              }`}
            >
              {f === "Overdue" && <AlertTriangle size={13} className="text-red-500" />}
              {f}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-slate-200" />
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {PRIORITY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setPriorityFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                priorityFilter === f ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
              <CheckSquare size={26} className="text-slate-400" />
            </div>
            <div className="font-semibold text-slate-800 mb-1">No tasks found</div>
            <p className="text-sm text-slate-500 mb-5">Add your first task to get organized</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
            >
              Add Task
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((t) => {
              const overdue = isOverdue(t);
              return (
                <li key={t.id} className="p-4 flex items-start gap-3">
                  <button
                    onClick={() => setEditingTask(t)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className={`font-medium hover:text-brand-600 ${t.status === "done" ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      {t.title}
                    </div>
                    {t.description && <div className="text-sm text-slate-500 mt-0.5 truncate">{t.description}</div>}
                    {t.dueDate && (
                      <div className={`flex items-center gap-1 text-xs mt-1.5 ${overdue ? "text-red-600 font-medium" : "text-slate-400"}`}>
                        {overdue ? <AlertTriangle size={12} /> : <CalendarClock size={12} />}
                        {overdue ? "Overdue — " : "Due "}
                        {new Date(t.dueDate + "T00:00:00").toLocaleDateString()}
                      </div>
                    )}
                  </button>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${PRIORITY_STYLE[t.priority]}`}>
                    {t.priority}
                  </span>
                  <select
                    value={t.status}
                    onChange={(e) => quickStatusChange(t, e.target.value)}
                    className="text-xs border border-slate-200 rounded-md px-2 py-1.5 text-slate-600 shrink-0"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-red-500 shrink-0">
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showAddModal && (
        <TaskModal onClose={() => setShowAddModal(false)} onSave={handleAdd} />
      )}
      {editingTask && (
        <TaskModal task={editingTask} onClose={closeEdit} onSave={handleEditSave} onDelete={handleDelete} />
      )}
    </div>
  );
}

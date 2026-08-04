import { useEffect, useMemo, useState } from "react";
import { ListChecks, Plus, Star, Trash2, X, Loader2, CalendarClock, ChevronDown, ChevronRight } from "lucide-react";
import { store } from "../lib/storage";
import { Linkify } from "../lib/linkify";

function isOverdue(todo) {
  if (!todo.due_date || todo.completed) return false;
  return new Date(todo.due_date + "T23:59:59") < new Date();
}

function isToday(dateStr) {
  if (!dateStr) return false;
  return dateStr === new Date().toISOString().slice(0, 10);
}

function TodoDetail({ todo, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    title: todo.title || "",
    notes: todo.notes || "",
    dueDate: todo.due_date || "",
    important: Boolean(todo.important),
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
          <h2 className="text-lg font-semibold text-slate-900">Task Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input autoFocus value={form.title} onChange={set("title")} className="input mt-1" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Notes</span>
            <textarea value={form.notes} onChange={set("notes")} rows={3} className="input mt-1" placeholder="Any extra details..." />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Due date</span>
            <input type="date" value={form.dueDate} onChange={set("dueDate")} className="input mt-1" />
          </label>
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={form.important}
              onChange={(e) => setForm((f) => ({ ...f, important: e.target.checked }))}
              className="w-4 h-4 accent-gold-500"
            />
            <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <Star size={14} className="text-gold-500" /> Mark as important
            </span>
          </label>

          <div className="flex justify-between items-center pt-2">
            <button type="button" onClick={() => onDelete(todo.id)} className="text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1">
              <Trash2 size={14} /> Delete
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700">
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function TodoRow({ todo, onToggle, onOpen }) {
  const overdue = isOverdue(todo);
  return (
    <li className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
      <button
        onClick={() => onToggle(todo)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          todo.completed ? "bg-brand-600 border-brand-600" : "border-slate-300 hover:border-brand-500"
        }`}
        aria-label="Toggle complete"
      >
        {todo.completed && <span className="w-2 h-2 rounded-full bg-white" />}
      </button>
      <div role="button" tabIndex={0} onClick={() => onOpen(todo)} className="flex-1 min-w-0 text-left cursor-pointer">
        <div className={`text-sm font-medium ${todo.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>{todo.title}</div>
        {todo.notes && (
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            <Linkify text={todo.notes} />
          </div>
        )}
        {todo.due_date && (
          <div className={`flex items-center gap-1 text-xs mt-1 ${overdue ? "text-red-600 font-medium" : isToday(todo.due_date) ? "text-brand-600 font-medium" : "text-slate-400"}`}>
            <CalendarClock size={11} />
            {overdue ? "Overdue — " : isToday(todo.due_date) ? "Today — " : ""}
            {new Date(todo.due_date + "T00:00:00").toLocaleDateString()}
          </div>
        )}
      </div>
      {todo.important && <Star size={15} className="text-gold-500 fill-gold-500 shrink-0 mt-0.5" />}
    </li>
  );
}

export default function Todo() {
  const [todos, setTodos] = useState([]);
  const [quickTitle, setQuickTitle] = useState("");
  const [detailTodo, setDetailTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    (async () => {
      setTodos(await store.getTodos());
      setLoading(false);
    })();
  }, []);

  const { active, important, completed } = useMemo(() => {
    const active = todos.filter((t) => !t.completed);
    return {
      active,
      important: active.filter((t) => t.important),
      completed: todos.filter((t) => t.completed),
    };
  }, [todos]);

  const otherActive = active.filter((t) => !t.important);

  const quickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const created = await store.addTodo({ title: quickTitle.trim() });
    setTodos((t) => [created, ...t]);
    setQuickTitle("");
  };

  const toggle = async (todo) => {
    const completed = !todo.completed;
    setTodos((list) => list.map((t) => (t.id === todo.id ? { ...t, completed } : t)));
    await store.updateTodo(todo.id, { completed });
  };

  const saveDetail = async (form) => {
    await store.updateTodo(detailTodo.id, form);
    setTodos((list) =>
      list.map((t) =>
        t.id === detailTodo.id ? { ...t, title: form.title, notes: form.notes, due_date: form.dueDate, important: form.important } : t
      )
    );
    setDetailTodo(null);
  };

  const deleteTodo = async (id) => {
    await store.deleteTodo(id);
    setTodos((list) => list.filter((t) => t.id !== id));
    setDetailTodo(null);
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
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ListChecks size={24} className="text-brand-600" /> To-Do List
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {active.length} pending · {completed.length} done
        </p>
      </div>

      <form onSubmit={quickAdd} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2.5 mb-5">
        <Plus size={16} className="text-brand-600 shrink-0" />
        <input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add a task and press Enter..."
          className="flex-1 outline-none text-sm placeholder:text-slate-400"
        />
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {active.length === 0 && completed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
              <ListChecks size={26} className="text-slate-400" />
            </div>
            <div className="font-semibold text-slate-800 mb-1">All clear</div>
            <p className="text-sm text-slate-500">Add a task above to get started</p>
          </div>
        ) : (
          <>
            {important.length > 0 && (
              <>
                <div className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Important</div>
                <ul className="divide-y divide-slate-100">
                  {important.map((t) => (
                    <TodoRow key={t.id} todo={t} onToggle={toggle} onOpen={setDetailTodo} />
                  ))}
                </ul>
              </>
            )}
            {otherActive.length > 0 && (
              <>
                {important.length > 0 && <div className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Tasks</div>}
                <ul className="divide-y divide-slate-100">
                  {otherActive.map((t) => (
                    <TodoRow key={t.id} todo={t} onToggle={toggle} onOpen={setDetailTodo} />
                  ))}
                </ul>
              </>
            )}
            {completed.length > 0 && (
              <div className="border-t border-slate-100">
                <button
                  onClick={() => setShowCompleted((s) => !s)}
                  className="w-full flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hover:bg-slate-50"
                >
                  {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  Completed ({completed.length})
                </button>
                {showCompleted && (
                  <ul className="divide-y divide-slate-100">
                    {completed.map((t) => (
                      <TodoRow key={t.id} todo={t} onToggle={toggle} onOpen={setDetailTodo} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {detailTodo && <TodoDetail todo={detailTodo} onClose={() => setDetailTodo(null)} onSave={saveDetail} onDelete={deleteTodo} />}
    </div>
  );
}

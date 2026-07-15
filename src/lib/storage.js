// Simple localStorage-backed data layer for Director HQ.
// NOTE: This is client-side only storage with no encryption — fine for a
// personal single-user tool run locally, not a substitute for a real
// secrets manager if you're storing sensitive passwords.

const KEYS = {
  meetings: "directorhq:meetings",
  tasks: "directorhq:tasks",
  credentials: "directorhq:credentials",
};

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const store = {
  // Meetings
  getMeetings: () => read(KEYS.meetings),
  addMeeting: (meeting) => {
    const list = read(KEYS.meetings);
    const withId = { id: uid(), status: "scheduled", ...meeting };
    write(KEYS.meetings, [withId, ...list]);
    return withId;
  },
  updateMeeting: (id, patch) => {
    const list = read(KEYS.meetings).map((m) => (m.id === id ? { ...m, ...patch } : m));
    write(KEYS.meetings, list);
  },
  deleteMeeting: (id) => {
    write(KEYS.meetings, read(KEYS.meetings).filter((m) => m.id !== id));
  },

  // Tasks
  getTasks: () => read(KEYS.tasks),
  addTask: (task) => {
    const list = read(KEYS.tasks);
    const withId = { id: uid(), status: "todo", priority: "medium", ...task };
    write(KEYS.tasks, [withId, ...list]);
    return withId;
  },
  updateTask: (id, patch) => {
    const list = read(KEYS.tasks).map((t) => (t.id === id ? { ...t, ...patch } : t));
    write(KEYS.tasks, list);
  },
  deleteTask: (id) => {
    write(KEYS.tasks, read(KEYS.tasks).filter((t) => t.id !== id));
  },

  // Credentials
  getCredentials: () => read(KEYS.credentials),
  addCredential: (cred) => {
    const list = read(KEYS.credentials);
    const withId = { id: uid(), ...cred };
    write(KEYS.credentials, [withId, ...list]);
    return withId;
  },
  deleteCredential: (id) => {
    write(KEYS.credentials, read(KEYS.credentials).filter((c) => c.id !== id));
  },
};

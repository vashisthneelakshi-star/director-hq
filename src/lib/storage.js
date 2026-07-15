// Supabase-backed data layer for Director HQ.
// Every row is scoped to the signed-in user via `owner_id` + Row Level
// Security policies (see supabase/schema.sql), so each director only ever
// sees their own meetings, tasks, credentials and notes.

import { supabase } from "./supabaseClient";

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  const id = data?.user?.id;
  if (!id) throw new Error("Not signed in");
  return id;
}

function mapMeetingOut(row) {
  return row;
}

function taskToDb(task) {
  const { dueDate, ...rest } = task;
  const out = { ...rest };
  if (dueDate !== undefined) out.due_date = dueDate || null;
  return out;
}

function taskFromDb(row) {
  if (!row) return row;
  const { due_date, ...rest } = row;
  return { ...rest, dueDate: due_date };
}

export const store = {
  // Meetings
  async getMeetings() {
    const { data, error } = await supabase.from("meetings").select("*").order("date", { ascending: true });
    if (error) throw error;
    return data.map(mapMeetingOut);
  },
  async addMeeting(meeting) {
    const owner_id = await currentUserId();
    const { data, error } = await supabase
      .from("meetings")
      .insert([{ ...meeting, status: meeting.status || "scheduled", owner_id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async updateMeeting(id, patch) {
    const { error } = await supabase.from("meetings").update(patch).eq("id", id);
    if (error) throw error;
  },
  async deleteMeeting(id) {
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) throw error;
  },

  // Tasks
  async getTasks() {
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(taskFromDb);
  },
  async addTask(task) {
    const owner_id = await currentUserId();
    const { data, error } = await supabase
      .from("tasks")
      .insert([{ status: "todo", priority: "medium", ...taskToDb(task), owner_id }])
      .select()
      .single();
    if (error) throw error;
    return taskFromDb(data);
  },
  async updateTask(id, patch) {
    const { error } = await supabase.from("tasks").update(taskToDb(patch)).eq("id", id);
    if (error) throw error;
  },
  async deleteTask(id) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
  },

  // Credentials
  async getCredentials() {
    const { data, error } = await supabase.from("credentials").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async addCredential(cred) {
    const owner_id = await currentUserId();
    const { data, error } = await supabase
      .from("credentials")
      .insert([{ ...cred, owner_id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async updateCredential(id, patch) {
    const { error } = await supabase.from("credentials").update(patch).eq("id", id);
    if (error) throw error;
  },
  async deleteCredential(id) {
    const { error } = await supabase.from("credentials").delete().eq("id", id);
    if (error) throw error;
  },

  // Notes
  async getNotes() {
    const { data, error } = await supabase.from("notes").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async addNote(note) {
    const owner_id = await currentUserId();
    const { data, error } = await supabase
      .from("notes")
      .insert([{ title: "Untitled", body: "", ...note, owner_id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async updateNote(id, patch) {
    const { data, error } = await supabase
      .from("notes")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteNote(id) {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) throw error;
  },
};

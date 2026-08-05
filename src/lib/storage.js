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
  const { dueDate, assignmentType, personName, givenByName, givenToName, taskType, ...rest } = task;
  const out = { ...rest };
  if (dueDate !== undefined) out.due_date = dueDate || null;
  if (givenByName !== undefined) out.given_by_name = givenByName || null;
  if (givenToName !== undefined) out.given_to_name = givenToName || null;
  if (taskType !== undefined) out.task_type = taskType || "official";
  return out;
}

function taskFromDb(row) {
  if (!row) return row;
  const { due_date, assignment_type, person_name, given_by_name, given_to_name, task_type, ...rest } = row;
  return {
    ...rest,
    dueDate: due_date,
    givenByName: given_by_name || "",
    givenToName: given_to_name || "",
    taskType: task_type || "official",
  };
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

  // Minutes of Meeting (per-meeting action item table)
  async getMomItems(meetingId) {
    const { data, error } = await supabase
      .from("mom_items")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("s_no", { ascending: true });
    if (error) throw error;
    return data;
  },
  // Replaces the full set of rows for a meeting (simplest way to support
  // reordering/removing rows from the editor without tracking per-row diffs).
  async saveMomItems(meetingId, items) {
    const owner_id = await currentUserId();
    const { error: delErr } = await supabase.from("mom_items").delete().eq("meeting_id", meetingId);
    if (delErr) throw delErr;
    if (!items || items.length === 0) return [];
    const rows = items.map((it, idx) => ({
      meeting_id: meetingId,
      owner_id,
      s_no: idx + 1,
      topic: it.topic || "",
      assign_to: it.assignTo || "",
      assign_to_email: it.assignToEmail || null,
      date_of_completion: it.dateOfCompletion || null,
      followup_remark: it.followupRemark || "",
    }));
    const { data, error } = await supabase.from("mom_items").insert(rows).select();
    if (error) throw error;
    return data;
  },

  // To-Do List
  async getTodos() {
    const { data, error } = await supabase.from("todos").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  async addTodo(form) {
    const owner_id = await currentUserId();
    const { data, error } = await supabase
      .from("todos")
      .insert([
        {
          owner_id,
          title: form.title,
          notes: form.notes || null,
          due_date: form.dueDate || null,
          important: Boolean(form.important),
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async updateTodo(id, patch) {
    const row = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.notes !== undefined) row.notes = patch.notes || null;
    if (patch.dueDate !== undefined) row.due_date = patch.dueDate || null;
    if (patch.important !== undefined) row.important = Boolean(patch.important);
    if (patch.completed !== undefined) {
      row.completed = Boolean(patch.completed);
      row.completed_at = patch.completed ? new Date().toISOString() : null;
    }
    const { error } = await supabase.from("todos").update(row).eq("id", id);
    if (error) throw error;
  },
  async deleteTodo(id) {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) throw error;
  },

  // Calendar day notes ("what's on this day")
  async getCalendarNotesRange(startDate, endDate) {
    const { data, error } = await supabase
      .from("calendar_notes")
      .select("*")
      .gte("note_date", startDate)
      .lte("note_date", endDate);
    if (error) throw error;
    return data;
  },
  async saveCalendarNote(dateStr, content) {
    const owner_id = await currentUserId();
    if (!content || !content.trim()) {
      const { error } = await supabase.from("calendar_notes").delete().eq("owner_id", owner_id).eq("note_date", dateStr);
      if (error) throw error;
      return null;
    }
    const { data, error } = await supabase
      .from("calendar_notes")
      .upsert([{ owner_id, note_date: dateStr, content, updated_at: new Date().toISOString() }], { onConflict: "owner_id,note_date" })
      .select()
      .single();
    if (error) throw error;
    return data;
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

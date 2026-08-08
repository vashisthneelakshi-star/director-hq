import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Clock,
  MapPin,
  Users,
  Trash2,
  Loader2,
  AlertTriangle,
  UserRound,
  ClipboardList,
  Mail,
  Sparkles,
  Upload,
  Eye,
  FileText,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { store } from "../lib/storage";
import { Linkify } from "../lib/linkify";
import { useAuth } from "../lib/AuthContext";
import { isAdminEmail } from "../lib/isAdmin";
import { useDirectors } from "../lib/useDirectors";
import { sendMeetingInviteEmail, sendFollowupReminderEmail } from "../lib/mail";
import { extractMomItems } from "../lib/momExtract";

const FILTERS = ["All", "Scheduled", "Needs Update", "Completed", "Cancelled"];

// A meeting whose date has passed but is still marked "Scheduled" — the
// director never came back to mark it Completed or Cancelled.
function isStale(meeting) {
  if (meeting.status !== "scheduled" || !meeting.date) return false;
  return new Date(meeting.date + "T23:59:59") < new Date();
}

function EmptyState({ onSchedule }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
        <Calendar size={26} className="text-slate-400" />
      </div>
      <div className="font-semibold text-slate-800 mb-1">No meetings found</div>
      <p className="text-sm text-slate-500 mb-5">Schedule your first meeting to get started</p>
      <button
        onClick={onSchedule}
        className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        Schedule Meeting
      </button>
    </div>
  );
}

function MeetingModal({ meeting, onClose, onSave, onDelete, onOpenMinutes }) {
  const isEdit = Boolean(meeting?.id);
  const [form, setForm] = useState({
    title: meeting?.title || "",
    date: meeting?.date || "",
    time: meeting?.time || "",
    location: meeting?.location || "",
    attendees: meeting?.attendees || "",
    agenda: meeting?.agenda || "",
    status: meeting?.status || "scheduled",
  });
  const [inviteTo, setInviteTo] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    onSave(form);
  };

  const sendInvite = async () => {
    if (!inviteTo.trim()) {
      setInviteMsg("Pehle email address daalo");
      return;
    }
    if (!form.title.trim() || !form.date) {
      setInviteMsg("Title aur date bharo pehle");
      return;
    }
    setSendingInvite(true);
    setInviteMsg("");
    try {
      await sendMeetingInviteEmail({ to: inviteTo, form });
      setInviteMsg("Invite bhej diya gaya ✓");
    } catch (err) {
      setInviteMsg("Error: " + err.message);
    } finally {
      setSendingInvite(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Meeting Details" : "Schedule Meeting"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title" required>
            <input autoFocus value={form.title} onChange={set("title")} placeholder="Quarterly review" className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" required>
              <input type="date" value={form.date} onChange={set("date")} className="input" />
            </Field>
            <Field label="Time">
              <input type="time" value={form.time} onChange={set("time")} className="input" />
            </Field>
          </div>
          <Field label="Location">
            <input value={form.location} onChange={set("location")} placeholder="Meeting room / link" className="input" />
          </Field>
          <Field label="Attendees">
            <input value={form.attendees} onChange={set("attendees")} placeholder="Comma separated names" className="input" />
          </Field>
          <Field label="Agenda">
            <textarea
              rows={4}
              value={form.agenda}
              onChange={set("agenda")}
              placeholder={"Ek line me ek agenda point likho\ne.g.\nBudget review\nNew hires update"}
              className="input"
            />
          </Field>
          {isEdit && (
            <Field label="Status">
              <select value={form.status} onChange={set("status")} className="input">
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
          )}

          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <Mail size={14} /> Send invite by email (agenda included)
            </div>
            <div className="flex gap-2">
              <input
                value={inviteTo}
                onChange={(e) => setInviteTo(e.target.value)}
                placeholder="email1@company.com, email2@company.com"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={sendInvite}
                disabled={sendingInvite}
                className="px-3 py-2 text-sm font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-900 whitespace-nowrap disabled:opacity-60"
              >
                {sendingInvite ? "Sending..." : "Send"}
              </button>
            </div>
            {inviteMsg && <p className="text-xs mt-1.5 text-slate-600">{inviteMsg}</p>}
          </div>

          {isEdit && (
            <button
              type="button"
              onClick={() => onOpenMinutes(meeting)}
              className="w-full flex items-center justify-center gap-1.5 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ClipboardList size={15} /> Minutes of Meeting
            </button>
          )}

          <div className="flex justify-between items-center pt-2">
            {isEdit ? (
              <button
                type="button"
                onClick={() => onDelete(meeting.id)}
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
                Save Meeting
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function emptyRow(sNo) {
  return { sNo, topic: "", assignTo: "", assignToEmail: "", dateOfCompletion: "", followupRemark: "" };
}

function MinutesModal({ meeting, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingIdx, setSendingIdx] = useState(null);
  const [rowMsg, setRowMsg] = useState({});
  const [saveMsg, setSaveMsg] = useState("");

  // Paste-or-upload auto-extract
  const [showInput, setShowInput] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pickedFile, setPickedFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  // The source used in the most recent successful extraction — kept separately
  // from pasteText/pickedFile (which reset after each extraction round) so it
  // still gets saved when "Save Minutes" is clicked, even after several
  // upload/paste/manual rounds in the same session.
  const [pendingSourceFile, setPendingSourceFile] = useState(null);
  const [pendingSourceText, setPendingSourceText] = useState("");

  // What's actually been saved for this meeting (used by the "view source" icon)
  const [savedSourceText, setSavedSourceText] = useState(meeting.mom_source_text || "");
  const [savedFilePath, setSavedFilePath] = useState(meeting.mom_source_file_url || "");
  const [savedFileName, setSavedFileName] = useState(meeting.mom_source_file_name || "");
  const [viewerText, setViewerText] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState("");

  useEffect(() => {
    (async () => {
      const items = await store.getMomItems(meeting.id);
      setRows(
        items && items.length
          ? items.map((it, i) => ({
              id: it.id,
              sNo: i + 1,
              topic: it.topic || "",
              assignTo: it.assign_to || "",
              assignToEmail: it.assign_to_email || "",
              dateOfCompletion: it.date_of_completion || "",
              followupRemark: it.followup_remark || "",
            }))
          : [emptyRow(1)]
      );
      setLoading(false);
    })();
  }, [meeting.id]);

  const updateRow = (idx, key, value) => {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, [key]: value } : row)));
  };

  const addRow = () => setRows((r) => [...r, emptyRow(r.length + 1)]);

  const removeRow = (idx) => setRows((r) => r.filter((_, i) => i !== idx).map((row, i) => ({ ...row, sNo: i + 1 })));

  const handleExtract = async () => {
    if (!pasteText.trim() && !pickedFile) {
      setExtractError("Pehle text paste karo ya file chuno");
      return;
    }
    setExtracting(true);
    setExtractError("");
    try {
      const { items, sourceText } = await extractMomItems(
        pickedFile ? { file: pickedFile } : { text: pasteText }
      );
      if (items.length === 0) {
        setExtractError("Koi item nahi mila is text/file mein");
        return;
      }
      setRows((prev) => {
        const existing = prev.filter((r) => r.topic.trim() || r.assignTo.trim());
        const added = items.map((it) => ({
          topic: it.topic,
          assignTo: it.assignTo,
          assignToEmail: "",
          dateOfCompletion: it.dateOfCompletion,
          followupRemark: "",
        }));
        return [...existing, ...added].map((row, i) => ({ ...row, sNo: i + 1 }));
      });
      // Reset the input area so it's ready for another round — file, then
      // paste, then manually adding a row all keep stacking onto the table
      // instead of the panel getting "stuck" on the previous input.
      if (pickedFile) {
        setPendingSourceFile(pickedFile);
        setPendingSourceText("");
      } else {
        setPendingSourceText(sourceText);
        setPendingSourceFile(null);
      }
      setPickedFile(null);
      setPasteText("");
      setShowInput(false);
    } catch (err) {
      setExtractError(err.message || "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const viewSource = async () => {
    setViewerError("");
    if (savedFilePath) {
      setViewerLoading(true);
      try {
        const url = await store.getMomSourceFileUrl(savedFilePath);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (err) {
        setViewerError(err.message || "File nahi khul payi");
      } finally {
        setViewerLoading(false);
      }
    } else if (savedSourceText) {
      setViewerText(savedSourceText);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const cleaned = rows.filter((r) => r.topic.trim() || r.assignTo.trim());
      await store.saveMomItems(meeting.id, cleaned);

      // Persist whatever source (pasted text or uploaded file) was used this session
      const patch = {};
      if (pendingSourceFile) {
        const path = await store.uploadMomSourceFile(pendingSourceFile);
        patch.mom_source_file_url = path;
        patch.mom_source_file_name = pendingSourceFile.name;
        patch.mom_source_text = null;
      } else if (pendingSourceText.trim() && pendingSourceText !== savedSourceText) {
        patch.mom_source_text = pendingSourceText;
        patch.mom_source_file_url = null;
        patch.mom_source_file_name = null;
      }
      if (Object.keys(patch).length > 0) {
        await store.updateMeeting(meeting.id, patch);
        setSavedSourceText(patch.mom_source_text ?? savedSourceText);
        setSavedFilePath(patch.mom_source_file_url ?? savedFilePath);
        setSavedFileName(patch.mom_source_file_name ?? savedFileName);
        setPendingSourceFile(null);
        setPendingSourceText("");
      }

      setSaveMsg("Minutes save ho gaye ✓");
    } catch (err) {
      setSaveMsg("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const sendReminder = async (row, idx) => {
    if (!row.assignToEmail.trim()) {
      setRowMsg((m) => ({ ...m, [idx]: "Email daalo pehle" }));
      return;
    }
    setSendingIdx(idx);
    setRowMsg((m) => ({ ...m, [idx]: "" }));
    try {
      await sendFollowupReminderEmail({ meetingTitle: meeting.title, row });
      setRowMsg((m) => ({ ...m, [idx]: "Reminder bhej diya ✓" }));
    } catch (err) {
      setRowMsg((m) => ({ ...m, [idx]: "Error: " + err.message }));
    } finally {
      setSendingIdx(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              Minutes of Meeting
              {(savedSourceText || savedFilePath) && (
                <button
                  type="button"
                  onClick={viewSource}
                  disabled={viewerLoading}
                  title={savedFileName ? `View source: ${savedFileName}` : "View pasted source text"}
                  className="text-slate-400 hover:text-brand-600 disabled:opacity-50"
                >
                  {viewerLoading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                </button>
              )}
            </h2>
            <p className="text-sm text-slate-500">{meeting.title}</p>
            {viewerError && <p className="text-xs text-red-500 mt-1">{viewerError}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-4 shrink-0">
          {!showInput ? (
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
            >
              <Sparkles size={14} /> Paste or upload notes to auto-fill this table
            </button>
          ) : (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/60">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-brand-600" /> Auto-fill from notes
                </p>
                <button type="button" onClick={() => setShowInput(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <textarea
                rows={4}
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value);
                  if (e.target.value) setPickedFile(null);
                }}
                placeholder="Meeting notes yahan paste karo..."
                className="input w-full mb-2"
                disabled={Boolean(pickedFile)}
              />
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-200 bg-white rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-50">
                  <Upload size={14} />
                  {pickedFile ? pickedFile.name : "Upload PDF / Word"}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setPickedFile(f);
                        setPasteText("");
                      }
                    }}
                  />
                </label>
                {pickedFile && (
                  <button type="button" onClick={() => setPickedFile(null)} className="text-xs text-red-500 hover:underline">
                    Remove file
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={extracting}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {extracting && <Loader2 size={13} className="animate-spin" />}
                  Extract items
                </button>
              </div>
              {extractError && <p className="text-xs text-red-500 mt-2">{extractError}</p>}
              <p className="text-xs text-slate-400 mt-2">
                Jo topic/naam/date mile wo table mein bhar jayega, baaki blank rahega — aap edit kar sakte ho.
              </p>
            </div>
          )}
        </div>

        {viewerText !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setViewerText(null)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <FileText size={14} /> Source text
                </p>
                <button onClick={() => setViewerText(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <pre className="p-5 overflow-auto text-sm text-slate-700 whitespace-pre-wrap font-sans">{viewerText}</pre>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-maroon-500" size={22} />
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-2 w-10">S.No</th>
                  <th className="py-2 pr-2 w-1/4">Topic</th>
                  <th className="py-2 pr-2 w-32">Assign To</th>
                  <th className="py-2 pr-2 w-40">Email (for reminder)</th>
                  <th className="py-2 pr-2 w-32">Date of Completion</th>
                  <th className="py-2 pr-2">Follow-up Remark</th>
                  <th className="py-2 pr-2 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id || idx} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-2 text-slate-500 pt-3">{row.sNo}</td>
                    <td className="py-2 pr-2">
                      <textarea rows={2} value={row.topic} onChange={(e) => updateRow(idx, "topic", e.target.value)} className="input w-full" />
                    </td>
                    <td className="py-2 pr-2">
                      <input value={row.assignTo} onChange={(e) => updateRow(idx, "assignTo", e.target.value)} className="input w-full" />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="email"
                        value={row.assignToEmail}
                        onChange={(e) => updateRow(idx, "assignToEmail", e.target.value)}
                        placeholder="name@company.com"
                        className="input w-full"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="date"
                        value={row.dateOfCompletion}
                        onChange={(e) => updateRow(idx, "dateOfCompletion", e.target.value)}
                        className="input w-full"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <textarea
                        rows={2}
                        value={row.followupRemark}
                        onChange={(e) => updateRow(idx, "followupRemark", e.target.value)}
                        className="input w-full"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => sendReminder(row, idx)}
                          disabled={sendingIdx === idx}
                          className="text-xs text-brand-600 hover:underline text-left disabled:opacity-60"
                        >
                          {sendingIdx === idx ? "Sending..." : "Send reminder"}
                        </button>
                        <button type="button" onClick={() => removeRow(idx)} className="text-xs text-red-500 hover:underline text-left">
                          Remove row
                        </button>
                        {rowMsg[idx] && <span className="text-[11px] text-slate-500">{rowMsg[idx]}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button type="button" onClick={addRow} className="mt-4 text-sm font-medium text-brand-600 hover:underline flex items-center gap-1">
            <Plus size={14} /> Add row
          </button>
          <p className="text-xs text-slate-400 mt-4">
            Email daalne par us row ke liye "Send reminder" se turant mail ja sakti hai, aur agar Date of Completion aaj ya nikal chuki hai to system
            khud-ba-khud bhi ek reminder bhej dega.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-slate-100 shrink-0">
          <span className="text-xs text-slate-500">{saveMsg}</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
              Close
            </button>
            <button onClick={save} disabled={saving} className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save Minutes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function Meetings() {
  const { user } = useAuth();
  const admin = isAdminEmail(user?.email);
  const { nameFor } = useDirectors(admin);
  const [meetings, setMeetings] = useState([]);
  const [view, setView] = useState("list");
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("status") || "All");
  const [query, setQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [minutesMeeting, setMinutesMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const all = await store.getMeetings();
      setMeetings(all);
      const openId = searchParams.get("id");
      if (openId) {
        const found = all.find((m) => m.id === openId);
        if (found) setEditingMeeting(found);
      }
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Needs Update" ? isStale(m) : m.status === filter.toLowerCase());
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        m.title?.toLowerCase().includes(q) ||
        m.attendees?.toLowerCase().includes(q) ||
        m.location?.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [meetings, filter, query]);

  const handleAdd = async (form) => {
    const created = await store.addMeeting(form);
    setMeetings((m) => [created, ...m]);
    setShowAddModal(false);
  };

  const handleEditSave = async (form) => {
    await store.updateMeeting(editingMeeting.id, form);
    setMeetings((list) => list.map((m) => (m.id === editingMeeting.id ? { ...m, ...form } : m)));
    closeEdit();
  };

  const handleDelete = async (id) => {
    await store.deleteMeeting(id);
    setMeetings((m) => m.filter((x) => x.id !== id));
    closeEdit();
  };

  const closeEdit = () => {
    setEditingMeeting(null);
    if (searchParams.get("id")) {
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const openMinutesFromModal = (meeting) => {
    setEditingMeeting(null);
    setMinutesMeeting(meeting);
  };

  const setStatus = async (id, status) => {
    await store.updateMeeting(id, { status });
    setMeetings((m) => m.map((x) => (x.id === id ? { ...x, status } : x)));
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
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meeting Schedule</h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} of {meetings.length} meetings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
                view === "list" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
              }`}
            >
              <List size={15} /> List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
                view === "calendar" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
              }`}
            >
              <Calendar size={15} /> Calendar
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Plus size={16} /> Schedule Meeting
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2.5">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, attendees, location..."
            className="flex-1 outline-none text-sm placeholder:text-slate-400"
          />
        </div>
        <button className="flex items-center gap-1.5 border border-slate-200 bg-white px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600">
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      <div className="flex gap-1 mb-5 bg-slate-100 rounded-lg p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              filter === f ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        {filtered.length === 0 ? (
          <EmptyState onSchedule={() => setShowAddModal(true)} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((m) => (
              <li key={m.id} className="p-4 flex items-start justify-between gap-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditingMeeting(m)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setEditingMeeting(m)}
                  className="min-w-0 text-left flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium text-slate-900 hover:text-brand-600">{m.title}</div>
                    {isStale(m) && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        <AlertTriangle size={10} /> Needs update
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                    {m.date && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(m.date).toLocaleDateString()} {m.time}
                      </span>
                    )}
                    {m.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> <Linkify text={m.location} />
                      </span>
                    )}
                    {m.attendees && (
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {m.attendees}
                      </span>
                    )}
                    {admin && nameFor(m.owner_id) && (
                      <span className="flex items-center gap-1 text-brand-600 font-medium">
                        <UserRound size={12} /> {nameFor(m.owner_id)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setMinutesMeeting(m)}
                    title="Minutes of Meeting"
                    className="text-slate-400 hover:text-brand-600"
                  >
                    <ClipboardList size={16} />
                  </button>
                  <select
                    value={m.status}
                    onChange={(e) => setStatus(m.id, e.target.value)}
                    className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-600"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button onClick={() => handleDelete(m.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAddModal && <MeetingModal onClose={() => setShowAddModal(false)} onSave={handleAdd} onOpenMinutes={openMinutesFromModal} />}
      {editingMeeting && (
        <MeetingModal
          meeting={editingMeeting}
          onClose={closeEdit}
          onSave={handleEditSave}
          onDelete={handleDelete}
          onOpenMinutes={openMinutesFromModal}
        />
      )}
      {minutesMeeting && <MinutesModal meeting={minutesMeeting} onClose={() => setMinutesMeeting(null)} />}
    </div>
  );
}

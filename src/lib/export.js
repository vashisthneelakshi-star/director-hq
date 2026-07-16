import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportCredentialsCSV(credentials) {
  const headers = ["Site Name", "Website URL", "Username / Email", "Password", "Notes"];
  const rows = credentials.map((c) => [c.site, c.url, c.username, c.password, c.notes]);
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadBlob(csv, `credentials-${dateStamp()}.csv`, "text/csv;charset=utf-8;");
}

export function exportCredentialsPDF(credentials) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Credentials Vault", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Exported ${new Date().toLocaleString()}`, 14, 24);

  autoTable(doc, {
    startY: 30,
    head: [["Site Name", "Website URL", "Username / Email", "Password", "Notes"]],
    body: credentials.map((c) => [c.site || "", c.url || "", c.username || "", c.password || "", c.notes || ""]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229] },
  });

  doc.save(`credentials-${dateStamp()}.pdf`);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function exportMeetingsCSV(meetings) {
  const headers = ["Title", "Date", "Time", "Location", "Attendees", "Status"];
  const rows = meetings.map((m) => [m.title, m.date, m.time, m.location, m.attendees, m.status]);
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadBlob(csv, `meetings-${dateStamp()}.csv`, "text/csv;charset=utf-8;");
}

export function exportMeetingsPDF(meetings) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Meeting Schedule", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Exported ${new Date().toLocaleString()}`, 14, 24);
  autoTable(doc, {
    startY: 30,
    head: [["Title", "Date", "Time", "Location", "Attendees", "Status"]],
    body: meetings.map((m) => [m.title || "", m.date || "", m.time || "", m.location || "", m.attendees || "", m.status || ""]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [122, 30, 46] },
  });
  doc.save(`meetings-${dateStamp()}.pdf`);
}

export function exportTasksCSV(tasks) {
  const headers = ["Title", "Description", "Priority", "Status", "Due Date"];
  const rows = tasks.map((t) => [t.title, t.description, t.priority, t.status, t.dueDate]);
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadBlob(csv, `tasks-${dateStamp()}.csv`, "text/csv;charset=utf-8;");
}

export function exportTasksPDF(tasks) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Daily Tasks", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Exported ${new Date().toLocaleString()}`, 14, 24);
  autoTable(doc, {
    startY: 30,
    head: [["Title", "Description", "Priority", "Status", "Due Date"]],
    body: tasks.map((t) => [t.title || "", t.description || "", t.priority || "", t.status || "", t.dueDate || ""]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [122, 30, 46] },
  });
  doc.save(`tasks-${dateStamp()}.pdf`);
}

export function exportNotesIndexCSV(notes) {
  const headers = ["Title", "Excerpt", "Last Updated"];
  const rows = notes.map((n) => [n.title, (n.body || "").slice(0, 120), n.updated_at]);
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadBlob(csv, `notes-index-${dateStamp()}.csv`, "text/csv;charset=utf-8;");
}

export function exportSummaryPDF({ meetings, tasks, credentials }) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setTextColor(122, 30, 46);
  doc.text("Director HQ — Productivity Summary", 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 27);

  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.text(`Meetings: ${meetings.length}`, 14, 38);
  doc.text(`Tasks: ${tasks.length}  (${tasks.filter((t) => t.status === "done").length} done)`, 14, 45);
  doc.text(`Saved credentials: ${credentials.length}`, 14, 52);

  autoTable(doc, {
    startY: 60,
    head: [["Meetings", "Date", "Status"]],
    body: meetings.slice(0, 15).map((m) => [m.title || "", m.date || "", m.status || ""]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [122, 30, 46] },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Tasks", "Priority", "Status"]],
    body: tasks.slice(0, 15).map((t) => [t.title || "", t.priority || "", t.status || ""]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [184, 134, 62] },
  });

  doc.save(`productivity-summary-${dateStamp()}.pdf`);
}

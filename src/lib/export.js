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

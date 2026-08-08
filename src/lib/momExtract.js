import { supabase } from "./supabaseClient";

async function authToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Pass either { text } (pasted notes) or { file } (a File object from an <input type="file">).
export async function extractMomItems({ text, file }) {
  const token = await authToken();
  const payload = text
    ? { text }
    : { fileBase64: await fileToBase64(file), fileName: file.name, mimeType: file.type };

  const res = await fetch("/api/extract-mom", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Extraction failed");
  return json; // { items, sourceText }
}

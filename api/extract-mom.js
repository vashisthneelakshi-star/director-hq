import { createClient } from "@supabase/supabase-js";

// Accepts pasted meeting-notes text, or a base64-encoded PDF/DOCX file, and
// asks Groq's free API (Llama 3.3) to pull out a structured action-item
// table: topic, who it's assigned to, and a date of completion if one is
// mentioned — leaving whatever isn't present blank rather than guessing.
//
// POST body: { text } OR { fileBase64, fileName, mimeType }
// Returns: { items: [{ topic, assignTo, dateOfCompletion }], sourceText }

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

async function extractTextFromFile(fileBase64, mimeType, fileName) {
  const buffer = Buffer.from(fileBase64, "base64");
  const isDocx =
    mimeType?.includes("wordprocessingml") || /\.docx$/i.test(fileName || "") || mimeType?.includes("msword");
  const isPdf = mimeType?.includes("pdf") || /\.pdf$/i.test(fileName || "");

  if (isDocx) {
    const mammoth = (await import("mammoth")).default;
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  if (isPdf) {
    const pdfParse = (await import("pdf-parse")).default;
    const { text } = await pdfParse(buffer);
    return text;
  }
  throw new Error("Unsupported file type — upload a PDF or Word (.docx) file");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: "Missing required environment variables" });
  }
  if (!groqKey) {
    return res.status(500).json({ error: "GROQ_API_KEY is not configured on the server" });
  }

  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return res.status(401).json({ error: "Invalid session" });

  const { text, fileBase64, fileName, mimeType } = req.body || {};

  let sourceText = text || "";
  try {
    if (!sourceText && fileBase64) {
      sourceText = await extractTextFromFile(fileBase64, mimeType, fileName);
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  sourceText = (sourceText || "").trim();
  if (!sourceText) {
    return res.status(400).json({ error: "No text found — paste some notes or upload a readable PDF/Word file" });
  }
  // Keep prompts reasonably sized
  const clipped = sourceText.slice(0, 20000);

  const prompt = `You are extracting a Minutes-of-Meeting action-item table from raw meeting notes.

Read the notes below and return a JSON array of action items. For each item include:
- "topic": what needs to be done (short phrase, required)
- "assignTo": the person's name it's assigned to, if mentioned — otherwise ""
- "dateOfCompletion": a due/completion date if one is mentioned, formatted as YYYY-MM-DD — otherwise ""

Only include an item if there's an identifiable topic/task. Leave assignTo or dateOfCompletion as "" when not stated in the text — never invent a name or date.

CRITICAL RULE — do not duplicate headings and their sub-points as separate rows:
Numbered points in these notes are often followed by their own indented/re-numbered sub-points. The top-level number is just a section heading for the sub-points below it, NOT a task itself. When a numbered point is immediately followed by its own list of sub-points, SKIP that heading entirely and output only the sub-points. Only output the top-level point by itself if it has no sub-points under it.

Example input:
  3. The mission needs to be refined and implemented for readers.
    1. Defining the mission for readers.
    2. Conducting a Reader's Understanding Survey.
  4. Submit daily reports.

Example correct output:
[
  {"topic": "Defining the mission for readers", "assignTo": "", "dateOfCompletion": ""},
  {"topic": "Conducting a Reader's Understanding Survey", "assignTo": "", "dateOfCompletion": ""},
  {"topic": "Submit daily reports", "assignTo": "", "dateOfCompletion": ""}
]
(Note: point 3's heading itself does NOT appear as a row — only its two sub-points do. Point 4 has no sub-points, so it appears as-is.)

Respond with ONLY the JSON array, no other text, no markdown fences.

Notes:
"""
${clipped}
"""`;

  try {
    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return res.status(502).json({ error: `Extraction failed: ${errText}` });
    }

    const aiJson = await aiRes.json();
    const raw = (aiJson.choices?.[0]?.message?.content || "")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let items;
    try {
      items = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: "Could not parse extracted items" });
    }
    if (!Array.isArray(items)) items = [];

    const cleaned = items
      .map((it) => ({
        topic: (it.topic || "").toString().trim(),
        assignTo: (it.assignTo || "").toString().trim(),
        dateOfCompletion: (it.dateOfCompletion || "").toString().trim(),
      }))
      .filter((it) => it.topic);

    return res.status(200).json({ items: cleaned, sourceText });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

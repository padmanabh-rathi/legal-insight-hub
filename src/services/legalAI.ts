// Legal AI Service Layer
// On localhost: calls Hugging Face Inference API directly
// On production: routes through Supabase Edge Function

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/legal-ai`;

const HF_DIRECT_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct";

function isLocal(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  );
}

function getHfToken(): string {
  const token = import.meta.env.VITE_HUGGING_FACE_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "VITE_HUGGING_FACE_ACCESS_TOKEN is not set in your .env file. " +
        'Add: VITE_HUGGING_FACE_ACCESS_TOKEN="hf_your_key_here"'
    );
  }
  return token;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface Source {
  document: string;
  section: string;
  page?: number;
}

export interface AnalysisResult {
  summary: string;
  clauses: ExtractedClause[];
  risks: FlaggedRisk[];
}

export interface ExtractedClause {
  id: string;
  title: string;
  text: string;
  section: string;
  type: "obligation" | "right" | "condition" | "definition" | "termination";
}

export interface FlaggedRisk {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  clause: string;
  recommendation: string;
}

// ─── Direct HuggingFace calls (localhost) ───────────────────────────

async function callHuggingFaceDirect(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const token = getHfToken();

  const res = await fetch(HF_DIRECT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages: [
        { role: "system", content: systemPrompt || "You are a helpful legal AI assistant." },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 0.9,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("HuggingFace API error:", res.status, errText);
    throw new Error(`HuggingFace API error: ${res.status} — ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callHuggingFaceDirectStream(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const token = getHfToken();

  const res = await fetch(HF_DIRECT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages: [
        { role: "system", content: systemPrompt || "You are a helpful legal AI assistant." },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 0.9,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("HuggingFace API error:", res.status, errText);
    throw new Error(`HuggingFace API error: ${res.status} — ${errText.slice(0, 200)}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);

      if (!line || line.startsWith(":")) continue;

      const jsonStr = line.startsWith("data:") ? line.slice(5).trim() : line;
      if (!jsonStr || jsonStr === "[DONE]") continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const token =
          parsed.choices?.[0]?.delta?.content ||
          parsed.token?.text ||
          "";
        if (token) {
          fullContent += token;
          onChunk(token);
        }
      } catch {
        // Not valid JSON chunk, skip
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    for (const line of buffer.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) continue;
      const jsonStr = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
      if (!jsonStr || jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const token =
          parsed.choices?.[0]?.delta?.content ||
          parsed.token?.text ||
          "";
        if (token) {
          fullContent += token;
          onChunk(token);
        }
      } catch {
        // skip
      }
    }
  }

  return fullContent;
}

// ─── Edge Function calls (production) ───────────────────────────────

async function callEdgeFunction(
  systemPrompt: string,
  userPrompt: string,
  filePaths?: string[]
): Promise<string> {
  const res = await fetch(EDGE_FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ systemPrompt, userPrompt, stream: false, filePaths }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Edge function error: ${res.status}`);
  }

  const data = await res.json();
  return data.content;
}

async function callEdgeFunctionStream(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (chunk: string) => void,
  filePaths?: string[]
): Promise<string> {
  const res = await fetch(EDGE_FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ systemPrompt, userPrompt, stream: true, filePaths }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Edge function error: ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);

      if (!line || line.startsWith(":")) continue;

      const jsonStr = line.startsWith("data:") ? line.slice(5).trim() : line;
      if (!jsonStr || jsonStr === "[DONE]") continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const token = parsed.token?.text || parsed.choices?.[0]?.delta?.content || "";
        if (token) {
          fullContent += token;
          onChunk(token);
        }
      } catch {
        // Not valid JSON chunk, skip
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    for (const line of buffer.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) continue;
      const jsonStr = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
      if (!jsonStr || jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const token = parsed.token?.text || parsed.choices?.[0]?.delta?.content || "";
        if (token) {
          fullContent += token;
          onChunk(token);
        }
      } catch {
        // skip
      }
    }
  }

  return fullContent;
}

// ─── Public API (auto-routes based on environment) ──────────────────

export async function askQuestion(
  question: string,
  onChunk?: (chunk: string) => void,
  filePaths?: string[]
): Promise<ChatMessage> {
  const systemPrompt =
    "You are an expert legal AI assistant. Analyze legal documents, identify risks, extract clauses, and provide actionable legal insights. Format your responses with clear markdown headings and bullet points.";

  let content: string;

  if (isLocal()) {
    // Direct HuggingFace call on localhost
    if (onChunk) {
      content = await callHuggingFaceDirectStream(systemPrompt, question, onChunk);
    } else {
      content = await callHuggingFaceDirect(systemPrompt, question);
    }
  } else {
    // Edge function on production
    if (onChunk) {
      content = await callEdgeFunctionStream(systemPrompt, question, onChunk, filePaths);
    } else {
      content = await callEdgeFunction(systemPrompt, question, filePaths);
    }
  }

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content,
    sources: [],
    timestamp: new Date(),
  };
}

export async function runWorkflow(
  systemPrompt: string,
  userPrompt: string,
  filePaths?: string[]
): Promise<string> {
  if (isLocal()) {
    return callHuggingFaceDirect(systemPrompt, userPrompt);
  }
  return callEdgeFunction(systemPrompt, userPrompt, filePaths);
}

export async function analyzeDocument(documentId: string): Promise<AnalysisResult> {
  const systemPrompt = "You are a legal document analyst. Provide a comprehensive analysis.";
  const userPrompt = `Analyze document ${documentId}.`;

  let content: string;
  if (isLocal()) {
    content = await callHuggingFaceDirect(systemPrompt, userPrompt);
  } else {
    content = await callEdgeFunction(systemPrompt, userPrompt);
  }

  return { summary: content, clauses: [], risks: [] };
}

export async function summarize(documentId: string): Promise<string> {
  const systemPrompt = "You are a legal document summarizer.";
  const userPrompt = `Summarize document ${documentId}.`;

  if (isLocal()) {
    return callHuggingFaceDirect(systemPrompt, userPrompt);
  }
  return callEdgeFunction(systemPrompt, userPrompt);
}

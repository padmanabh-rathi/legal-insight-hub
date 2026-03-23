// Legal AI Service Layer — calls Hugging Face via edge function

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/legal-ai`;

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

async function callEdgeFunction(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(EDGE_FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ systemPrompt, userPrompt, stream: false }),
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
  onChunk: (chunk: string) => void
): Promise<string> {
  const res = await fetch(EDGE_FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ systemPrompt, userPrompt, stream: true }),
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

    // HF streaming sends SSE-style or JSON token events
    // Try to parse line-by-line
    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);

      if (!line || line.startsWith(":")) continue;

      // Handle SSE data: prefix
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
        // Not JSON, treat as raw text
        fullContent += jsonStr;
        onChunk(jsonStr);
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    fullContent += buffer;
    onChunk(buffer);
  }

  return fullContent;
}

export async function askQuestion(
  question: string,
  onChunk?: (chunk: string) => void
): Promise<ChatMessage> {
  const systemPrompt =
    "You are an expert legal AI assistant. Analyze legal documents, identify risks, extract clauses, and provide actionable legal insights. Format your responses with clear markdown headings and bullet points.";

  let content: string;

  if (onChunk) {
    content = await callEdgeFunctionStream(systemPrompt, question, onChunk);
  } else {
    content = await callEdgeFunction(systemPrompt, question);
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
  userPrompt: string
): Promise<string> {
  return callEdgeFunction(systemPrompt, userPrompt);
}

export async function analyzeDocument(documentId: string): Promise<AnalysisResult> {
  const content = await callEdgeFunction(
    "You are a legal document analyst. Provide a comprehensive analysis including a summary, extracted clauses, and risk assessment. Return your analysis in a structured format.",
    `Analyze the legal document with ID: ${documentId}. Provide a summary, list key clauses, and identify risks.`
  );

  return {
    summary: content,
    clauses: [],
    risks: [],
  };
}

export async function summarize(documentId: string): Promise<string> {
  return callEdgeFunction(
    "You are a legal document summarizer. Provide clear, concise summaries of legal documents.",
    `Summarize the key terms and provisions of document ${documentId}.`
  );
}

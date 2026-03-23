// Legal AI Service Layer
// Ready for FastAPI/HuggingFace backend integration

const API_BASE_URL = import.meta.env.VITE_LEGAL_AI_API_URL || "";
const USE_MOCK = !API_BASE_URL;

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

// Mock data
const MOCK_SUMMARY = `This agreement establishes a commercial supply arrangement between GlobalTech Industries ("Supplier") and Meridian Corp ("Buyer") for the provision of semiconductor components.

**Key Terms:**
- **Duration:** 36-month initial term with automatic 12-month renewals
- **Minimum Order Quantity:** 10,000 units per quarter
- **Payment Terms:** Net 45 days from date of invoice
- **Governing Law:** State of Delaware, United States

**Notable Provisions:**
The agreement contains comprehensive intellectual property protections (Section 7), a broad force majeure clause (Section 12), and mutual indemnification obligations (Section 9). The limitation of liability caps consequential damages at 2x the annual contract value.`;

const MOCK_CLAUSES: ExtractedClause[] = [
  {
    id: "c1",
    title: "Minimum Purchase Obligation",
    text: "Buyer shall purchase no less than 10,000 units per calendar quarter. Failure to meet this threshold shall entitle Supplier to impose a shortfall fee equal to 15% of the deficit value.",
    section: "Section 3.2",
    type: "obligation",
  },
  {
    id: "c2",
    title: "Intellectual Property Assignment",
    text: "All custom modifications, improvements, or derivative works created by Supplier pursuant to this Agreement shall be owned exclusively by Buyer upon full payment.",
    section: "Section 7.1",
    type: "right",
  },
  {
    id: "c3",
    title: "Termination for Convenience",
    text: "Either party may terminate this Agreement upon 90 days' written notice, subject to payment of all outstanding obligations and a termination fee not exceeding 25% of remaining contract value.",
    section: "Section 11.3",
    type: "termination",
  },
  {
    id: "c4",
    title: "Force Majeure",
    text: "Neither party shall be liable for delays or failures in performance resulting from circumstances beyond reasonable control, including but not limited to pandemics, cyber attacks, and supply chain disruptions.",
    section: "Section 12.1",
    type: "condition",
  },
  {
    id: "c5",
    title: "Confidentiality Period",
    text: "All Confidential Information disclosed under this Agreement shall remain protected for a period of five (5) years following termination or expiration of this Agreement.",
    section: "Section 8.4",
    type: "obligation",
  },
];

const MOCK_RISKS: FlaggedRisk[] = [
  {
    id: "r1",
    title: "Uncapped Indemnification Exposure",
    description: "The mutual indemnification clause in Section 9.1 does not include a cap on total liability for IP infringement claims, potentially exposing either party to unlimited financial risk.",
    severity: "high",
    clause: "Section 9.1",
    recommendation: "Negotiate a cap on indemnification liability, typically 2-3x annual contract value, and ensure adequate insurance coverage.",
  },
  {
    id: "r2",
    title: "Broad Force Majeure Definition",
    description: "The force majeure clause includes 'supply chain disruptions' which is vaguely defined and could be invoked for routine supplier issues.",
    severity: "medium",
    clause: "Section 12.1",
    recommendation: "Narrow the definition to require disruptions that are unforeseeable and beyond reasonable mitigation efforts.",
  },
  {
    id: "r3",
    title: "Auto-Renewal Without Price Protection",
    description: "The agreement auto-renews without any mechanism to renegotiate pricing, potentially locking Buyer into unfavorable terms.",
    severity: "high",
    clause: "Section 2.3",
    recommendation: "Add a price adjustment mechanism tied to a recognized index, or require mutual agreement on pricing for renewal terms.",
  },
  {
    id: "r4",
    title: "Restrictive Non-Compete Scope",
    description: "The non-compete provision extends 24 months post-termination across all jurisdictions, which may be unenforceable in certain states.",
    severity: "low",
    clause: "Section 13.2",
    recommendation: "Consider limiting geographic scope and reducing duration to 12 months to improve enforceability.",
  },
];

const MOCK_RESPONSES: Record<string, { content: string; sources: Source[] }> = {
  default: {
    content: `Based on my analysis of the uploaded documents, here are the key findings:

**Contract Overview:**
The Supply Agreement between GlobalTech Industries and Meridian Corp establishes a 36-month commercial arrangement for semiconductor components with specific obligations for both parties.

**Key Risk Areas Identified:**
1. **Uncapped Indemnification** (Section 9.1) — The mutual indemnification lacks a liability cap for IP claims
2. **Auto-Renewal Pricing** (Section 2.3) — No price protection mechanism during renewal periods
3. **Broad Force Majeure** (Section 12.1) — Vague definition could be exploited

**Recommended Actions:**
- Negotiate liability caps on indemnification provisions
- Add price adjustment mechanisms for renewal terms
- Narrow force majeure definitions to prevent abuse

Would you like me to dive deeper into any of these areas?`,
    sources: [
      { document: "Supply_Agreement_2024.pdf", section: "Section 9.1", page: 14 },
      { document: "Supply_Agreement_2024.pdf", section: "Section 2.3", page: 3 },
      { document: "Supply_Agreement_2024.pdf", section: "Section 12.1", page: 18 },
    ],
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Streaming mock - yields characters one by one
async function* mockStream(text: string): AsyncGenerator<string> {
  const words = text.split(" ");
  for (const word of words) {
    yield word + " ";
    await delay(20 + Math.random() * 30);
  }
}

export async function askQuestion(
  question: string,
  onChunk?: (chunk: string) => void
): Promise<ChatMessage> {
  if (USE_MOCK) {
    const response = MOCK_RESPONSES.default;
    let fullContent = "";

    if (onChunk) {
      for await (const chunk of mockStream(response.content)) {
        fullContent += chunk;
        onChunk(chunk);
      }
    } else {
      fullContent = response.content;
      await delay(1500);
    }

    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content: fullContent,
      sources: response.sources,
      timestamp: new Date(),
    };
  }

  // Real API call (FastAPI backend)
  const res = await fetch(`${API_BASE_URL}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) throw new Error("Failed to get response");

  if (res.headers.get("content-type")?.includes("text/event-stream")) {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      fullContent += chunk;
      onChunk?.(chunk);
    }

    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content: fullContent,
      sources: [],
      timestamp: new Date(),
    };
  }

  const data = await res.json();
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: data.content,
    sources: data.sources || [],
    timestamp: new Date(),
  };
}

export async function analyzeDocument(documentId: string): Promise<AnalysisResult> {
  if (USE_MOCK) {
    await delay(2000);
    return {
      summary: MOCK_SUMMARY,
      clauses: MOCK_CLAUSES,
      risks: MOCK_RISKS,
    };
  }

  const res = await fetch(`${API_BASE_URL}/api/analyze/${documentId}`);
  if (!res.ok) throw new Error("Failed to analyze document");
  return res.json();
}

export async function extractClauses(documentId: string): Promise<ExtractedClause[]> {
  if (USE_MOCK) {
    await delay(1500);
    return MOCK_CLAUSES;
  }

  const res = await fetch(`${API_BASE_URL}/api/clauses/${documentId}`);
  if (!res.ok) throw new Error("Failed to extract clauses");
  return res.json();
}

export async function flagRisks(documentId: string): Promise<FlaggedRisk[]> {
  if (USE_MOCK) {
    await delay(1500);
    return MOCK_RISKS;
  }

  const res = await fetch(`${API_BASE_URL}/api/risks/${documentId}`);
  if (!res.ok) throw new Error("Failed to flag risks");
  return res.json();
}

export async function summarize(documentId: string): Promise<string> {
  if (USE_MOCK) {
    await delay(1500);
    return MOCK_SUMMARY;
  }

  const res = await fetch(`${API_BASE_URL}/api/summarize/${documentId}`);
  if (!res.ok) throw new Error("Failed to summarize");
  const data = await res.json();
  return data.summary;
}

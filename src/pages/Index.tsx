import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Paperclip,
  Sparkles,
  Settings2,
  ToggleLeft,
  Send,
  Globe,
  Database,
  FileSearch,
  Building2,
  FolderOpen,
  FileEdit,
  Clock,
  AlertTriangle,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { askQuestion, type ChatMessage } from "@/services/legalAI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { DraftDrawer } from "@/components/workflows/DraftDrawer";
import { TimelineView } from "@/components/workflows/TimelineView";
import { RiskAnalysisPanel } from "@/components/workflows/RiskAnalysisPanel";

const sourceTags = [
  { label: "iManage", icon: Database, color: "hsl(220, 70%, 50%)" },
  { label: "LexisNexis", icon: FileSearch, color: "hsl(0, 70%, 50%)" },
  { label: "Web Search", icon: Globe, color: "hsl(142, 60%, 40%)" },
  { label: "EDGAR", icon: Building2, color: "hsl(260, 60%, 50%)" },
  { label: "Project Vault", icon: FolderOpen, color: "hsl(0, 0%, 40%)" },
];

const workflows = [
  { title: "Draft a client alert", type: "Draft", steps: 5, icon: FileEdit, key: "draft-client-alert" as const },
  { title: "Extract chronology of key events", type: "Review", steps: 2, icon: Clock, key: "extract-chronology" as const },
  { title: "Clause Risk Analysis", type: "Analysis", steps: 3, icon: AlertTriangle, key: "clause-risk-analysis" as const },
  { title: "Summarize Obligations", type: "Output", steps: 2, icon: ClipboardList, key: "summarize-obligations" as const },
];

type ActiveWorkflow = "draft-client-alert" | "extract-chronology" | "clause-risk-analysis" | "summarize-obligations" | null;

const OBLIGATIONS_CONTENT = `## Obligations Checklist — Supply Agreement

Based on the analysis of the Supply Agreement between GlobalTech Industries and Meridian Corp, here are the key obligations:

### Buyer (Meridian Corp) Obligations

- [ ] **Quarterly Minimum Purchase** — Purchase no less than 10,000 units per calendar quarter *(Recurring — Section 3.2)*
- [ ] **Invoice Payment** — Pay all invoices within Net 45 days from date of invoice *(Recurring — Section 4.1)*
- [ ] **Confidentiality Compliance** — Protect all Confidential Information for 5 years post-termination *(Ongoing — Section 8.4)*
- [ ] **IP Payment** — Make full payment for custom modifications to obtain IP ownership *(Conditional — Section 7.1)*

### Supplier (GlobalTech Industries) Obligations

- [ ] **Quality Standards** — Deliver components meeting specifications outlined in Exhibit A *(Recurring — Section 5.1)*
- [ ] **Annual Performance Audit** — Participate in annual quality and compliance review *(Recurring — Section 6.2)*
- [ ] **IP Assignment** — Transfer ownership of derivative works upon full payment *(Conditional — Section 7.1)*
- [ ] **Notification of Force Majeure** — Provide written notice within 48 hours of a force majeure event *(Conditional — Section 12.2)*

### Mutual Obligations

- [ ] **Indemnification** — Both parties to indemnify against third-party IP infringement claims *(Ongoing — Section 9.1)*
- [ ] **Termination Notice** — Provide 90 days' written notice for termination for convenience *(One-time — Section 11.3)*`;

export default function Index() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeWorkflow, setActiveWorkflow] = useState<ActiveWorkflow>(null);
  const [draftDrawerOpen, setDraftDrawerOpen] = useState(false);
  const [latestDocName, setLatestDocName] = useState<string | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasMessages = messages.length > 0;

  async function checkForDocuments(): Promise<boolean> {
    const { data, error } = await supabase
      .from("documents")
      .select("id, name")
      .limit(1);

    if (error || !data || data.length === 0) {
      toast({
        title: "No documents found",
        description: "Please upload a document in the Vault first.",
        variant: "destructive",
      });
      return false;
    }
    setLatestDocName(data[0].name);
    return true;
  }

  async function handleWorkflowClick(key: ActiveWorkflow) {
    const hasDoc = await checkForDocuments();
    if (!hasDoc) return;

    switch (key) {
      case "draft-client-alert":
        setDraftDrawerOpen(true);
        break;
      case "extract-chronology":
        setActiveWorkflow("extract-chronology");
        break;
      case "clause-risk-analysis":
        setActiveWorkflow("clause-risk-analysis");
        break;
      case "summarize-obligations":
        triggerObligationsSummary();
        break;
    }
  }

  function triggerObligationsSummary() {
    const systemMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "⏳ Analyzing obligations...",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, systemMsg]);
    setActiveWorkflow(null);

    setTimeout(() => {
      const resultMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: OBLIGATIONS_CONTENT,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== systemMsg.id);
        return [...filtered, resultMsg];
      });
    }, 2000);
  }

  function handleBackToHome() {
    setActiveWorkflow(null);
  }

  const handleAsk = async () => {
    if (!query.trim() || isLoading) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      const response = await askQuestion(query, (chunk) => {
        setStreamingContent((prev) => prev + chunk);
      });
      setMessages((prev) => [...prev, response]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  // Workflow full-screen views
  if (activeWorkflow === "extract-chronology") {
    return <TimelineView onBack={handleBackToHome} documentName={latestDocName} />;
  }

  if (activeWorkflow === "clause-risk-analysis") {
    return <RiskAnalysisPanel onBack={handleBackToHome} documentName={latestDocName} />;
  }

  return (
    <div className="flex flex-col h-full">
      <DraftDrawer
        open={draftDrawerOpen}
        onClose={() => setDraftDrawerOpen(false)}
        documentName={latestDocName}
      />

      {hasMessages ? (
        /* Chat mode */
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto px-4 md:px-8 lg:px-16 py-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-2xl rounded-lg px-4 py-3 ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                      {msg.sources.map((src, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          Source: {src.section} of {src.document}
                          {src.page && ` (p. ${src.page})`}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-2xl rounded-lg px-4 py-3 bg-muted">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
            {isLoading && !streamingContent && (
              <div className="flex justify-start">
                <div className="rounded-lg px-4 py-3 bg-muted flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing legal data...
                </div>
              </div>
            )}
          </div>

          {/* Chat input bar */}
          <div className="border-t border-border p-4 md:px-8 lg:px-16">
            <div className="max-w-3xl mx-auto relative">
              <Textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your legal documents..."
                className="min-h-[48px] max-h-32 resize-none pr-12 rounded-xl border-input"
                rows={1}
              />
              <Button
                size="icon"
                onClick={handleAsk}
                disabled={!query.trim() || isLoading}
                className="absolute right-2 bottom-2 h-8 w-8 rounded-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Home / empty state */
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <div className="w-full max-w-2xl space-y-8">
            <h1 className="text-4xl md:text-5xl font-serif text-center tracking-tight text-foreground">
              Legal Document Analysis System
            </h1>

            <div className="space-y-3">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your legal documents..."
                  className="min-h-[120px] resize-none rounded-xl border-input text-base"
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 flex-wrap">
                  <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 text-xs">
                    <Paperclip className="h-3.5 w-3.5" />
                    Files and sources
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    Prompts
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 text-xs">
                    <Settings2 className="h-3.5 w-3.5" />
                    Customize
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 text-xs">
                    <ToggleLeft className="h-3.5 w-3.5" />
                    Improve
                  </Button>
                </div>
                <Button onClick={handleAsk} disabled={!query.trim() || isLoading} className="rounded-lg gap-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Ask
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              {sourceTags.map((tag) => (
                <button
                  key={tag.label}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent transition-colors"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.label}
                  <span className="text-xs">+</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Workflows */}
          <div className="w-full max-w-4xl mt-16">
            <p className="text-sm text-muted-foreground mb-4">Recommended workflows</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {workflows.map((wf) => (
                <Card
                  key={wf.title}
                  className="cursor-pointer hover:shadow-md transition-shadow border-border"
                  onClick={() => handleWorkflowClick(wf.key)}
                >
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium leading-snug">{wf.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <wf.icon className="h-3 w-3" />
                      <span>{wf.type}</span>
                      <span>·</span>
                      <span>{wf.steps} steps</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

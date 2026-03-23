import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import ReactMarkdown from "react-markdown";

const sourceTags = [
  { label: "iManage", icon: Database, color: "hsl(220, 70%, 50%)" },
  { label: "LexisNexis", icon: FileSearch, color: "hsl(0, 70%, 50%)" },
  { label: "Web Search", icon: Globe, color: "hsl(142, 60%, 40%)" },
  { label: "EDGAR", icon: Building2, color: "hsl(260, 60%, 50%)" },
  { label: "Project Vault", icon: FolderOpen, color: "hsl(0, 0%, 40%)" },
];

const workflows = [
  {
    title: "Draft a client alert",
    type: "Draft",
    steps: 5,
    icon: FileEdit,
  },
  {
    title: "Extract chronology of key events",
    type: "Review",
    steps: 2,
    icon: Clock,
  },
  {
    title: "Clause Risk Analysis",
    type: "Analysis",
    steps: 3,
    icon: AlertTriangle,
  },
  {
    title: "Summarize Obligations",
    type: "Output",
    steps: 2,
    icon: ClipboardList,
  },
];

export default function Index() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasMessages = messages.length > 0;

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

  return (
    <div className="flex flex-col h-full">
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
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-serif text-center tracking-tight text-foreground">
              Legal Document Analysis System
            </h1>

            {/* Input area */}
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

              {/* Action bar */}
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

            {/* Source Tags */}
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

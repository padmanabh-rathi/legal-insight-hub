import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ChatSession {
  id: string;
  title: string;
  messages: unknown[];
  created_at: string;
  updated_at: string;
}

export default function History() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading history", variant: "destructive" });
    } else {
      setSessions((data as unknown as ChatSession[]) || []);
    }
    setLoading(false);
  }

  async function deleteSession(id: string) {
    const { error } = await supabase.from("chat_sessions").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } else {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Chat deleted" });
    }
  }

  function loadSession(session: ChatSession) {
    // Navigate to home with session data via state
    navigate("/", { state: { restoreSession: session } });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading history...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-serif tracking-tight">Chat History</h1>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No chat history yet.</p>
          <p className="text-sm mt-1">Start a conversation and it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const msgCount = Array.isArray(session.messages) ? session.messages.length : 0;
            const date = new Date(session.updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Card
                key={session.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-border group"
                onClick={() => loadSession(session)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {msgCount} messages · {date}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

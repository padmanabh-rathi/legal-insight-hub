import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar } from "lucide-react";

interface TimelineEvent {
  date: string;
  event_description: string;
  clause_reference: string;
}

const MOCK_TIMELINE: TimelineEvent[] = [
  {
    date: "2024-01-15",
    event_description: "Agreement execution date — both parties sign the Supply Agreement",
    clause_reference: "Preamble",
  },
  {
    date: "2024-02-01",
    event_description: "Effective date — obligations and performance standards commence",
    clause_reference: "Section 1.1",
  },
  {
    date: "2024-03-31",
    event_description: "First quarterly minimum purchase obligation deadline (10,000 units)",
    clause_reference: "Section 3.2",
  },
  {
    date: "2024-04-15",
    event_description: "First quarterly invoice payment due (Net 45 from Q1 invoice)",
    clause_reference: "Section 4.1",
  },
  {
    date: "2024-06-30",
    event_description: "Mid-year compliance review — parties assess performance metrics",
    clause_reference: "Section 5.3",
  },
  {
    date: "2025-01-15",
    event_description: "Annual performance audit and quality standards review",
    clause_reference: "Section 6.2",
  },
  {
    date: "2027-01-15",
    event_description: "Initial 36-month term expires — auto-renewal begins unless 90 days notice given",
    clause_reference: "Section 2.3",
  },
  {
    date: "2032-01-15",
    event_description: "Confidentiality obligations expire (5 years post-termination)",
    clause_reference: "Section 8.4",
  },
];

interface TimelineViewProps {
  onBack: () => void;
  documentName?: string;
}

export function TimelineView({ onBack, documentName }: TimelineViewProps) {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Chronology of Key Events</h1>
          {documentName && (
            <p className="text-xs text-muted-foreground">Extracted from: {documentName}</p>
          )}
        </div>
      </div>

      <div className="relative ml-4">
        {/* Vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

        <div className="space-y-6">
          {MOCK_TIMELINE.map((event, i) => (
            <div key={i} className="relative pl-10">
              {/* Dot */}
              <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />

              <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {new Date(event.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.clause_reference}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {event.event_description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

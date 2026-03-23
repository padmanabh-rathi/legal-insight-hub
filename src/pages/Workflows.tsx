import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileEdit,
  Clock,
  AlertTriangle,
  ClipboardList,
  Scale,
  FileSearch,
} from "lucide-react";

const workflows = [
  {
    title: "Draft a Client Alert",
    description: "Generate a professional client alert summarizing key legal developments from analyzed documents.",
    type: "Draft",
    steps: 5,
    icon: FileEdit,
  },
  {
    title: "Extract Chronology of Key Events",
    description: "Build a timeline of significant events, dates, and milestones extracted from legal filings.",
    type: "Review",
    steps: 2,
    icon: Clock,
  },
  {
    title: "Clause Risk Analysis",
    description: "Identify and flag high-risk clauses with severity ratings and actionable recommendations.",
    type: "Analysis",
    steps: 3,
    icon: AlertTriangle,
  },
  {
    title: "Summarize Obligations",
    description: "Extract and categorize all contractual obligations by party, deadline, and priority.",
    type: "Output",
    steps: 2,
    icon: ClipboardList,
  },
  {
    title: "Compare Contract Versions",
    description: "Identify differences between contract drafts, highlighting material changes and new provisions.",
    type: "Review",
    steps: 4,
    icon: FileSearch,
  },
  {
    title: "Regulatory Compliance Check",
    description: "Assess document compliance against relevant regulatory frameworks and flag gaps.",
    type: "Analysis",
    steps: 3,
    icon: Scale,
  },
];

export default function Workflows() {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pre-built analysis workflows powered by NLP models
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map((wf) => (
          <Card
            key={wf.title}
            className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 border-border"
          >
            <CardContent className="p-5 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <wf.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{wf.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {wf.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {wf.type}
                </Badge>
                <span className="text-xs text-muted-foreground">{wf.steps} steps</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";

interface RiskClause {
  clauseName: string;
  riskLevel: "High" | "Medium" | "Low";
  reason: string;
  mitigation: string;
}

const MOCK_RISKS: RiskClause[] = [
  {
    clauseName: "Indemnification (Section 9.1)",
    riskLevel: "High",
    reason:
      "Mutual indemnification for IP infringement has no liability cap, exposing either party to unlimited financial risk. No insurance requirement is specified.",
    mitigation:
      "Negotiate a cap at 2-3x annual contract value. Require both parties to maintain adequate E&O and IP insurance coverage.",
  },
  {
    clauseName: "Limitation of Liability (Section 10.2)",
    riskLevel: "Medium",
    reason:
      "Consequential damages are capped at 2x annual contract value, which is within market range but excludes willful misconduct carve-outs.",
    mitigation:
      "Add explicit carve-outs for willful misconduct, gross negligence, and breaches of confidentiality obligations.",
  },
  {
    clauseName: "Termination for Convenience (Section 11.3)",
    riskLevel: "High",
    reason:
      "Termination fee of up to 25% of remaining contract value combined with 90-day notice creates significant exit costs, especially in the early months.",
    mitigation:
      "Negotiate a declining termination fee schedule (e.g., 25% in Year 1, 15% in Year 2, 5% in Year 3) or a fixed cap on the fee.",
  },
  {
    clauseName: "Governing Law (Section 14.1)",
    riskLevel: "Low",
    reason:
      "Delaware governing law is a standard, well-understood jurisdiction for commercial contracts with predictable legal outcomes.",
    mitigation:
      "No immediate action required. Consider adding a mutual arbitration clause to reduce litigation costs.",
  },
];

const riskConfig = {
  High: {
    color: "bg-destructive text-destructive-foreground",
    icon: ShieldAlert,
  },
  Medium: {
    color: "bg-warning text-warning-foreground",
    icon: ShieldQuestion,
  },
  Low: {
    color: "bg-success text-success-foreground",
    icon: ShieldCheck,
  },
};

interface RiskAnalysisPanelProps {
  onBack: () => void;
  documentName?: string;
}

export function RiskAnalysisPanel({ onBack, documentName }: RiskAnalysisPanelProps) {
  return (
    <div className="flex h-full">
      {/* Left: document placeholder */}
      <div className="flex-1 border-r border-border flex flex-col items-center justify-center p-8 bg-muted/30">
        <div className="text-center space-y-2">
          <div className="h-16 w-12 border-2 border-dashed border-border rounded mx-auto flex items-center justify-center">
            <span className="text-xs text-muted-foreground">PDF</span>
          </div>
          <p className="text-sm font-medium">{documentName || "Document"}</p>
          <p className="text-xs text-muted-foreground">Document preview will appear here</p>
        </div>
      </div>

      {/* Right: risk panel */}
      <div className="w-full max-w-md flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-base font-semibold">Risk Assessment</h2>
            <p className="text-xs text-muted-foreground">Clause-level risk analysis</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {MOCK_RISKS.map((risk, i) => {
            const config = riskConfig[risk.riskLevel];
            const Icon = config.icon;
            return (
              <div
                key={i}
                className="border border-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">{risk.clauseName}</span>
                  </div>
                  <Badge className={config.color}>
                    {risk.riskLevel}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk</p>
                    <p className="text-sm text-foreground leading-relaxed">{risk.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mitigation</p>
                    <p className="text-sm text-foreground leading-relaxed">{risk.mitigation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

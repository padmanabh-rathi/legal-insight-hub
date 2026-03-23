import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";

const MOCK_DRAFT = `# Client Alert: Supply Agreement Review

## Summary

GlobalTech Industries and Meridian Corp have entered into a 36-month commercial supply agreement for semiconductor components. This alert highlights the key business risks and required actions for executive leadership.

## Key Takeaways

- **Minimum Purchase Commitment**: Meridian Corp is required to purchase no less than **10,000 units per quarter**, with a **15% shortfall fee** for non-compliance. This creates a significant ongoing financial obligation.

- **Automatic Renewal Risk**: The agreement auto-renews for 12-month periods **without any price renegotiation mechanism**, potentially locking the company into unfavorable pricing in a volatile market.

- **Uncapped IP Indemnification**: Section 9.1 contains mutual indemnification for IP infringement **with no liability cap**, exposing the company to potentially unlimited financial risk.

- **Broad Force Majeure**: The definition includes "supply chain disruptions" which is vaguely worded and could be invoked for routine supply issues.

- **Termination Fee**: Early termination requires 90 days' notice plus a fee of up to **25% of remaining contract value**.

## Recommended Next Steps

1. **Negotiate a liability cap** on the indemnification clause — industry standard is 2-3x annual contract value
2. **Add a price adjustment mechanism** (e.g., CPI-linked) for renewal periods
3. **Narrow the force majeure definition** to require unforeseeable and unmitigable events
4. **Review the non-compete provision** (Section 13.2) for enforceability in relevant jurisdictions
5. **Engage insurance counsel** to ensure adequate coverage for the uncapped indemnification exposure

---

*This alert is for informational purposes only and does not constitute legal advice. Please consult with your legal team before taking action.*`;

interface DraftDrawerProps {
  open: boolean;
  onClose: () => void;
  documentName?: string;
}

export function DraftDrawer({ open, onClose, documentName }: DraftDrawerProps) {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (open) {
      setLoading(true);
      setContent("");
      const timer = setTimeout(() => {
        setContent(MOCK_DRAFT);
        setLoading(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-serif text-lg">Document Drafter</SheetTitle>
          {documentName && (
            <p className="text-xs text-muted-foreground">Based on: {documentName}</p>
          )}
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Generating client alert via AI model...
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-6 w-1/2 mt-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-6 w-2/3 mt-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

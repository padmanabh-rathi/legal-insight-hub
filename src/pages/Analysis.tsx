import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Loader2, AlertTriangle, Shield, Scale } from "lucide-react";
import { analyzeDocument, type AnalysisResult, type FlaggedRisk } from "@/services/legalAI";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

function RiskBadge({ severity }: { severity: FlaggedRisk["severity"] }) {
  const styles = {
    high: "bg-destructive text-destructive-foreground",
    medium: "bg-warning text-warning-foreground",
    low: "bg-muted text-muted-foreground",
  };
  return <Badge className={styles[severity]}>{severity.charAt(0).toUpperCase() + severity.slice(1)}</Badge>;
}

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [docName, setDocName] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function load() {
      // Load document metadata
      const { data } = await supabase
        .from("documents")
        .select("name")
        .eq("id", id)
        .single();
      if (data) setDocName(data.name);

      // Run analysis
      const result = await analyzeDocument(id!);
      setAnalysis(result);
      setLoading(false);

      // Update document status
      await supabase.from("documents").update({ status: "analyzed" }).eq("id", id);
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <div>
            <p className="font-medium">Analyzing document...</p>
            <p className="text-sm text-muted-foreground">Processing legal data with NLP models</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vault")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium truncate">{docName || "Document"}</span>
      </div>

      {/* Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document viewer placeholder */}
        <div className="flex-1 border-r border-border flex items-center justify-center bg-muted/30">
          <div className="text-center text-muted-foreground space-y-2 p-8">
            <FileText className="h-16 w-16 mx-auto opacity-20" />
            <p className="text-sm font-medium">Document Preview</p>
            <p className="text-xs">PDF viewer will render here when connected to storage</p>
          </div>
        </div>

        {/* Right: AI insights */}
        <div className="w-full max-w-lg overflow-auto">
          <Tabs defaultValue="summary" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-4 w-fit">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="clauses">Extracted Clauses</TabsTrigger>
              <TabsTrigger value="risks">Flagged Risks</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="flex-1 overflow-auto p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Document Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{analysis?.summary || ""}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clauses" className="flex-1 overflow-auto p-4 space-y-3">
              {analysis?.clauses.map((clause) => (
                <Card key={clause.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{clause.title}</p>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {clause.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{clause.section}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{clause.text}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="risks" className="flex-1 overflow-auto p-4 space-y-3">
              {analysis?.risks.map((risk) => (
                <Card key={risk.id} className="border-l-4" style={{
                  borderLeftColor: risk.severity === "high" ? "hsl(0, 72%, 51%)" : risk.severity === "medium" ? "hsl(38, 92%, 50%)" : "hsl(0, 0%, 60%)",
                }}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <p className="text-sm font-medium">{risk.title}</p>
                      </div>
                      <RiskBadge severity={risk.severity} />
                    </div>
                    <p className="text-xs text-muted-foreground">{risk.clause}</p>
                    <p className="text-sm text-muted-foreground">{risk.description}</p>
                    <div className="bg-muted rounded-md p-3 mt-2">
                      <p className="text-xs font-medium flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Recommendation
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{risk.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

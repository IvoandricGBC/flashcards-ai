import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, ArrowRight, FileUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DocumentSummaryProps {
  collectionId?: number;
  documentId?: number;
  documentName?: string;
}

export function DocumentSummary({ collectionId, documentId, documentName }: DocumentSummaryProps) {
  const [summary, setSummary] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [summaryWordCount, setSummaryWordCount] = useState<number | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const generateSummary = async () => {
    if (!file && !documentId) {
      toast({
        title: "No document selected",
        description: "Please upload a document or select an existing one.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSummary("");
    setWordCount(null);
    setSummaryWordCount(null);

    try {
      const formData = new FormData();
      
      if (file) {
        formData.append("document", file);
        
        // Use the direct summarization endpoint
        const response = await apiRequest("/api/summarize", {
          method: "POST",
          body: formData,
        });
        
        const data = await response.json();
        setSummary(data.summary);
        setWordCount(data.wordCount);
        setSummaryWordCount(data.summaryWordCount);
        
        toast({
          title: "Summary generated",
          description: `Created a ${data.summaryWordCount} word summary from ${data.fileName}`,
        });
      } else if (documentId) {
        // Use the document-specific endpoint
        const response = await apiRequest(`/api/documents/${documentId}/summarize`, {
          method: "POST",
        });
        
        const data = await response.json();
        setSummary(data.summary);
        
        toast({
          title: "Summary generated",
          description: `Created a summary from ${documentName || "document"}`,
        });
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Summary generation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Summary Generator
        </CardTitle>
        <CardDescription>
          Generate a concise summary (max 500 words) of your document using AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!documentId && (
          <div className="mb-4">
            <label 
              htmlFor="document-upload" 
              className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            >
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <span className="mt-2 block text-sm font-medium">
                {file ? file.name : "Upload a PDF or Word document"}
              </span>
              <input
                id="document-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        {documentId && (
          <div className="mb-4 p-4 bg-secondary/20 rounded-lg">
            <p className="flex items-center text-sm">
              <FileText className="h-4 w-4 mr-2" />
              <span>Using document: {documentName || `Document #${documentId}`}</span>
            </p>
          </div>
        )}

        {summary && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Summary</h3>
              {wordCount && summaryWordCount && (
                <span className="text-xs text-gray-500">
                  Condensed from {wordCount.toLocaleString()} words to {summaryWordCount.toLocaleString()} words
                  ({Math.round((summaryWordCount / wordCount) * 100)}% of original)
                </span>
              )}
            </div>
            <Textarea
              value={summary}
              readOnly
              className="h-[300px] font-serif"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={generateSummary} 
          disabled={isLoading || (!file && !documentId)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate Summary
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
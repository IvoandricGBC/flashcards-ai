import { DocumentSummary } from "@/components/summary/DocumentSummary";
import { BookOpen, AlignJustify } from "lucide-react";

export default function Summary() {
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Summary</h1>
          <p className="text-muted-foreground">Generate concise summaries from your documents</p>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-medium">
            <AlignJustify className="h-5 w-5" />
            <h2>Generate a 500-word Summary</h2>
          </div>
          <p className="text-sm text-gray-500">
            Upload a PDF or Word document and our AI will generate a concise summary that captures the key points.
            Perfect for quickly understanding the main concepts without reading the entire document.
          </p>
        </div>
        
        <DocumentSummary />
      </div>
    </div>
  );
}
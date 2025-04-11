import { PageHeader } from "@/components/layout/PageHeader";
import { DocumentSummary } from "@/components/summary/DocumentSummary";
import { BookOpen, AlignJustify } from "lucide-react";

export default function Summary() {
  return (
    <div className="container py-8">
      <PageHeader
        title="Document Summary"
        description="Generate concise summaries from your documents"
        icon={BookOpen}
      />
      
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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Plus } from "lucide-react";

interface TextInputProps {
  onFlashcardsGenerated?: (count: number, collectionId: number) => void;
}

export function TextInput({ onFlashcardsGenerated }: TextInputProps) {
  const [text, setText] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      toast({
        title: "Text required",
        description: "Please enter text to generate flashcards from.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your flashcard collection.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-from-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          title,
          description: description || `Flashcards generated from text on ${new Date().toLocaleDateString()}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      toast({
        title: "Flashcards generated!",
        description: `Successfully created ${data.flashcardsCount} flashcards.`,
      });

      // Clear the form
      setText("");
      setTitle("");
      setDescription("");
      
      // Notify parent component
      if (onFlashcardsGenerated) {
        onFlashcardsGenerated(data.flashcardsCount, data.collection.id);
      }
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast({
        title: "Failed to generate flashcards",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > 5000;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Create Flashcards from Text
        </CardTitle>
        <CardDescription>
          Enter or paste any text to generate flashcards automatically
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="collection-title">Collection Title</Label>
              <Input
                id="collection-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your flashcard collection"
                required
                maxLength={100}
              />
            </div>
            
            <div>
              <Label htmlFor="collection-description">Description (Optional)</Label>
              <Input
                id="collection-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a brief description"
                maxLength={200}
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <Label htmlFor="text-input">Enter Text (max 5000 words)</Label>
                <span className={`text-xs ${isOverLimit ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                  {wordCount}/5000 words
                </span>
              </div>
              <Textarea
                id="text-input"
                className="min-h-[300px] font-mono text-sm"
                placeholder="Paste or type your text here... (essays, articles, notes, etc.)"
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
              />
              {isOverLimit && (
                <p className="text-red-500 text-xs mt-1">
                  Text exceeds 5000 word limit. Please shorten your text or split into multiple collections.
                </p>
              )}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isGenerating || !text.trim() || !title.trim() || isOverLimit}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Flashcards...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Generate Flashcards
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
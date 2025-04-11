import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DocumentUpload } from "@/components/upload/DocumentUpload";
import { ApiStatusIndicator } from "@/components/api/ApiStatusIndicator";
import { Loader2, FileX, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Upload() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [showApiError, setShowApiError] = useState(false);
  
  // Generation options
  const [generateDefinitions, setGenerateDefinitions] = useState(true);
  const [generateConcepts, setGenerateConcepts] = useState(true);
  const [includeMultipleChoice, setIncludeMultipleChoice] = useState(true);
  
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("No file selected");
      }
      
      if (!collectionName.trim()) {
        throw new Error("Collection name is required");
      }
      
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("title", collectionName);
      formData.append("description", collectionDescription);
      formData.append("generateDefinitions", String(generateDefinitions));
      formData.append("generateConcepts", String(generateConcepts));
      formData.append("includeMultipleChoice", String(includeMultipleChoice));
      
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload document");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Document processed successfully",
        description: `${data.flashcardsCount} flashcards were generated for collection "${data.collection.title}"`,
        variant: "default",
      });
      
      // Navigate to the newly created collection
      navigate(`/collections/${data.collection.id}`);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      // Check for specific OpenAI API errors
      if (errorMessage.includes("OpenAI API quota exceeded") || 
          errorMessage.includes("exceeded your current quota") ||
          errorMessage.includes("insufficient_quota")) {
        setShowApiError(true);
        toast({
          title: "OpenAI API Limit Reached",
          description: "The API key has reached its usage limit. Please update the API key to continue processing documents.",
          variant: "destructive",
          duration: 10000, // Show for 10 seconds
        });
      } else {
        toast({
          title: "Error processing document",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });
  
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setIsOptionsVisible(true);
    
    // Try to auto-generate collection name from file name if not set yet
    if (!collectionName.trim()) {
      // Remove file extension and convert to title case
      const nameWithoutExtension = file.name.split(".")[0];
      setCollectionName(
        nameWithoutExtension
          .replace(/[-_]/g, " ")
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ")
      );
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Upload Document</h1>
        <p className="text-gray-600">Upload a PDF or Word document to generate flashcards</p>
      </div>
      
      <ApiStatusIndicator onRefresh={() => setShowApiError(false)} />
      
      {showApiError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>OpenAI API Error</AlertTitle>
          <AlertDescription>
            The OpenAI API key has reached its usage quota. Contact your administrator to update the API key.
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Collection Information</CardTitle>
            <CardDescription>Provide details about the flashcard collection that will be created</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collection-name">Collection name</Label>
              <Input
                id="collection-name"
                placeholder="Example: Cell Biology"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-description">Description (optional)</Label>
              <Input
                id="collection-description"
                placeholder="Example: Fundamental concepts about cells and their components"
                value={collectionDescription}
                onChange={(e) => setCollectionDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Document</CardTitle>
            <CardDescription>Upload a PDF or Word document (maximum 10MB)</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedFile ? (
              <div className="flex items-center bg-gray-50 p-3 rounded">
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setIsOptionsVisible(false);
                  }}
                >
                  <FileX className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <DocumentUpload onFileSelected={handleFileSelected} />
            )}
          </CardContent>
        </Card>
        
        {isOptionsVisible && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generation Options</CardTitle>
              <CardDescription>Customize how your flashcards will be generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="opt-definitions"
                    checked={generateDefinitions}
                    onCheckedChange={(checked) => 
                      setGenerateDefinitions(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="opt-definitions"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Generate definition cards
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Create cards for important terms and definitions
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="opt-concepts"
                    checked={generateConcepts}
                    onCheckedChange={(checked) => 
                      setGenerateConcepts(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="opt-concepts"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Generate key concept cards
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Create cards for main concepts and ideas
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="opt-multiple"
                    checked={includeMultipleChoice}
                    onCheckedChange={(checked) => 
                      setIncludeMultipleChoice(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="opt-multiple"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Include multiple choice options
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add multiple choice answer options to each card
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/collections")}
          >
            Cancel
          </Button>
          <div className="space-y-2">
            <Button
              type="submit"
              disabled={!selectedFile || !collectionName.trim() || uploadMutation.isPending}
              className="bg-primary hover:bg-primary/90 w-full"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Document"
              )}
            </Button>
            <p className="text-xs text-center text-gray-500">
              Note: Document processing requires a valid OpenAI API key with available credit. The GPT-4o model (used for flashcard generation) requires a paid account with sufficient balance.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

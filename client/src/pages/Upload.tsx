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
import { Loader2, FileX } from "lucide-react";

export default function Upload() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  
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
        title: "Documento procesado exitosamente",
        description: `Se generaron ${data.flashcardsCount} tarjetas para la colección "${data.collection.title}"`,
        variant: "default",
      });
      
      // Navigate to the newly created collection
      navigate(`/collections/${data.collection.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error al procesar el documento",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      });
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
        <h1 className="text-2xl font-bold text-gray-800">Subir Documento</h1>
        <p className="text-gray-600">Sube un documento PDF o Word para generar flashcards</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información de la colección</CardTitle>
            <CardDescription>Proporciona detalles sobre la colección de flashcards que se creará</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collection-name">Nombre de la colección</Label>
              <Input
                id="collection-name"
                placeholder="Ej: Biología Celular"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-description">Descripción (opcional)</Label>
              <Input
                id="collection-description"
                placeholder="Ej: Conceptos fundamentales sobre la célula y sus componentes"
                value={collectionDescription}
                onChange={(e) => setCollectionDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Documento</CardTitle>
            <CardDescription>Sube un documento PDF o Word (máximo 10MB)</CardDescription>
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
              <CardTitle>Opciones de generación</CardTitle>
              <CardDescription>Personaliza cómo se generarán tus flashcards</CardDescription>
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
                      Generar tarjetas de definiciones
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Crea tarjetas para términos y definiciones importantes
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
                      Generar tarjetas de conceptos clave
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Crea tarjetas para conceptos e ideas principales
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
                      Incluir opciones múltiples
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Agrega opciones de respuesta múltiple a cada tarjeta
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
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!selectedFile || !collectionName.trim() || uploadMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Procesar Documento"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

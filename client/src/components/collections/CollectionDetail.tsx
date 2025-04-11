import { useState } from "react";
import { useLocation } from "wouter";
import { Collection, Flashcard } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { FlashCard } from "@/components/flashcards/FlashCard";
import { ArrowLeft, Play, Edit, Download, ChevronDown } from "lucide-react";

interface CollectionDetailProps {
  collection: Collection;
  flashcards: Flashcard[];
  onBack: () => void;
}

export function CollectionDetail({ collection, flashcards, onBack }: CollectionDetailProps) {
  const [, navigate] = useLocation();
  const [visibleCards, setVisibleCards] = useState(6);
  
  const handleStartQuiz = () => {
    navigate(`/quiz/${collection.id}`);
  };
  
  const handleExport = () => {
    // Create a JSON representation of the collection and its flashcards
    const exportData = {
      collection,
      flashcards
    };
    
    // Convert to string
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link and click it
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.title.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const loadMoreCards = () => {
    setVisibleCards(prev => Math.min(prev + 6, flashcards.length));
  };
  
  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="mb-6">
        <Button variant="ghost" className="mb-4" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a colecciones
        </Button>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{collection.title}</h1>
            <p className="text-gray-600">{collection.description || "Sin descripción"}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button className="bg-primary hover:bg-primary/90" onClick={handleStartQuiz}>
              <Play className="mr-2 h-4 w-4" />
              Iniciar Quiz
            </Button>
            
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-4">
          Tarjetas ({flashcards.length})
        </h2>
        
        {flashcards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tarjetas</h3>
            <p className="text-gray-500 mb-4">Esta colección no tiene flashcards.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {flashcards.slice(0, visibleCards).map((flashcard) => (
              <FlashCard key={flashcard.id} flashcard={flashcard} />
            ))}
            
            {visibleCards < flashcards.length && (
              <div className="text-center mt-4">
                <Button variant="ghost" onClick={loadMoreCards} className="mx-auto">
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Ver más tarjetas
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

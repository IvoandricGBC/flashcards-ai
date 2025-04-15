import { useState } from "react";
import { useLocation } from "wouter";
import { Collection, Flashcard } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { FlashCard } from "@/components/flashcards/FlashCard";
import { ExportButton } from "@/components/collections/ExportButton";
import { GenkiDeckView } from "@/components/flashcards/GenkiDeckView";
import { ArrowLeft, Play, Edit, Download, ChevronDown, BookOpen } from "lucide-react";

interface CollectionDetailProps {
  collection: Collection;
  flashcards: Flashcard[];
  onBack: () => void;
}

export function CollectionDetail({ collection, flashcards, onBack }: CollectionDetailProps) {
  const [, navigate] = useLocation();
  const [visibleCards, setVisibleCards] = useState(6);
  const [isGenkiViewOpen, setIsGenkiViewOpen] = useState(false);
  
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
  
  const handleOpenGenkiView = () => {
    if (flashcards && flashcards.length > 0) {
      setIsGenkiViewOpen(true);
    }
  };
  
  const handleCloseGenkiView = () => {
    setIsGenkiViewOpen(false);
  };
  
  const loadMoreCards = () => {
    setVisibleCards(prev => Math.min(prev + 6, flashcards.length));
  };
  
  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="mb-6">
        <Button variant="ghost" className="mb-4" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to collections
        </Button>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{collection.title}</h1>
            <p className="text-gray-600">{collection.description || "No description"}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button className="bg-primary hover:bg-primary/90" onClick={handleStartQuiz}>
              <Play className="mr-2 h-4 w-4" />
              Start Quiz
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={handleOpenGenkiView}
              disabled={flashcards.length === 0}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Genki Deck View
            </Button>
            
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            
            <ExportButton 
              collectionId={collection.id} 
              disabled={flashcards.length === 0} 
            />
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">
            Cards ({flashcards ? flashcards.length : 0})
          </h2>
          
          {flashcards && flashcards.length > 0 && (
            <p className="text-sm text-gray-500">
              {visibleCards} of {flashcards.length} cards shown
            </p>
          )}
        </div>

        {!flashcards || flashcards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cards found</h3>
            <p className="text-gray-500 mb-4">This collection doesn't have any flashcards or they are still loading.</p>
          </div>
        ) : (
          <>
            {/* Responsive grid layout for cards */}
            <div className="md:flashcards-grid space-y-6 md:space-y-0">
              {flashcards.slice(0, visibleCards).map((flashcard) => (
                <FlashCard key={flashcard.id} flashcard={flashcard} />
              ))}
            </div>
            
            {visibleCards < flashcards.length && (
              <div className="text-center mt-8">
                <Button 
                  variant="outline" 
                  onClick={loadMoreCards} 
                  className="mx-auto px-6 py-2 border-primary/30 hover:border-primary"
                >
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Load more cards ({flashcards.length - visibleCards} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Genki Deck View Modal */}
      {isGenkiViewOpen && flashcards && flashcards.length > 0 && (
        <GenkiDeckView 
          flashcards={flashcards} 
          collectionId={collection.id}
          onClose={handleCloseGenkiView} 
        />
      )}
    </div>
  );
}

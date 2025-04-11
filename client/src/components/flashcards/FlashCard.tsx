import { useState, useEffect } from "react";
import { Flashcard } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RotateCw, ArrowRight, ArrowLeft, BookOpen } from "lucide-react";

interface FlashCardProps {
  flashcard: Flashcard;
}

export function FlashCard({ flashcard }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [animating, setAnimating] = useState(false);
  
  // Setup responsive height for different screen sizes
  const [cardHeight, setCardHeight] = useState("auto");
  
  // Update height based on screen size
  useEffect(() => {
    const updateCardHeight = () => {
      if (window.innerWidth < 640) { // Mobile
        setCardHeight("auto");
      } else if (window.innerWidth < 1024) { // Tablet
        setCardHeight("280px");
      } else { // Desktop
        setCardHeight("320px");
      }
    };
    
    updateCardHeight();
    window.addEventListener("resize", updateCardHeight);
    return () => window.removeEventListener("resize", updateCardHeight);
  }, []);
  
  const toggleFlip = () => {
    setAnimating(true);
    setIsFlipped(!isFlipped);
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setAnimating(false);
    }, 600);
  };
  
  // Generate contrasting background colors for flashcards
  const generateBgColor = (id: number) => {
    const colors = [
      "bg-blue-50", "bg-green-50", "bg-yellow-50", 
      "bg-indigo-50", "bg-purple-50", "bg-pink-50"
    ];
    return colors[id % colors.length];
  };
  
  const frontBgColor = generateBgColor(flashcard.id);
  
  return (
    <div className={`card-flip flashcard-transition flashcard-hover ${isFlipped ? 'flipped' : ''}`}>
      <div 
        className="card-flip-inner border border-gray-200 rounded-lg shadow-sm relative w-full" 
        style={{ height: cardHeight, minHeight: "200px" }}
      >
        {/* Front of card */}
        <Card className={`card-front absolute inset-0 flex flex-col ${frontBgColor}`}>
          <div className="flex-1 flex items-center justify-center p-6">
            <h3 className="text-lg text-center font-medium">{flashcard.question}</h3>
          </div>
          <div className="p-4 text-center bg-white/90 border-t border-gray-100">
            <Button 
              variant="default" 
              onClick={toggleFlip} 
              disabled={animating}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Show answer
            </Button>
          </div>
        </Card>
        
        {/* Back of card */}
        <Card className="card-back absolute inset-0 flex flex-col bg-white">
          <div className="flex-1 p-6 overflow-auto custom-scrollbar">
            <h4 className="font-medium mb-3 text-primary">Correct answer:</h4>
            <p className="bg-success/10 text-success-foreground p-3 rounded-md mb-4 flex items-start border border-success/20">
              <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-success" />
              <span className="font-medium">{flashcard.correctAnswer}</span>
            </p>
            
            <h4 className="font-medium mb-2 text-primary">Other options:</h4>
            <ul className="space-y-2 mb-2">
              {flashcard.options && flashcard.options.length > 0 
                ? flashcard.options
                    .filter(option => option !== flashcard.correctAnswer)
                    .map((option, index) => (
                      <li key={index} className="bg-gray-50 p-3 rounded-md border border-gray-100 text-gray-700">{option}</li>
                    ))
                : <li className="text-gray-500 italic">No additional options available</li>
              }
            </ul>
          </div>
          <div className="p-4 text-center bg-gray-50 border-t border-gray-100">
            <Button 
              variant="outline" 
              onClick={toggleFlip} 
              disabled={animating}
              className="transition-all duration-300"
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Flip card
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

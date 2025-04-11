import { useState } from "react";
import { Flashcard } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface FlashCardProps {
  flashcard: Flashcard;
}

export function FlashCard({ flashcard }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };
  
  return (
    <div className={`card-flip ${isFlipped ? 'flipped' : ''}`}>
      <div className="card-flip-inner border border-gray-200 rounded-lg shadow-sm h-64">
        {/* Front of card */}
        <Card className={`card-front absolute inset-0 flex flex-col ${isFlipped ? 'hidden' : ''}`}>
          <div className="flex-1 flex items-center justify-center p-6">
            <h3 className="text-lg text-center">{flashcard.question}</h3>
          </div>
          <div className="p-4 text-center">
            <Button variant="secondary" onClick={toggleFlip}>
              Show answer
            </Button>
          </div>
        </Card>
        
        {/* Back of card */}
        <Card className={`card-back absolute inset-0 flex flex-col bg-primary/5 ${!isFlipped ? 'hidden' : ''}`}>
          <div className="flex-1 p-6">
            <h4 className="font-medium mb-3">Correct answer:</h4>
            <p className="bg-success/20 text-success p-3 rounded-md mb-3 flex items-start">
              <CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{flashcard.correctAnswer}</span>
            </p>
            
            <h4 className="font-medium mb-2">Other options:</h4>
            <ul className="space-y-2">
              {flashcard.options
                .filter(option => option !== flashcard.correctAnswer)
                .map((option, index) => (
                  <li key={index} className="bg-white p-2 rounded">{option}</li>
                ))}
            </ul>
          </div>
          <div className="p-4 text-center">
            <Button variant="secondary" onClick={toggleFlip}>
              Show question
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

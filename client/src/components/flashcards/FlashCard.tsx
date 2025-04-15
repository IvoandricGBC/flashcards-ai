import { useState, useEffect } from "react";
import { Flashcard } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, RotateCw, ArrowRight, ArrowLeft, BookOpen, 
  Brain, Lightbulb, History, School, Bookmark, Award, 
  GraduationCap, Calendar, User, Globe, Atom, PenTool
} from "lucide-react";

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
  
  // Select theme icon based on question content
  const getThemeIcon = () => {
    const question = flashcard.question.toLowerCase();
    
    // Check for keywords in the question to determine icon
    if (question.includes("philosophy") || question.includes("socrates") || 
        question.includes("plato") || question.includes("aristotle") || 
        question.includes("thinking") || question.includes("method")) {
      return <Brain className="h-6 w-6 text-primary/70" />;
    } else if (question.includes("history") || question.includes("period") || 
               question.includes("century") || question.includes("ancient") || 
               question.includes("timeline")) {
      return <History className="h-6 w-6 text-amber-500/70" />;
    } else if (question.includes("science") || question.includes("physics") || 
               question.includes("chemistry") || question.includes("biology")) {
      return <Atom className="h-6 w-6 text-blue-500/70" />;
    } else if (question.includes("education") || question.includes("learning") || 
               question.includes("teaching") || question.includes("study")) {
      return <GraduationCap className="h-6 w-6 text-indigo-500/70" />;
    } else if (question.includes("idea") || question.includes("concept") || 
               question.includes("invention") || question.includes("theory")) {
      return <Lightbulb className="h-6 w-6 text-yellow-500/70" />;
    } else if (question.includes("writing") || question.includes("author") || 
               question.includes("book") || question.includes("text")) {
      return <PenTool className="h-6 w-6 text-violet-500/70" />;
    } else if (question.includes("person") || question.includes("who") || 
               question.includes("born") || question.includes("life")) {
      return <User className="h-6 w-6 text-green-500/70" />;
    } else if (question.includes("world") || question.includes("country") || 
               question.includes("global") || question.includes("international")) {
      return <Globe className="h-6 w-6 text-blue-600/70" />;
    } else if (question.includes("date") || question.includes("year") || 
               question.includes("when") || question.includes("time")) {
      return <Calendar className="h-6 w-6 text-red-500/70" />;
    } else {
      return <School className="h-6 w-6 text-primary/70" />;
    }
  };
  
  const frontBgColor = generateBgColor(flashcard.id);
  const CardIcon = getThemeIcon();
  
  return (
    <div className={`card-flip flashcard-transition flashcard-hover ${isFlipped ? 'flipped' : ''}`}>
      <div 
        className="card-flip-inner border border-gray-200 rounded-lg shadow-sm relative w-full" 
        style={{ height: cardHeight, minHeight: "200px" }}
      >
        {/* Front of card */}
        <Card className={`card-front absolute inset-0 flex flex-col ${frontBgColor}`}>
          <div className="absolute top-3 left-3">
            {CardIcon}
          </div>
          <div className="flex-1 flex items-center justify-center p-6 pt-10">
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
          <div className="absolute top-3 right-3 opacity-50">
            {CardIcon}
          </div>
          <div className="flex-1 p-6 overflow-auto custom-scrollbar">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium text-primary text-lg">Answer:</h4>
              <span className="text-xs text-gray-500">Card #{flashcard.id}</span>
            </div>
            <div className="flex justify-center items-center flex-1">
              <p className="bg-success/10 text-success-foreground p-4 rounded-md flex items-center border border-success/20 text-center">
                <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0 text-success" />
                <span className="font-medium text-lg">{flashcard.correctAnswer}</span>
              </p>
            </div>
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

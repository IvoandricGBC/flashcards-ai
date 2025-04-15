import { useState, useRef, useEffect } from 'react';
import { Flashcard } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RotateCcw, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface GenkiDeckViewProps {
  flashcards: Flashcard[];
  collectionId: number;
  onClose: () => void;
}

export function GenkiDeckView({ flashcards, collectionId, onClose }: GenkiDeckViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentCard = flashcards[currentIndex];
  
  // Reset flipped state when changing cards
  useEffect(() => {
    setFlipped(false);
  }, [currentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevCard();
      } else if (e.key === 'ArrowRight') {
        handleNextCard();
      } else if (e.key === ' ' || e.key === 'Enter') {
        setFlipped(!flipped);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, flipped, flashcards.length]);

  const handleNextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleExportCSV = async () => {
    try {
      // Create a link element
      const link = document.createElement('a');
      link.href = `/api/export-csv/${collectionId}`;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export successful',
        description: 'The flashcards have been exported to CSV format',
      });
    } catch (error) {
      console.error('Error during export:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error exporting the flashcards',
        variant: 'destructive',
      });
    }
  };

  // Card variants for animation
  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
      },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.3,
      },
    }),
  };

  // Flip animation
  const flipVariants = {
    front: {
      rotateY: 0,
      transition: { duration: 0.5 }
    },
    back: {
      rotateY: 180,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        ref={containerRef} 
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl h-[80vh] max-h-[600px] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Genki Deck View - Card {currentIndex + 1} of {flashcards.length}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        
        {/* Card display area */}
        <div className="flex-1 relative flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-800">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute w-[90%] h-[80%]"
            >
              <motion.div
                className="w-full h-full rounded-xl bg-white dark:bg-gray-700 shadow-lg p-6 flex items-center justify-center cursor-pointer perspective"
                onClick={handleFlip}
                animate={flipped ? "back" : "front"}
                variants={flipVariants}
                style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
              >
                {!flipped ? (
                  <div className="absolute inset-0 flex items-center justify-center p-8 text-center backface-hidden">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{currentCard.question}</h3>
                  </div>
                ) : (
                  <div 
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center backface-hidden"
                    style={{ transform: "rotateY(180deg)" }}
                  >
                    <h3 className="text-2xl font-bold text-primary mb-4">{currentCard.correctAnswer}</h3>
                    
                    {currentCard.options && currentCard.options.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 gap-2 text-left w-full">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Other options:</p>
                        {currentCard.options
                          .filter(option => option !== currentCard.correctAnswer)
                          .map((option, i) => (
                            <div key={i} className="p-2 rounded-md bg-gray-100 dark:bg-gray-600 text-sm">
                              {option}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
              
              <div className="absolute bottom-2 left-0 right-0 text-center text-sm text-gray-500">
                Click card to flip or press Space
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Controls */}
        <div className="p-4 border-t flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              onClick={handlePrevCard} 
              disabled={currentIndex === 0}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            
            <Button 
              onClick={handleNextCard} 
              disabled={currentIndex === flashcards.length - 1}
              variant="outline"
              size="sm"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            
            <Button 
              onClick={() => setCurrentIndex(0)}
              variant="ghost"
              size="sm"
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Restart
            </Button>
          </div>
          
          <Button 
            onClick={handleExportCSV}
            variant="secondary"
            size="sm"
          >
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
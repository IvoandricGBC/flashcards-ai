import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collection, Flashcard } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, X, Check } from "lucide-react";

export default function Quiz() {
  const params = useParams();
  const collectionId = params.id ? parseInt(params.id) : 0;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  
  // Get collection details
  const { data: collection, isLoading: isLoadingCollection } = useQuery<Collection>({
    queryKey: [`/api/collections/${collectionId}`],
  });
  
  // Get flashcards for the collection
  const { data: flashcards, isLoading: isLoadingFlashcards } = useQuery<Flashcard[]>({
    queryKey: [`/api/collections/${collectionId}/flashcards`],
  });
  
  // Save quiz session mutation
  const saveQuizSessionMutation = useMutation({
    mutationFn: async () => {
      if (!flashcards) return null;
      
      const response = await apiRequest("POST", "/api/quiz-sessions", {
        collectionId,
        score,
        totalQuestions: flashcards.length,
        userId: null
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      toast({
        title: "Quiz completed",
        description: `Your score: ${score}/${flashcards?.length}`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving quiz session",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Get current question
  const currentQuestion = flashcards?.[currentQuestionIndex];
  
  // Calculate progress
  const progress = flashcards?.length 
    ? ((answeredQuestions.length) / flashcards.length) * 100 
    : 0;
  
  // Handle option selection
  const handleOptionSelect = (option: string) => {
    if (isAnswerRevealed) return;
    
    setSelectedOption(option);
    setIsAnswerRevealed(true);
    
    // Update score if the answer is correct
    if (option === currentQuestion?.correctAnswer) {
      setScore(prev => prev + 1);
    }
    
    // Mark this question as answered
    if (!answeredQuestions.includes(currentQuestionIndex)) {
      setAnsweredQuestions(prev => [...prev, currentQuestionIndex]);
    }
  };
  
  // Handle next question
  const goToNextQuestion = () => {
    if (!flashcards) return;
    
    if (currentQuestionIndex < flashcards.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
    } else {
      // Quiz is completed
      setQuizCompleted(true);
      saveQuizSessionMutation.mutate();
    }
  };
  
  // Handle previous question
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
    }
  };
  
  // Handle close/exit quiz
  const handleCloseQuiz = () => {
    if (answeredQuestions.length > 0 && !quizCompleted) {
      // Ask for confirmation
      if (confirm("Are you sure you want to exit? You will lose your current progress.")) {
        navigate(`/collections/${collectionId}`);
      }
    } else {
      navigate(`/collections/${collectionId}`);
    }
  };
  
  // Shuffle the options for current question
  useEffect(() => {
    if (currentQuestion && !selectedOption) {
      // Reset state for the new question
      setIsAnswerRevealed(false);
    }
  }, [currentQuestionIndex, currentQuestion]);
  
  // Loading state
  if (isLoadingCollection || isLoadingFlashcards) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-3xl mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto mb-8"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // No flashcards state
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-3xl mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">No hay tarjetas disponibles</h2>
            <p className="text-gray-600 mb-6">
              Esta colección no tiene flashcards para realizar un quiz.
            </p>
            <Button onClick={() => navigate(`/collections/${collectionId}`)}>
              Volver a la colección
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Quiz completed state
  if (quizCompleted) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-3xl mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">¡Quiz Completado!</h2>
            <div className="text-4xl font-bold text-primary mb-6">
              {score}/{flashcards.length}
            </div>
            <p className="text-gray-600 mb-8">
              Has completado el quiz de <span className="font-medium">{collection?.title}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => {
                setCurrentQuestionIndex(0);
                setSelectedOption(null);
                setIsAnswerRevealed(false);
                setScore(0);
                setQuizCompleted(false);
                setAnsweredQuestions([]);
              }}>
                Reintentar
              </Button>
              <Button onClick={() => navigate(`/collections/${collectionId}`)}>
                Volver a la colección
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Quiz: {collection?.title}</h2>
            <p className="text-sm text-gray-600">
              Pregunta {currentQuestionIndex + 1} de {flashcards.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 text-primary font-medium px-3 py-1 rounded-full text-sm">
              Puntuación: {score}/{answeredQuestions.length}
            </div>
            <Button variant="ghost" size="icon" onClick={handleCloseQuiz}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-8">
            <Progress className="h-2" value={progress} />
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-6 text-center">
              {currentQuestion?.question}
            </h3>
            
            {/* Quiz Options */}
            <div className="space-y-3">
              {currentQuestion?.options.map((option, index) => (
                <button
                  key={index}
                  className={`w-full text-left p-4 border rounded-lg transition-colors ${
                    selectedOption === option
                      ? option === currentQuestion?.correctAnswer
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                      : isAnswerRevealed && option === currentQuestion?.correctAnswer
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-primary hover:bg-primary/5"
                  }`}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isAnswerRevealed}
                >
                  <div className="flex justify-between items-center">
                    <span>{option}</span>
                    {isAnswerRevealed && (
                      option === currentQuestion?.correctAnswer ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : selectedOption === option ? (
                        <X className="h-5 w-5 text-red-500" />
                      ) : null
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              className="gap-1"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              className="gap-1"
              onClick={goToNextQuestion}
              disabled={!isAnswerRevealed}
            >
              {currentQuestionIndex < flashcards.length - 1 ? (
                <>
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                "Finalizar Quiz"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

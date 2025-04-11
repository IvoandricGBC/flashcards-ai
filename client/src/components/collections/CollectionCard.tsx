import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Collection, Flashcard } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Book, FileText, Parentheses, MoreVertical, Star, StarOff, Pencil, PlayCircle, Trash } from "lucide-react";

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [cardCount, setCardCount] = useState<number | null>(null);
  
  // Fetch flashcards count for this collection
  const { data: flashcards, isLoading: isLoadingFlashcards } = useQuery<Flashcard[]>({
    queryKey: [`/api/collections/${collection.id}/flashcards`],
    enabled: !!collection.id,
  });
  
  // Update card count when data is loaded
  useEffect(() => {
    if (flashcards) {
      setCardCount(flashcards.length);
    }
  }, [flashcards]);
  
  // Toggle favorite status mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/collections/${collection.id}`, {
        favorite: !collection.favorite
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      toast({
        title: collection.favorite ? "Removed from favorites" : "Added to favorites",
        description: `"${collection.title}" has been ${collection.favorite ? "removed from" : "added to"} your favorites`,
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not update favorite status",
        variant: "destructive",
      });
    },
  });
  
  // Delete collection mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/collections/${collection.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      toast({
        title: "Collection deleted",
        description: `"${collection.title}" has been deleted`,
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not delete the collection",
        variant: "destructive",
      });
    },
  });
  
  // Handle card click to navigate to collection detail
  const handleCardClick = () => {
    navigate(`/collections/${collection.id}`);
  };
  
  // Determine icon and colors based on collection title
  const getCardIcon = () => {
    const title = collection.title.toLowerCase();
    
    if (title.includes("biolog") || title.includes("science") || title.includes("natur")) {
      return <Book className="text-6xl text-secondary/60" />;
    } else if (title.includes("histor") || title.includes("litera") || title.includes("art")) {
      return <FileText className="text-6xl text-primary/60" />;
    } else if (title.includes("math") || title.includes("statistic") || title.includes("calc")) {
      return <Parentheses className="text-6xl text-indigo-300" />;
    } else {
      return <Book className="text-6xl text-gray-400" />;
    }
  };
  
  const getCardColorClass = () => {
    const title = collection.title.toLowerCase();
    
    if (title.includes("biolog") || title.includes("science") || title.includes("natur")) {
      return "bg-secondary/10";
    } else if (title.includes("histor") || title.includes("litera") || title.includes("art")) {
      return "bg-primary/10";
    } else if (title.includes("math") || title.includes("statistic") || title.includes("calc")) {
      return "bg-indigo-100";
    } else {
      return "bg-gray-100";
    }
  };
  
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the collection "${collection.title}"?`)) {
      deleteCollectionMutation.mutate();
    }
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCardClick}>
      <div className={`${getCardColorClass()} h-36 relative flex flex-col items-center justify-center`}>
        {getCardIcon()}
        {cardCount === 0 && !isLoadingFlashcards && (
          <span className="mt-3 text-xs px-2 py-1 bg-rose-100 text-rose-800 rounded-full">
            Empty collection
          </span>
        )}
        {collection.favorite && (
          <span className="absolute top-4 right-4 text-secondary">
            <Star className="h-5 w-5 fill-secondary text-secondary" />
          </span>
        )}
      </div>
      
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold mb-1">{collection.title}</h3>
        <p className="text-gray-600 text-sm mb-3">
          {collection.description || "No description"}
        </p>
        
        <div className="flex justify-between items-center">
          <span className={`text-sm flex items-center gap-1 ${cardCount === 0 ? 'text-rose-500' : 'text-gray-500'}`}>
            <FileText className="h-4 w-4" />
            {isLoadingFlashcards ? (
              <span>Loading...</span>
            ) : (
              <span>
                {cardCount !== null ? (
                  <>{cardCount} {cardCount === 1 ? 'card' : 'cards'} </>
                ) : (
                  '0 cards'
                )}
              </span>
            )}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="text-primary hover:text-primary/80">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  if (cardCount && cardCount > 0) {
                    navigate(`/quiz/${collection.id}`);
                  } else {
                    toast({
                      title: "Cannot start quiz",
                      description: "This collection doesn't have any flashcards. Add some cards first.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={cardCount === 0}
                className={cardCount === 0 ? "opacity-50 cursor-not-allowed" : ""}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                <span>Start Quiz</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                // Open edit form (not implemented)
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteMutation.mutate();
              }}>
                {collection.favorite ? (
                  <>
                    <StarOff className="mr-2 h-4 w-4" />
                    <span>Remove from favorites</span>
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    <span>Add to favorites</span>
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="text-red-500 focus:text-red-500" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

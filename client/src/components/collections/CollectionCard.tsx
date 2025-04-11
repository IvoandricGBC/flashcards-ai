import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Collection } from "@shared/schema";
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
        description: "No se pudo actualizar el estado de favorito",
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
        title: "Colección eliminada",
        description: `"${collection.title}" ha sido eliminada`,
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la colección",
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
    
    if (title.includes("biolog") || title.includes("ciencia") || title.includes("natur")) {
      return <Book className="text-6xl text-secondary/60" />;
    } else if (title.includes("historia") || title.includes("litera") || title.includes("art")) {
      return <FileText className="text-6xl text-primary/60" />;
    } else if (title.includes("matem") || title.includes("estadistica") || title.includes("estad") || title.includes("cálc")) {
      return <Parentheses className="text-6xl text-indigo-300" />;
    } else {
      return <Book className="text-6xl text-gray-400" />;
    }
  };
  
  const getCardColorClass = () => {
    const title = collection.title.toLowerCase();
    
    if (title.includes("biolog") || title.includes("ciencia") || title.includes("natur")) {
      return "bg-secondary/10";
    } else if (title.includes("historia") || title.includes("litera") || title.includes("art")) {
      return "bg-primary/10";
    } else if (title.includes("matem") || title.includes("estadistica") || title.includes("estad") || title.includes("cálc")) {
      return "bg-indigo-100";
    } else {
      return "bg-gray-100";
    }
  };
  
  const handleDelete = () => {
    if (confirm(`¿Estás seguro de que deseas eliminar la colección "${collection.title}"?`)) {
      deleteCollectionMutation.mutate();
    }
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCardClick}>
      <div className={`${getCardColorClass()} h-36 relative flex items-center justify-center`}>
        {getCardIcon()}
        {collection.favorite && (
          <span className="absolute top-4 right-4 text-secondary">
            <Star className="h-5 w-5 fill-secondary text-secondary" />
          </span>
        )}
      </div>
      
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold mb-1">{collection.title}</h3>
        <p className="text-gray-600 text-sm mb-3">
          {collection.description || "Sin descripción"}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{/* Replace with actual count when available */} tarjetas</span>
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="text-primary hover:text-primary/80">
                <MoreVertical className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                navigate(`/quiz/${collection.id}`);
              }}>
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

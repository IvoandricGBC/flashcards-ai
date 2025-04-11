import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Collection, Flashcard } from "@shared/schema";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { CollectionDetail } from "@/components/collections/CollectionDetail";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PlusCircle, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Collections() {
  const params = useParams();
  const collectionId = params?.id ? parseInt(params.id) : undefined;
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get all collections
  const { data: collections, isLoading } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
  });
  
  // If a collection ID is provided, get the flashcards for that collection
  const { data: flashcards } = useQuery<Flashcard[]>({
    queryKey: ['/api/collections', collectionId, 'flashcards'],
    enabled: !!collectionId,
  });
  
  // Get the selected collection
  const selectedCollection = collections?.find(c => c.id === collectionId);
  
  // Filter collections based on search term
  const filteredCollections = collections?.filter(collection => 
    collection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (collection.description && collection.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Handle back button click
  const handleBackClick = () => {
    setLocation('/collections');
  };
  
  const renderCollectionsList = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Skeleton className="h-36" />
              <div className="p-5 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (filteredCollections?.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron colecciones</h3>
          <p className="text-gray-500 mb-4">No hay colecciones que coincidan con tu búsqueda.</p>
          <Link href="/upload">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear nueva colección
            </Button>
          </Link>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredCollections?.map(collection => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    );
  };
  
  // If a collection is selected, show the detail view instead of the list
  if (collectionId && selectedCollection) {
    return (
      <CollectionDetail 
        collection={selectedCollection} 
        flashcards={flashcards || []} 
        onBack={handleBackClick}
      />
    );
  }
  
  return (
    <div className="container mx-auto p-4 lg:p-6">
      {/* Tab Navigation */}
      <div className="bg-white shadow mb-6 -mx-4 lg:-mx-6">
        <div className="container mx-auto">
          <Tabs defaultValue="collections">
            <TabsList className="h-auto bg-transparent border-b border-gray-200 w-full justify-start">
              <TabsTrigger 
                value="all" 
                className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none data-[state=active]:shadow-none"
              >
                Todos
              </TabsTrigger>
              <TabsTrigger 
                value="collections" 
                className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none data-[state=active]:shadow-none"
              >
                Colecciones
              </TabsTrigger>
              <TabsTrigger 
                value="recent" 
                className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none data-[state=active]:shadow-none"
              >
                Recientes
              </TabsTrigger>
              <TabsTrigger 
                value="favorites" 
                className="px-6 py-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none data-[state=active]:shadow-none"
              >
                Favoritos
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="m-0 p-0">
              {/* Content for "All" tab */}
            </TabsContent>
            
            <TabsContent value="collections" className="m-0 p-0">
              {/* Content for Collections is rendered outside */}
            </TabsContent>
            
            <TabsContent value="recent" className="m-0 p-0">
              {/* Content for "Recent" tab */}
            </TabsContent>
            
            <TabsContent value="favorites" className="m-0 p-0">
              {/* Content for "Favorites" tab */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Header with search and actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Colecciones</h1>
          <p className="text-gray-600">Gestiona tus conjuntos de flashcards</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar colecciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full sm:w-auto min-w-[200px]"
            />
          </div>
          
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtrar
          </Button>
          
          <Link href="/upload">
            <Button className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <PlusCircle className="h-4 w-4" />
              Nueva Colección
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Collections Grid */}
      {renderCollectionsList()}
    </div>
  );
}

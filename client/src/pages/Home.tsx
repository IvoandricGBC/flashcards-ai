import { Activity } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity as ActivityType } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function Home() {
  const { data: activities, isLoading } = useQuery<ActivityType[]>({
    queryKey: ['/api/activities/recent'],
  });
  
  const { data: collections, isLoading: isLoadingCollections } = useQuery({
    queryKey: ['/api/collections'],
  });
  
  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Bienvenido a FlashLearn</h1>
          <p className="text-gray-600 mt-1">
            Transforme documentos en flashcards interactivas para aprender más eficientemente
          </p>
        </div>
        <div>
          <Link href="/upload">
            <Button className="bg-primary hover:bg-primary/90">
              <CloudUpload className="mr-2 h-4 w-4" />
              Subir Documento
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Colecciones</CardTitle>
            <CardDescription>Tus conjuntos de flashcards</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-primary">
            {isLoadingCollections ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              collections?.length || 0
            )}
          </CardContent>
          <CardFooter>
            <Link href="/collections">
              <Button variant="outline" className="w-full">Ver colecciones</Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tarjetas Creadas</CardTitle>
            <CardDescription>Total de flashcards generadas</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-secondary">
            {isLoadingCollections ? (
              <Skeleton className="h-10 w-16" />
            ) : (
              "24+"
            )}
          </CardContent>
          <CardFooter>
            <Link href="/collections">
              <Button variant="outline" className="w-full">Estudiar ahora</Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Último Quiz</CardTitle>
            <CardDescription>Tu sesión de estudio más reciente</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              activities?.find(a => a.type === "quiz") ? (
                <div className="text-xl font-bold text-success">
                  {activities.find(a => a.type === "quiz")?.description.split(" en ")[0]}
                </div>
              ) : (
                <div className="text-gray-500 italic">Sin actividad reciente</div>
              )
            )}
          </CardContent>
          <CardFooter>
            <Link href="/collections">
              <Button variant="outline" className="w-full">Iniciar nuevo quiz</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Actividad Reciente</h2>
        
        <Card>
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            activities.map((activity, i, arr) => (
              <div key={activity.id}>
                <div className="flex p-4">
                  <ActivityIcon type={activity.type} />
                  <div className="flex-1">
                    <p className="font-medium">{getActivityTitle(activity.type)}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), { 
                        addSuffix: true,
                        locale: es
                      })}
                    </p>
                  </div>
                </div>
                {i < arr.length - 1 && <hr className="border-gray-100" />}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Activity className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium mb-1">Sin actividades</h3>
              <p className="text-sm">Comienza a usar FlashLearn para ver tu actividad reciente aquí</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  let bgColor = "bg-primary/20";
  let textColor = "text-primary";
  let icon = <Activity className="h-5 w-5" />;
  
  switch (type) {
    case "upload":
      bgColor = "bg-primary/20";
      textColor = "text-primary";
      icon = <CloudUpload className="h-5 w-5" />;
      break;
    case "generation":
    case "create":
      bgColor = "bg-green-100";
      textColor = "text-green-600";
      icon = <PlusCircle className="h-5 w-5" />;
      break;
    case "quiz":
      bgColor = "bg-purple-100";
      textColor = "text-purple-600";
      icon = <HelpCircle className="h-5 w-5" />;
      break;
  }
  
  return (
    <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center mr-3 ${textColor}`}>
      {icon}
    </div>
  );
}

function getActivityTitle(type: string): string {
  switch (type) {
    case "upload":
      return "Documento subido";
    case "generation":
      return "Tarjetas generadas";
    case "create":
      return "Colección creada";
    case "quiz":
      return "Quiz completado";
    default:
      return "Actividad";
  }
}

// Import these at the top of the file
import { CloudUpload, PlusCircle, HelpCircle } from "lucide-react";

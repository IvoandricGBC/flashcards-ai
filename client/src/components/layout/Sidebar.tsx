import { Link, useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { School, CloudUpload, Navigation, Settings, CreditCard } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  
  // Get collections count for storage usage
  const { data: collections } = useQuery({ 
    queryKey: ['/api/collections'],
    refetchOnWindowFocus: false
  });
  
  const collectionCount = collections?.length || 0;
  const storageUsage = Math.min(Math.max((collectionCount / 30) * 100, 5), 100);
  
  const navItems = [
    { path: "/", label: "Home", icon: <Navigation className="w-5 h-5" /> },
    { path: "/upload", label: "Upload Documents", icon: <CloudUpload className="w-5 h-5" /> },
    { path: "/collections", label: "My Flashcards", icon: <CreditCard className="w-5 h-5" /> },
    { path: "/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];
  
  return (
    <div className="lg:w-64 bg-white shadow-md z-10 lg:min-h-screen">
      <div className="p-4 bg-primary">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2">
          <School className="h-6 w-6" />
          FlashLearn
        </h1>
      </div>
      
      <nav className="p-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.path} className="mb-2">
              <Link href={item.path}>
                <a
                  className={`flex items-center gap-2 p-2 rounded hover:bg-gray-100 font-medium ${
                    (location === item.path || 
                    (item.path === "/collections" && location.startsWith("/collections/")))
                      ? "bg-primary bg-opacity-10 text-primary"
                      : "text-dark"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto p-4">
        <Separator className="my-4" />
        <div className="bg-gray-100 p-3 rounded-lg">
          <h3 className="font-medium text-sm text-gray-700 mb-2">Storage Usage</h3>
          <Progress className="h-2" value={storageUsage} />
          <p className="text-xs text-gray-500 mt-1">{collectionCount} collections ({Math.round(storageUsage)}%)</p>
        </div>
      </div>
    </div>
  );
}

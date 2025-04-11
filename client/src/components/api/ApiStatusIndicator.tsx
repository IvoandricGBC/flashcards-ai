import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ApiStatusIndicatorProps {
  onRefresh?: () => void;
}

export function ApiStatusIndicator({ onRefresh }: ApiStatusIndicatorProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "unknown">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);

  const checkApiStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/status/openai", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setStatus("error");
        setErrorMessage(errorData.message || "Failed to check API status");
        return;
      }

      const data = await response.json();
      setStatus(data.status === "ok" ? "success" : "error");
      
      if (data.status !== "ok") {
        setErrorMessage(data.message || "API check failed");
      }
    } catch (error) {
      setStatus("unknown");
      setErrorMessage("Could not check API status");
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
  }, []);

  let alertVariant: "default" | "destructive" = status === "success" ? "default" : "destructive";
  let icon = status === "success" ? 
    <CheckCircle className="h-4 w-4" /> : 
    (status === "error" ? <XCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />);
  
  let title = status === "success" ? 
    "OpenAI API Ready" : 
    (status === "error" ? "OpenAI API Issue" : "API Status Unknown");
  
  let description = status === "success" ? 
    "The OpenAI API key is valid and ready to process documents." : 
    (status === "error" ? errorMessage : "Could not verify the API status");

  return (
    <Alert variant={alertVariant} className="mb-6">
      {icon}
      <div className="flex w-full justify-between items-center">
        <div>
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{description}</AlertDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            checkApiStatus();
            if (onRefresh) onRefresh();
          }}
          disabled={isChecking}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </Alert>
  );
}
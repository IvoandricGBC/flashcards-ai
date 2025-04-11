import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Upload, File } from "lucide-react";

interface DocumentUploadProps {
  onFileSelected: (file: File) => void;
}

export function DocumentUpload({ onFileSelected }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const validateFile = (file: File): boolean => {
    // Check file type
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo no soportado",
        description: "Por favor, sube un archivo PDF o Word (DOC/DOCX)",
        variant: "destructive",
      });
      return false;
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "Archivo demasiado grande",
        description: "El tamaño máximo permitido es 10MB",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const { files } = e.dataTransfer;
    if (files && files.length) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };
  
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-gray-300"
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
      
      <div className="flex flex-col items-center">
        <Upload className="h-12 w-12 text-gray-400 mb-3" />
        <p className="mb-2 font-medium">Arrastra y suelta archivos aquí</p>
        <p className="text-sm text-gray-500 mb-4">o</p>
        <Button
          type="button"
          className="bg-primary hover:bg-primary/90"
          onClick={handleBrowseClick}
        >
          <File className="mr-2 h-4 w-4" />
          Seleccionar Archivos
        </Button>
        <p className="text-xs text-gray-500 mt-4">
          Formatos soportados: PDF, DOC, DOCX (Máx. 10MB)
        </p>
      </div>
    </div>
  );
}

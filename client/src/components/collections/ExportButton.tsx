import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  collectionId: number;
  disabled?: boolean;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ExportButton({
  collectionId,
  disabled = false,
  variant = 'secondary',
  size = 'default',
  className = '',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Create a link element
      const link = document.createElement('a');
      
      // Set the link's href to the API endpoint
      link.href = `/api/export-csv/${collectionId}`;
      
      // Set download attribute to force download
      link.setAttribute('download', '');
      
      // Append to the document
      document.body.appendChild(link);
      
      // Trigger a click on the link
      link.click();
      
      // Remove the link from the document
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
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || isExporting}
      variant={variant}
      size={size}
      className={className}
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export
        </>
      )}
    </Button>
  );
}
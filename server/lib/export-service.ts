import { Flashcard, Collection } from '@shared/schema';

interface ExportOptions {
  includeMultipleChoice?: boolean;
}

/**
 * Service to handle exporting flashcards to different formats
 */
export class ExportService {
  /**
   * Export a collection of flashcards to CSV format
   * 
   * @param collection The collection containing the flashcards
   * @param flashcards Array of flashcards to export
   * @param options Export options
   * @returns Buffer containing the CSV file
   */
  public async exportToCSV(
    collection: Collection,
    flashcards: Flashcard[],
    options: ExportOptions = {}
  ): Promise<Buffer> {
    try {
      // Create CSV headers
      let csvContent = "Question,Answer";
      
      // Solo incluimos pregunta y respuesta, sin opciones múltiples
      csvContent += "\n";
      
      // Process each flashcard and add it to the CSV
      for (const card of flashcards) {
        // Escape quotes by doubling them
        const question = card.question.replace(/"/g, '""');
        const answer = card.correctAnswer.replace(/"/g, '""');
        
        // Add the basic question/answer pair
        csvContent += `"${question}","${answer}"`;
        
        // Ya no incluimos opciones múltiples
        
        csvContent += "\n";
      }
      
      // Convert to Buffer
      return Buffer.from(csvContent, 'utf-8');
    } catch (error) {
      console.error('Error exporting collection to CSV format:', error);
      throw new Error(`Failed to export collection to CSV format: ${(error as Error).message}`);
    }
  }
  
  /**
   * Export a collection of flashcards to JSON format
   * 
   * @param collection The collection containing the flashcards
   * @param flashcards Array of flashcards to export
   * @returns Buffer containing the JSON file
   */
  public async exportToJSON(
    collection: Collection,
    flashcards: Flashcard[]
  ): Promise<Buffer> {
    try {
      // Create a JSON object with collection info and flashcards
      const exportData = {
        collection: {
          title: collection.title,
          description: collection.description,
          createdAt: collection.createdAt
        },
        flashcards: flashcards.map(card => ({
          question: card.question,
          answer: card.correctAnswer
        }))
      };
      
      // Convert to JSON string with pretty formatting
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Convert to Buffer
      return Buffer.from(jsonString, 'utf-8');
    } catch (error) {
      console.error('Error exporting collection to JSON format:', error);
      throw new Error(`Failed to export collection to JSON format: ${(error as Error).message}`);
    }
  }
}

// Create a singleton instance
export const exportService = new ExportService();
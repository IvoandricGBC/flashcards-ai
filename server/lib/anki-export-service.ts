import { Flashcard, Collection } from '@shared/schema';

/**
 * Simple service to create Anki-compatible export files
 * This is a simplified version focused on CSV format for Anki import
 */
export class AnkiExportService {
  /**
   * Create a CSV representation of flashcards that can be imported into Anki
   * This is a more reliable alternative to .apkg export
   * 
   * @param flashcards Array of flashcards to export
   * @returns CSV content for Anki import
   */
  public createAnkiImportCSV(flashcards: Flashcard[]): string {
    // Anki CSV format: front,back,tags
    let csvContent = '';
    
    for (const card of flashcards) {
      // Escape double quotes by doubling them
      const question = card.question.replace(/"/g, '""');
      
      // Format the back of the card
      let answer = card.correctAnswer.replace(/"/g, '""');
      
      // If the card has options, add them to the back
      if (card.options && card.options.length > 0) {
        answer += '<br><br><div style="font-size: 0.9em; color: #555;">Options:</div><ul>';
        
        for (const option of card.options) {
          const isCorrect = option === card.correctAnswer;
          if (isCorrect) {
            answer += `<li><strong style="color: #2e7d32;">${option}</strong></li>`;
          } else {
            answer += `<li>${option}</li>`;
          }
        }
        
        answer += '</ul>';
      }
      
      // Add row to CSV - Anki format is front,back,tags
      csvContent += `"${question}","${answer}","flashcards"\n`;
    }
    
    return csvContent;
  }
}

export const ankiExportService = new AnkiExportService();
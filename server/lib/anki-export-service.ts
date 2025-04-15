import { Flashcard, Collection } from '@shared/schema';
// @ts-ignore - Hay problemas de tipado con esta biblioteca
import AnkiExport from 'anki-apkg-export';

/**
 * Service to create Anki-compatible export files
 */
export class AnkiExportService {
  /**
   * Create a CSV representation of flashcards that can be imported into Anki
   * This is a simple but reliable alternative to .apkg export
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

  /**
   * Create an Anki package (.apkg) from a collection of flashcards
   * 
   * @param collection The collection containing the flashcards
   * @param flashcards Array of flashcards to export
   * @returns Buffer containing the .apkg file
   */
  public async createAnkiPackage(
    collection: Collection, 
    flashcards: Flashcard[]
  ): Promise<Buffer> {
    try {
      // Create a new Anki exporter with the collection title as the deck name
      const apkg = new AnkiExport(collection.title, { 
        deckDescription: collection.description || 'Exported from FlashcardAI'
      });
      
      // Add each flashcard to the package
      for (const card of flashcards) {
        // Format the front side (question)
        const front = `<div style="font-size: 1.2em;">${card.question}</div>`;
        
        // Format the back side (answer)
        let back = `<div style="font-size: 1.2em; color: #1976d2; font-weight: bold;">${card.correctAnswer}</div>`;
        
        // If the card has options, add them to the back
        if (card.options && card.options.length > 0) {
          back += '<hr><div style="font-size: 0.9em; color: #555;">Options:</div><ul>';
          
          for (const option of card.options) {
            const isCorrect = option === card.correctAnswer;
            if (isCorrect) {
              back += `<li><strong style="color: #2e7d32;">${option}</strong></li>`;
            } else {
              back += `<li>${option}</li>`;
            }
          }
          
          back += '</ul>';
        }
        
        // Add the card to the package
        apkg.addCard(front, back, { tags: ['flashcards'] });
      }
      
      // Add custom CSS for better styling
      apkg.addCSS(`
        .card {
          font-family: 'Arial', sans-serif;
          font-size: 16px;
          text-align: center;
          color: #333;
          background-color: #f9f9f9;
          padding: 20px;
        }
        ul {
          text-align: left;
          margin-top: 10px;
        }
        li {
          margin-bottom: 5px;
        }
      `);
      
      // Generate the package as a buffer
      const buffer = await apkg.save();
      return buffer;
    } catch (error) {
      console.error('Error creating Anki package:', error);
      throw new Error(`Failed to create Anki package: ${(error as Error).message}`);
    }
  }
}

export const ankiExportService = new AnkiExportService();
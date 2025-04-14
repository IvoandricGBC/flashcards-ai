// Importamos la función de creación de exportador de Anki
import AnkiExport from 'anki-apkg-export';
import { Flashcard, Collection } from '@shared/schema';

interface ExportOptions {
  includeMultipleChoice?: boolean;
}

/**
 * Service to handle exporting flashcards to different formats
 */
export class ExportService {
  /**
   * Export a collection of flashcards to Anki package format (.apkg)
   * 
   * @param collection The collection containing the flashcards
   * @param flashcards Array of flashcards to export
   * @param options Export options
   * @returns Buffer containing the .apkg file
   */
  public async exportToAnki(
    collection: Collection,
    flashcards: Flashcard[],
    options: ExportOptions = {}
  ): Promise<Buffer> {
    try {
      // Create a new Anki package with the collection name as the deck name
      // Llamamos a la función AnkiExport para obtener una instancia del exportador
      const apkg = AnkiExport(collection.title, {
        deckDescription: collection.description || ''
      });
      
      // Los options ya se han pasado al crear el paquete
      // No necesitamos crear nuevamente ankiOptions
      
      // Process each flashcard and add it to the package
      for (const card of flashcards) {
        // For the front of the card (question)
        const front = card.question;
        
        // For the back of the card (answer)
        // If we're including multiple choice, we'll format it differently
        let back: string;
        
        if (options.includeMultipleChoice && card.options && card.options.length > 0) {
          // Format with the correct answer highlighted
          back = `<div class="answer"><strong>Correct Answer:</strong> ${card.correctAnswer}</div>`;
          
          if (card.options.length > 0) {
            back += '<div class="options"><strong>Options:</strong><ul>';
            
            for (const option of card.options) {
              // Highlight the correct answer in the list of options
              const isCorrect = option === card.correctAnswer;
              back += `<li${isCorrect ? ' class="correct"' : ''}>${option}</li>`;
            }
            
            back += '</ul></div>';
          }
        } else {
          // Just use the correct answer
          back = card.correctAnswer;
        }
        
        // Add the card to the package
        apkg.addCard(front, back);
      }
      
      // Add some basic CSS for the cards
      apkg.addCSS(`
        .card {
          font-family: Arial, sans-serif;
          font-size: 16px;
          text-align: center;
          color: black;
          background-color: white;
          padding: 20px;
        }
        
        .answer {
          margin-bottom: 10px;
        }
        
        .options ul {
          list-style-type: none;
          padding: 0;
          text-align: left;
        }
        
        .options li {
          padding: 5px 10px;
          margin: 3px 0;
          border-radius: 3px;
        }
        
        .options li.correct {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          font-weight: bold;
        }
      `);
      
      // Generate the package
      const buffer = await apkg.save();
      return buffer;
    } catch (error) {
      console.error('Error exporting collection to Anki format:', error);
      throw new Error(`Failed to export collection to Anki format: ${(error as Error).message}`);
    }
  }
}

// Create a singleton instance
export const exportService = new ExportService();
import { Flashcard, Collection } from '@shared/schema';
import * as JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';

/**
 * Simple service to create Anki-compatible export files (.apkg)
 * This is a simplified version that creates a basic Anki package
 * without requiring the complex SQL operations of anki-apkg-export
 */
export class AnkiExportService {
  /**
   * Create an Anki package from a collection of flashcards
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
      // Create a new zip file
      const zip = new JSZip();
      
      // Create deck ID - Anki uses milliseconds since epoch for deck IDs
      const deckId = Date.now();
      const modelId = deckId + 1; // Model ID is usually deck ID + 1
      
      // Create a basic collection.anki2 file structure
      // This is a simplified version of the Anki database structure
      const collectionData = this.createCollectionData(collection, deckId, modelId, flashcards);
      zip.file('collection.anki2', collectionData);
      
      // Create a media file
      zip.file('media', '{}');
      
      // Generate the package
      const buffer = await zip.generateAsync({ type: 'nodebuffer' });
      return buffer;
    } catch (error) {
      console.error('Error creating Anki package:', error);
      throw new Error(`Failed to create Anki package: ${(error as Error).message}`);
    }
  }
  
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
      
      // Add row to CSV
      csvContent += `"${question}","${answer}","flashcards"\n`;
    }
    
    return csvContent;
  }
  
  /**
   * Create a simplified Anki collection file
   * This creates a text file that mimics the structure of an Anki collection
   * but doesn't require SQL operations
   */
  private createCollectionData(
    collection: Collection,
    deckId: number,
    modelId: number,
    flashcards: Flashcard[]
  ): string {
    const deckName = collection.title;
    const cardsData = flashcards.map(card => {
      return `Question: ${card.question}\nAnswer: ${card.correctAnswer}\n`;
    }).join('\n');
    
    // This is a simplified representation of an Anki collection
    // Real Anki files require SQLite operations, but this format
    // will work for basic Genki Deck viewing
    const collectionContent = `
DECK: ${deckName}
DECK_ID: ${deckId}
MODEL_ID: ${modelId}
DESCRIPTION: ${collection.description || ''}
CARDS:
${cardsData}
`;
    
    return collectionContent;
  }
}

export const ankiExportService = new AnkiExportService();
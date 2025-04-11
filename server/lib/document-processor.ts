import { PDFExtract } from 'pdf.js-extract';
import * as mammoth from 'mammoth';
import { generateFlashcardsFromText } from './openai';
import { InsertFlashcard } from '@shared/schema';

interface ProcessOptions {
  generateDefinitions?: boolean;
  generateConcepts?: boolean;
  includeMultipleChoice?: boolean;
}

/**
 * Extract text from a PDF file
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfExtract = new PDFExtract();
    const data = await pdfExtract.extractBuffer(buffer);
    
    // Combine all page content
    let text = '';
    for (const page of data.pages) {
      // Join all content items text
      for (const item of page.content) {
        text += item.str + ' ';
      }
      text += '\n\n'; // Add double line break between pages
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF document');
  }
}

/**
 * Extract text from a Word document
 */
export async function extractWordText(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting Word document text:', error);
    throw new Error('Failed to extract text from Word document');
  }
}

/**
 * Process a document buffer based on its type
 */
export async function processDocumentBuffer(
  buffer: Buffer, 
  fileType: string
): Promise<string> {
  switch (fileType.toLowerCase()) {
    case 'application/pdf':
    case 'pdf':
      return extractPdfText(buffer);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
    case 'docx':
    case 'doc':
      return extractWordText(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Process a document and generate flashcards
 */
export async function processDocumentAndGenerateFlashcards(
  buffer: Buffer,
  fileType: string,
  collectionId: number,
  options: ProcessOptions = {
    generateDefinitions: true,
    generateConcepts: true,
    includeMultipleChoice: true
  }
): Promise<InsertFlashcard[]> {
  try {
    // Extract text from document
    const text = await processDocumentBuffer(buffer, fileType);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the document');
    }
    
    // Generate flashcards using OpenAI
    const flashcards = await generateFlashcardsFromText(text, options);
    
    // Add collection ID to each flashcard
    return flashcards.map(flashcard => ({
      ...flashcard,
      collectionId
    }));
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

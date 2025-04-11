import OpenAI from "openai";
import { InsertFlashcard } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface GenerateOptions {
  generateDefinitions?: boolean;
  generateConcepts?: boolean;
  includeMultipleChoice?: boolean;
}

interface GeneratedFlashcard {
  question: string;
  correctAnswer: string;
  options: string[];
}

interface GenerationResponse {
  flashcards: GeneratedFlashcard[];
}

/**
 * Generates flashcards from document text using OpenAI
 */
export async function generateFlashcardsFromText(
  text: string,
  options: GenerateOptions = {}
): Promise<InsertFlashcard[]> {
  try {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    // Prepare the content for the prompt
    const contentChunks = chunkText(text, 4000);
    const allFlashcards: InsertFlashcard[] = [];

    // Process each chunk of text to stay within token limits
    for (const chunk of contentChunks) {
      const systemPrompt = buildSystemPrompt(options);
      
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: `Here is the document text to generate flashcards from:\n\n${chunk}`
            }
          ],
          response_format: { type: "json_object" }
        });

        if (!response.choices[0]?.message.content) {
          throw new Error("No response from OpenAI API");
        }

        const content = response.choices[0].message.content;
        const parsedResponse = JSON.parse(content) as GenerationResponse;
        
        if (!parsedResponse.flashcards || !Array.isArray(parsedResponse.flashcards)) {
          throw new Error("Invalid response format from OpenAI API");
        }

        // Convert the response to our schema format
        const chunkFlashcards: InsertFlashcard[] = parsedResponse.flashcards.map(card => ({
          question: card.question,
          correctAnswer: card.correctAnswer,
          options: card.options,
          collectionId: 0 // This will be set by the caller
        }));

        allFlashcards.push(...chunkFlashcards);
      } catch (error) {
        // Handle API-specific errors
        if (error instanceof Error) {
          const errorMessage = error.message;
          if (errorMessage.includes("exceeded your current quota") || 
              errorMessage.includes("insufficient_quota")) {
            throw new Error("OpenAI API quota exceeded. Please update your API key.");
          }
        }
        // Re-throw the error to be caught by the outer try-catch
        throw error;
      }
    }

    return allFlashcards;
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw new Error("Failed to generate flashcards: " + (error as Error).message);
  }
}

/**
 * Builds the system prompt based on generation options
 */
function buildSystemPrompt(options: GenerateOptions): string {
  const {
    generateDefinitions = true,
    generateConcepts = true,
    includeMultipleChoice = true
  } = options;

  let prompt = `You are an expert in creating educational flashcards based on academic texts. 
Your task is to analyze the following text and generate trivia-style questions with their answers.

FORMAT REQUIREMENTS:
- Generate clear and concise questions
- Questions should test important knowledge from the text
- All questions must have exactly 4 answer options
- One of the options must be the correct answer
- The 3 incorrect options should be plausible but incorrect
- Respond with a JSON object containing an array of flashcards with the following structure:
{
  "flashcards": [
    {
      "question": "The complete question",
      "correctAnswer": "The correct answer",
      "options": ["Option 1 (correct)", "Option 2", "Option 3", "Option 4"]
    }
  ]
}

IMPORTANT: Make sure the correct answer appears both in the "correctAnswer" field and in the "options" array.`;

  if (generateDefinitions) {
    prompt += `\n\nInclude questions about important definitions and key terms that appear in the text.`;
  }

  if (generateConcepts) {
    prompt += `\n\nInclude questions about fundamental concepts explained in the text.`;
  }

  if (!includeMultipleChoice) {
    prompt += `\n\nAlthough I need to generate multiple options to maintain the format, these flashcards will be used for direct answer questions.`;
  }

  return prompt;
}

/**
 * Divides text into smaller chunks to avoid token limits
 */
function chunkText(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  
  // If text is small enough, return it as a single chunk
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  // Find paragraph breaks to make sensible chunks
  let startIndex = 0;
  while (startIndex < text.length) {
    let endIndex = startIndex + maxChunkSize;
    
    if (endIndex >= text.length) {
      chunks.push(text.slice(startIndex));
      break;
    }
    
    // Try to find a paragraph break
    let breakPoint = text.lastIndexOf('\n\n', endIndex);
    if (breakPoint <= startIndex) {
      // If no paragraph break, try to find a sentence end
      breakPoint = text.lastIndexOf('. ', endIndex);
      if (breakPoint <= startIndex) {
        // If no sentence end, just break at the max size
        breakPoint = endIndex;
      } else {
        breakPoint += 2; // Include the period and space
      }
    } else {
      breakPoint += 2; // Include the double newline
    }
    
    chunks.push(text.slice(startIndex, breakPoint));
    startIndex = breakPoint;
  }
  
  return chunks;
}

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
    // Prepare the content for the prompt
    const contentChunks = chunkText(text, 4000);
    const allFlashcards: InsertFlashcard[] = [];

    // Process each chunk of text to stay within token limits
    for (const chunk of contentChunks) {
      const systemPrompt = buildSystemPrompt(options);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Aquí está el texto del documento para generar flashcards:\n\n${chunk}`
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

  let prompt = `Eres un experto en crear flashcards educativas basadas en textos académicos. 
Tu tarea es analizar el siguiente texto y generar preguntas tipo trivia con sus respuestas.

REQUISITOS DE FORMATO:
- Genera preguntas claras y concisas
- Las preguntas deben probar conocimientos importantes del texto
- Todas las preguntas deben tener exactamente 4 opciones de respuesta
- Una de las opciones debe ser la respuesta correcta
- Las 3 opciones incorrectas deben ser plausibles pero incorrectas
- Responde con un objeto JSON que contiene un array de flashcards con la siguiente estructura:
{
  "flashcards": [
    {
      "question": "La pregunta completa",
      "correctAnswer": "La respuesta correcta",
      "options": ["Opción 1 (correcta)", "Opción 2", "Opción 3", "Opción 4"]
    }
  ]
}

IMPORTANTE: Asegúrate de que la respuesta correcta aparezca tanto en el campo "correctAnswer" como en el array "options".`;

  if (generateDefinitions) {
    prompt += `\n\nIncluye preguntas sobre definiciones importantes y términos clave que aparecen en el texto.`;
  }

  if (generateConcepts) {
    prompt += `\n\nIncluye preguntas sobre conceptos fundamentales explicados en el texto.`;
  }

  if (!includeMultipleChoice) {
    prompt += `\n\nAunque necesito generar opciones múltiples para mantener el formato, estas flashcards se usarán para preguntas de respuesta directa.`;
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

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import OpenAI from "openai";
import { 
  insertCollectionSchema, 
  insertFlashcardSchema, 
  insertDocumentSchema,
  insertQuizSessionSchema,
  insertActivitySchema 
} from "@shared/schema";
import { processDocumentAndGenerateFlashcards, processDocumentBuffer, extractPdfText, extractWordText } from "./lib/document-processor";
import { generateSummaryFromText } from "./lib/openai";
import { z } from "zod";

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF and Word documents
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Only PDF and Word documents are allowed."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Collections API
  app.get("/api/collections", async (req: Request, res: Response) => {
    try {
      const collections = await storage.getCollections();
      res.json(collections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid collection ID" });
      }

      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      res.json(collection);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  app.post("/api/collections", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCollectionSchema.parse(req.body);
      const collection = await storage.createCollection(validatedData);
      
      // Create activity for new collection
      await storage.createActivity({
        type: "create",
        description: `Creaste una nueva colección: "${collection.title}"`,
        entityId: collection.id,
        entityType: "collection",
        userId: null
      });
      
      res.status(201).json(collection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  app.patch("/api/collections/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid collection ID" });
      }

      const collection = await storage.getCollection(id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }

      const updatedCollection = await storage.updateCollection(id, req.body);
      res.json(updatedCollection);
    } catch (error) {
      res.status(500).json({ message: "Failed to update collection" });
    }
  });

  app.delete("/api/collections/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid collection ID" });
      }

      const result = await storage.deleteCollection(id);
      if (!result) {
        return res.status(404).json({ message: "Collection not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  // Flashcards API
  app.get("/api/collections/:id/flashcards", async (req: Request, res: Response) => {
    try {
      const collectionId = parseInt(req.params.id);
      if (isNaN(collectionId)) {
        return res.status(400).json({ message: "Invalid collection ID" });
      }
      
      const collection = await storage.getCollection(collectionId);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }

      const flashcards = await storage.getFlashcards(collectionId);
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch flashcards" });
    }
  });

  app.post("/api/flashcards", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFlashcardSchema.parse(req.body);
      const flashcard = await storage.createFlashcard(validatedData);
      res.status(201).json(flashcard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create flashcard" });
    }
  });

  // Document upload and processing
  app.post(
    "/api/documents/upload",
    upload.single("document"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        // Get collection information
        const collectionData = req.body;
        
        if (!collectionData.title) {
          return res.status(400).json({ message: "Collection title is required" });
        }

        // Create a new collection
        const collection = await storage.createCollection({
          title: collectionData.title,
          description: collectionData.description || "",
          favorite: false,
          userId: null
        });

        // Process options
        const options = {
          generateDefinitions: req.body.generateDefinitions === "true",
          generateConcepts: req.body.generateConcepts === "true",
          includeMultipleChoice: req.body.includeMultipleChoice === "true"
        };

        // Save document information
        const document = await storage.createDocument({
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          collectionId: collection.id,
          content: null // We don't store the full content in this implementation
        });

        // Create upload activity
        await storage.createActivity({
          type: "upload",
          description: `Uploaded "${req.file.originalname}"`,
          entityId: document.id,
          entityType: "document",
          userId: null
        });

        // Process document and generate flashcards
        const flashcards = await processDocumentAndGenerateFlashcards(
          req.file.buffer,
          req.file.mimetype,
          collection.id,
          options
        );

        // Save generated flashcards
        const savedFlashcards = await storage.createFlashcards(flashcards);

        // Create flashcard generation activity
        await storage.createActivity({
          type: "generation",
          description: `Generated ${savedFlashcards.length} flashcards for "${collection.title}"`,
          entityId: collection.id,
          entityType: "collection",
          userId: null
        });

        res.status(201).json({
          collection,
          document,
          flashcardsCount: savedFlashcards.length
        });
      } catch (error) {
        console.error("Error in document upload:", error);
        res.status(500).json({
          message: "Failed to process document",
          error: (error as Error).message
        });
      }
    }
  );

  // Quiz sessions
  app.post("/api/quiz-sessions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertQuizSessionSchema.parse(req.body);
      const quizSession = await storage.createQuizSession(validatedData);
      
      // Get collection info for the activity
      const collection = await storage.getCollection(validatedData.collectionId);
      
      // Create quiz completion activity
      await storage.createActivity({
        type: "quiz",
        description: `Scored ${validatedData.score}/${validatedData.totalQuestions} in "${collection?.title || 'Collection'}" quiz`,
        entityId: quizSession.id,
        entityType: "quiz",
        userId: null
      });
      
      res.status(201).json(quizSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create quiz session" });
    }
  });

  // Recent activities
  app.get("/api/activities/recent", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Generate summary from document
  app.post("/api/documents/:id/summarize", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      // Get document
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Get collection to add the document summary
      const collection = await storage.getCollection(document.collectionId);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      // Get uploaded file content
      if (!req.file) {
        return res.status(400).json({ message: "Please reupload the document file" });
      }
      
      // Process document to extract text
      const text = await processDocumentBuffer(req.file.buffer, req.file.mimetype);
      
      // Generate summary
      const summary = await generateSummaryFromText(text);
      
      // Create activity for summary generation
      await storage.createActivity({
        type: "summarize",
        description: `Generated summary for "${document.fileName}"`,
        entityId: document.id,
        entityType: "document",
        userId: null
      });
      
      res.json({ summary });
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({ 
        message: "Failed to generate summary", 
        error: (error as Error).message 
      });
    }
  });
  
  // Document summarization direct route (without saving document)
  app.post("/api/summarize", upload.single("document"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Extract text from document
      let documentText: string;
      if (req.file.mimetype === "application/pdf") {
        documentText = await extractPdfText(req.file.buffer);
      } else {
        documentText = await extractWordText(req.file.buffer);
      }
      
      // Generate summary
      const summary = await generateSummaryFromText(documentText);
      
      // Return the summary
      res.json({ 
        summary,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        wordCount: documentText.split(/\s+/).length,
        summaryWordCount: summary.split(/\s+/).length
      });
    } catch (error) {
      console.error("Error in direct summarization:", error);
      res.status(500).json({ 
        message: "Failed to generate summary", 
        error: (error as Error).message 
      });
    }
  });

  // OpenAI API status check endpoint
  app.get("/api/status/openai", async (_req: Request, res: Response) => {
    try {
      // Check if API key exists
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          status: "error", 
          message: "OpenAI API key is not configured"
        });
      }

      // Validate API key format
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
        return res.status(400).json({ 
          status: "error", 
          message: "Invalid API key format. OpenAI API keys should start with 'sk-'"
        });
      }

      // Make a lightweight API call to check if the key works
      const openai = new OpenAI({ apiKey });
      const response = await openai.models.list();
      
      // If we get here, the API call succeeded
      return res.status(200).json({ 
        status: "ok", 
        message: "OpenAI API key is valid"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const status = errorMessage.includes("401") ? 401 : 500;

      return res.status(status).json({ 
        status: "error", 
        message: `OpenAI API error: ${errorMessage}`
      });
    }
  });
  
  // Utility endpoint to clean duplicated Philosophy collections
  app.post("/api/admin/clean-database", async (_req: Request, res: Response) => {
    try {
      // 1. Delete duplicate Philosophy collections (keep only one)
      const philosophyCollections = await storage.getCollections();
      const duplicateCollections = philosophyCollections.filter(c => c.title === "Philosophy");
      
      // Keep only the first Philosophy collection if multiple exist
      if (duplicateCollections.length > 1) {
        const collectionsToDelete = duplicateCollections.slice(1).map(c => c.id);
        
        // Delete each duplicate collection
        for (const id of collectionsToDelete) {
          await storage.deleteCollection(id);
        }
        
        return res.json({ 
          success: true, 
          message: `Cleaned ${collectionsToDelete.length} duplicate Philosophy collections`,
          deletedIds: collectionsToDelete 
        });
      }
      
      // No duplicates found
      return res.json({ 
        success: true, 
        message: "No duplicate collections found to clean" 
      });
    } catch (error) {
      console.error("Error cleaning database:", error);
      return res.status(500).json({ 
        success: false, 
        message: `Error cleaning database: ${error instanceof Error ? error.message : "Unknown error"}` 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

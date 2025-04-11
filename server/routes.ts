import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { 
  insertCollectionSchema, 
  insertFlashcardSchema, 
  insertDocumentSchema,
  insertQuizSessionSchema,
  insertActivitySchema 
} from "@shared/schema";
import { processDocumentAndGenerateFlashcards } from "./lib/document-processor";
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
          description: `Has subido "${req.file.originalname}"`,
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
          description: `Se han generado ${savedFlashcards.length} tarjetas para "${collection.title}"`,
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
        description: `Has obtenido ${validatedData.score}/${validatedData.totalQuestions} en el quiz de "${collection?.title || 'Colección'}"`,
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

  const httpServer = createServer(app);
  return httpServer;
}

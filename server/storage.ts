import {
  users, collections, flashcards, documents, quizSessions, activities,
  type User, type InsertUser,
  type Collection, type InsertCollection,
  type Flashcard, type InsertFlashcard,
  type Document, type InsertDocument,
  type QuizSession, type InsertQuizSession,
  type Activity, type InsertActivity
} from "@shared/schema";
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Collection methods
  getCollections(): Promise<Collection[]>;
  getCollection(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, collection: Partial<Collection>): Promise<Collection | undefined>;
  deleteCollection(id: number): Promise<boolean>;

  // Flashcard methods
  getFlashcards(collectionId: number): Promise<Flashcard[]>;
  getFlashcard(id: number): Promise<Flashcard | undefined>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  createFlashcards(flashcards: InsertFlashcard[]): Promise<Flashcard[]>;
  deleteFlashcard(id: number): Promise<boolean>;

  // Document methods
  getDocuments(collectionId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;

  // Quiz methods
  createQuizSession(session: InsertQuizSession): Promise<QuizSession>;
  getQuizSessionsByCollection(collectionId: number): Promise<QuizSession[]>;

  // Activity methods
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

import { db } from './db';
import { eq, desc, and } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  constructor() {
    // Seed the database with sample data if needed
    this.seedSampleData().catch(error => {
      console.error("Error seeding database:", error);
    });
  }

  private async seedSampleData() {
    // Check if we already have collections in the database
    const existingCollections = await db.select().from(collections);
    if (existingCollections.length > 0) {
      console.log("Database already has data, skipping seed");
      return;
    }
    
    console.log("Seeding database with sample data...");
    
    // Sample collections
    const collection1 = await this.createCollection({
      title: "Cell Biology",
      description: "Fundamental concepts about cells and their components",
      favorite: true,
      userId: null
    });
    
    const collection2 = await this.createCollection({
      title: "Contemporary History",
      description: "Major events of the 20th and 21st centuries",
      favorite: false,
      userId: null
    });
    
    const collection3 = await this.createCollection({
      title: "Applied Statistics",
      description: "Statistical methods and data analysis",
      favorite: false,
      userId: null
    });
    
    // Sample flashcards for Cell Biology
    await this.createFlashcard({
      question: "What is the main function of mitochondria in the cell?",
      correctAnswer: "Produce energy in the form of ATP through cellular respiration",
      options: [
        "Produce energy in the form of ATP through cellular respiration",
        "Synthesize proteins for the cell",
        "Store genetic information",
        "Digest foreign materials and cellular waste"
      ],
      collectionId: collection1.id
    });
    
    await this.createFlashcard({
      question: "Which organelle is responsible for protein synthesis in the cell?",
      correctAnswer: "Ribosome",
      options: [
        "Ribosome",
        "Golgi apparatus",
        "Lysosome",
        "Vacuole"
      ],
      collectionId: collection1.id
    });
    
    // Sample activities
    await this.createActivity({
      type: "upload",
      description: "You uploaded \"Introduction to Cell Biology.pdf\"",
      userId: null,
      entityId: 1,
      entityType: "document"
    });
    
    await this.createActivity({
      type: "generation",
      description: "Generated 24 cards for \"Cell Biology\"",
      userId: null,
      entityId: collection1.id,
      entityType: "collection"
    });
    
    await this.createActivity({
      type: "quiz",
      description: "You scored 18/20 in the \"Contemporary History\" quiz",
      userId: null,
      entityId: collection2.id,
      entityType: "quiz"
    });
    
    console.log("Database seeded successfully");
  }
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Collection methods
  async getCollections(): Promise<Collection[]> {
    return await db.select().from(collections);
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    const [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, id));
    return collection || undefined;
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const [collection] = await db
      .insert(collections)
      .values(insertCollection)
      .returning();
    return collection;
  }

  async updateCollection(id: number, updates: Partial<Collection>): Promise<Collection | undefined> {
    const [updated] = await db
      .update(collections)
      .set(updates)
      .where(eq(collections.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCollection(id: number): Promise<boolean> {
    try {
      // First delete all related flashcards
      await db
        .delete(flashcards)
        .where(eq(flashcards.collectionId, id));
      
      // Delete all related documents
      await db
        .delete(documents)
        .where(eq(documents.collectionId, id));
      
      // Delete all related quiz sessions
      await db
        .delete(quizSessions)
        .where(eq(quizSessions.collectionId, id));
      
      // Delete related activities
      await db
        .delete(activities)
        .where(and(
          eq(activities.entityType, "collection"),
          eq(activities.entityId, id)
        ));
      
      // Finally delete the collection
      const deleted = await db
        .delete(collections)
        .where(eq(collections.id, id))
        .returning({ id: collections.id });
        
      return deleted.length > 0;
    } catch (error) {
      console.error("Error deleting collection:", error);
      throw error;
    }
  }

  // Flashcard methods
  async getFlashcards(collectionId: number): Promise<Flashcard[]> {
    return await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.collectionId, collectionId));
  }

  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    const [flashcard] = await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.id, id));
    return flashcard || undefined;
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const [flashcard] = await db
      .insert(flashcards)
      .values(insertFlashcard)
      .returning();
    return flashcard;
  }

  async createFlashcards(insertFlashcards: InsertFlashcard[]): Promise<Flashcard[]> {
    if (insertFlashcards.length === 0) return [];
    
    return await db
      .insert(flashcards)
      .values(insertFlashcards)
      .returning();
  }

  async deleteFlashcard(id: number): Promise<boolean> {
    const deleted = await db
      .delete(flashcards)
      .where(eq(flashcards.id, id))
      .returning({ id: flashcards.id });
    return deleted.length > 0;
  }

  // Document methods
  async getDocuments(collectionId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.collectionId, collectionId));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const deleted = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning({ id: documents.id });
    return deleted.length > 0;
  }

  // Quiz methods
  async createQuizSession(insertSession: InsertQuizSession): Promise<QuizSession> {
    const [session] = await db
      .insert(quizSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getQuizSessionsByCollection(collectionId: number): Promise<QuizSession[]> {
    return await db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.collectionId, collectionId));
  }

  // Activity methods
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }
}

export const storage = new DatabaseStorage();

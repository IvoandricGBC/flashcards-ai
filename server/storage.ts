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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private collections: Map<number, Collection>;
  private flashcards: Map<number, Flashcard>;
  private documents: Map<number, Document>;
  private quizSessions: Map<number, QuizSession>;
  private activities: Map<number, Activity>;

  private userIdCounter: number;
  private collectionIdCounter: number;
  private flashcardIdCounter: number;
  private documentIdCounter: number;
  private quizSessionIdCounter: number;
  private activityIdCounter: number;

  constructor() {
    this.users = new Map();
    this.collections = new Map();
    this.flashcards = new Map();
    this.documents = new Map();
    this.quizSessions = new Map();
    this.activities = new Map();

    this.userIdCounter = 1;
    this.collectionIdCounter = 1;
    this.flashcardIdCounter = 1;
    this.documentIdCounter = 1;
    this.quizSessionIdCounter = 1;
    this.activityIdCounter = 1;

    // Initialize with sample data
    this.seedSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Collection methods
  async getCollections(): Promise<Collection[]> {
    return Array.from(this.collections.values());
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const id = this.collectionIdCounter++;
    const now = new Date();
    const collection: Collection = { 
      ...insertCollection, 
      id, 
      createdAt: now
    };
    this.collections.set(id, collection);
    return collection;
  }

  async updateCollection(id: number, updates: Partial<Collection>): Promise<Collection | undefined> {
    const collection = this.collections.get(id);
    if (!collection) return undefined;

    const updatedCollection = { ...collection, ...updates };
    this.collections.set(id, updatedCollection);
    return updatedCollection;
  }

  async deleteCollection(id: number): Promise<boolean> {
    return this.collections.delete(id);
  }

  // Flashcard methods
  async getFlashcards(collectionId: number): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(
      (flashcard) => flashcard.collectionId === collectionId
    );
  }

  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    return this.flashcards.get(id);
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const id = this.flashcardIdCounter++;
    const now = new Date();
    const flashcard: Flashcard = { 
      ...insertFlashcard, 
      id, 
      createdAt: now 
    };
    this.flashcards.set(id, flashcard);
    return flashcard;
  }

  async createFlashcards(insertFlashcards: InsertFlashcard[]): Promise<Flashcard[]> {
    const createdFlashcards: Flashcard[] = [];
    
    for (const insertFlashcard of insertFlashcards) {
      const flashcard = await this.createFlashcard(insertFlashcard);
      createdFlashcards.push(flashcard);
    }
    
    return createdFlashcards;
  }

  async deleteFlashcard(id: number): Promise<boolean> {
    return this.flashcards.delete(id);
  }

  // Document methods
  async getDocuments(collectionId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (document) => document.collectionId === collectionId
    );
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const now = new Date();
    const document: Document = { 
      ...insertDocument, 
      id, 
      createdAt: now 
    };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Quiz methods
  async createQuizSession(insertSession: InsertQuizSession): Promise<QuizSession> {
    const id = this.quizSessionIdCounter++;
    const now = new Date();
    const session: QuizSession = { 
      ...insertSession, 
      id, 
      completedAt: now 
    };
    this.quizSessions.set(id, session);
    return session;
  }

  async getQuizSessionsByCollection(collectionId: number): Promise<QuizSession[]> {
    return Array.from(this.quizSessions.values()).filter(
      (session) => session.collectionId === collectionId
    );
  }

  // Activity methods
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      createdAt: now 
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Sample data for initial state
  private seedSampleData() {
    // Sample collections
    const collection1: Collection = {
      id: this.collectionIdCounter++,
      title: "Biología Celular",
      description: "Conceptos fundamentales sobre la célula y sus componentes",
      createdAt: new Date(),
      favorite: true,
      userId: null
    };
    
    const collection2: Collection = {
      id: this.collectionIdCounter++,
      title: "Historia Contemporánea",
      description: "Eventos principales del siglo XX y XXI",
      createdAt: new Date(),
      favorite: false,
      userId: null
    };
    
    const collection3: Collection = {
      id: this.collectionIdCounter++,
      title: "Estadística Aplicada",
      description: "Métodos estadísticos y análisis de datos",
      createdAt: new Date(),
      favorite: false,
      userId: null
    };
    
    this.collections.set(collection1.id, collection1);
    this.collections.set(collection2.id, collection2);
    this.collections.set(collection3.id, collection3);
    
    // Sample flashcards for Biología Celular
    const flashcard1: Flashcard = {
      id: this.flashcardIdCounter++,
      question: "¿Cuál es la función principal de la mitocondria en la célula?",
      correctAnswer: "Producir energía en forma de ATP a través de la respiración celular",
      options: [
        "Producir energía en forma de ATP a través de la respiración celular",
        "Sintetizar proteínas para la célula",
        "Almacenar información genética",
        "Digerir materiales extraños y desechos celulares"
      ],
      collectionId: collection1.id,
      createdAt: new Date()
    };
    
    const flashcard2: Flashcard = {
      id: this.flashcardIdCounter++,
      question: "¿Qué organelo es responsable de la síntesis de proteínas en la célula?",
      correctAnswer: "Ribosoma",
      options: [
        "Ribosoma",
        "Aparato de Golgi",
        "Lisosoma",
        "Vacuola"
      ],
      collectionId: collection1.id,
      createdAt: new Date()
    };
    
    this.flashcards.set(flashcard1.id, flashcard1);
    this.flashcards.set(flashcard2.id, flashcard2);
    
    // Sample activities
    const activity1: Activity = {
      id: this.activityIdCounter++,
      type: "upload",
      description: "Has subido \"Introducción a la Biología Celular.pdf\"",
      userId: null,
      entityId: 1,
      entityType: "document",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    };
    
    const activity2: Activity = {
      id: this.activityIdCounter++,
      type: "generation",
      description: "Se han generado 24 tarjetas para \"Biología Celular\"",
      userId: null,
      entityId: collection1.id,
      entityType: "collection",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
    };
    
    const activity3: Activity = {
      id: this.activityIdCounter++,
      type: "quiz",
      description: "Has obtenido 18/20 en el quiz de \"Historia Contemporánea\"",
      userId: null,
      entityId: collection2.id,
      entityType: "quiz",
      createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    };
    
    this.activities.set(activity1.id, activity1);
    this.activities.set(activity2.id, activity2);
    this.activities.set(activity3.id, activity3);
  }
}

export const storage = new MemStorage();

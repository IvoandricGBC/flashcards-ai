# FlashcardAI
An intelligent application that transforms documents into interactive flashcards using AI.
## Description
FlashcardAI allows users to upload PDF or Word documents, or enter text directly, and automatically generate flashcards and summaries using artificial intelligence. It's the perfect tool for students and professionals looking to optimize their learning process.
## Features
- Generate flashcards from PDF/Word documents or text input
- Create document summaries
- View flashcards in study mode (Genki Deck)
- Export flashcards to CSV format
- Intuitive and responsive user interface
## Technologies
- Frontend: React, TypeScript, TanStack Query, Shadcn/UI
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Drizzle ORM
- AI: OpenAI API (gpt-4o model)
## Installation
1. Clone this repository
2. Install dependencies with `npm install`
3. Configure environment variables in a `.env` file
4. Run `npm run dev` to start the development server
## Configuration
Create a `.env` file in the project root with the following variables:
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...

## Project Structure
/
├── client/ # Frontend React
│ └── src/
│ ├── components/ # Reusable components
│ ├── pages/ # Main pages
│ ├── hooks/ # Custom hooks
│ └── lib/ # Utilities and configuration
├── server/ # Express backend
│ ├── lib/ # Server services and utilities
│ ├── routes.ts # API route definitions
│ └── storage.ts # Data access layer
└── shared/ # Shared code
└── schema.ts # Schema definitions with Drizzle

## Main Workflows
### Document Processing and Flashcard Generation
1. Upload a document or enter text directly
2. AI processes the content to extract key information
3. Flashcards are generated with questions and answers
4. Collection is created and saved to the database
### Study Mode
1. Access a collection of flashcards
2. View cards in a 3D interactive format
3. Flip cards to reveal answers
4. Mark cards as known or unknown for learning progress
## API Configuration
The application requires a valid OpenAI API key with sufficient credits for flashcard generation and document summarization. Set this in the `.env` file as shown above.

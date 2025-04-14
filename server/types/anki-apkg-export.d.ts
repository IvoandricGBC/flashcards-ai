declare module 'anki-apkg-export' {
  export default class AnkiExport {
    constructor(deckName: string, options?: { 
      deckDescription?: string,
      [key: string]: any 
    });
    
    addCard(front: string, back: string, options?: any): void;
    addCSS(css: string): void;
    save(): Promise<Buffer>;
  }
}
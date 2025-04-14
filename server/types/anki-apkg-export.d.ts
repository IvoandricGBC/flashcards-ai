declare module 'anki-apkg-export' {
  interface AnkiExportOptions {
    deckDescription?: string;
    [key: string]: any;
  }

  class AnkiExporter {
    constructor(deckName: string, options?: AnkiExportOptions);
    addCard(front: string, back: string, options?: any): void;
    addMedia(filename: string, data: Buffer): void;
    addCSS(css: string): void;
    save(): Promise<Buffer>;
  }

  export default AnkiExporter;
}
declare module 'anki-apkg-export' {
  interface AnkiExporter {
    addCard(front: string, back: string, options?: any): void;
    addCSS(css: string): void;
    save(): Promise<Buffer>;
  }

  interface AnkiExportOptions {
    deckDescription?: string;
    [key: string]: any;
  }

  // La función por defecto que crea un exportador
  export default function(deckName: string, options?: AnkiExportOptions): AnkiExporter;
}
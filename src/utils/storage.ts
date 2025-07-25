import { Note } from '../types';

class StorageManager {
  private dbName = 'kairo-notes';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create notes store
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('created_at', 'created_at', { unique: false });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Notes operations
  async saveNote(note: Note): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('notes', 'readwrite');
      const request = store.put(note);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getNote(id: string): Promise<Note | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('notes');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllNotes(): Promise<Note[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('notes');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteNote(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('notes', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Search operations
  async searchNotes(query: string): Promise<Note[]> {
    const notes = await this.getAllNotes();
    const normalizedQuery = query.toLowerCase();
    
    return notes.filter(note => {
      const searchText = [
        note.title,
        note.abstractive_summary,
        note.extractive_summary,
        ...note.entities.map(e => e.text)
      ].join(' ').toLowerCase();
      
      return searchText.includes(normalizedQuery);
    });
  }
}

export const storage = new StorageManager();
import { StoredDocument } from '../types';

// Uploaded course files live in IndexedDB: localStorage is only ~5 MB,
// which a couple of PDFs would fill.

const DB_NAME = 'gostudy-files';
const STORE = 'documents';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest | void): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request ? (request.result as T) : (undefined as T));
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export function saveDocument(doc: StoredDocument): Promise<void> {
  return run('readwrite', store => store.put(doc));
}

export function getDocument(id: string): Promise<StoredDocument | undefined> {
  return run('readonly', store => store.get(id));
}

export async function deleteDocuments(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await run('readwrite', store => {
    ids.forEach(id => store.delete(id));
  });
}

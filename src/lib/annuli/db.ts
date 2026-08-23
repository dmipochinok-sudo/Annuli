// Слой доступа к IndexedDB. Имена базы и хранилищ совпадают с legacy-версией,
// поэтому уже существующие данные пользователя открываются как есть.
import { normalizePerson, type Person } from "./types";

const DBN = "genealogy_db";
const DBV = 2;
const DST = "persons";
const IST = "images";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB недоступна"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DBN, DBV);
      req.onupgradeneeded = (ev) => {
        const d = (ev.target as IDBOpenDBRequest).result;
        if (!d.objectStoreNames.contains(DST)) d.createObjectStore(DST, { keyPath: "id" });
        if (!d.objectStoreNames.contains(IST)) d.createObjectStore(IST, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbAllPersons(): Promise<Person[]> {
  const db = await openDB();
  const rows = await wrap<Partial<Person>[]>(
    db.transaction(DST, "readonly").objectStore(DST).getAll(),
  );
  return rows.map(normalizePerson);
}

export async function dbPutPerson(p: Person): Promise<void> {
  const db = await openDB();
  await wrap(db.transaction(DST, "readwrite").objectStore(DST).put(p));
}

export async function dbDelPerson(id: string): Promise<void> {
  const db = await openDB();
  await wrap(db.transaction(DST, "readwrite").objectStore(DST).delete(id));
}

export async function imgPut(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  await wrap(db.transaction(IST, "readwrite").objectStore(IST).put({ id, blob }));
}

export async function imgGet(id: string): Promise<Blob | null> {
  const db = await openDB();
  const rec = await wrap<{ id: string; blob: Blob } | undefined>(
    db.transaction(IST, "readonly").objectStore(IST).get(id),
  );
  return rec?.blob ?? null;
}

export async function imgDel(id: string): Promise<void> {
  if (!id) return;
  const db = await openDB();
  await wrap(db.transaction(IST, "readwrite").objectStore(IST).delete(id));
}

const DB_NAME = 'focus-forest-music';
const STORE = 'files';

export const MAX_CUSTOM_TRACKS = 20;
export const MAX_TRACK_BYTES = 20 * 1024 * 1024;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('음악 저장소를 열지 못했어요.'));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('음악 파일을 다루지 못했어요.'));
  });
}

export function isMp3File(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.mp3') || file.type === 'audio/mpeg' || file.type === 'audio/mp3';
}

export function titleFromFile(name: string): string {
  const base = name.replace(/\.mp3$/i, '').trim().replace(/\s+/g, ' ');
  return (base || '내 음악').slice(0, 40);
}

export async function saveTrackBlob(id: string, file: Blob): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(file, id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('음악 파일을 저장하지 못했어요.'));
      tx.onabort = () => reject(tx.error ?? new Error('음악 파일 저장이 취소됐어요.'));
    });
  } finally {
    db.close();
  }
}

export async function loadTrackBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readonly');
    const result = await requestToPromise(tx.objectStore(STORE).get(id));
    return result instanceof Blob ? result : null;
  } finally {
    db.close();
  }
}

export async function deleteTrackBlob(id: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('음악 파일을 지우지 못했어요.'));
    });
  } finally {
    db.close();
  }
}

export async function clearTrackBlobs(): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('음악 파일을 비우지 못했어요.'));
    });
  } finally {
    db.close();
  }
}

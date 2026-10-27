const DB_NAME = 'focus-forest-stickers';
const STORE = 'files';

export const MAX_CUSTOM_STICKERS = 20;
export const MAX_STICKER_BYTES = 2 * 1024 * 1024;
export const CUSTOM_STICKER_PREFIX = 'user-sticker-';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('스티커 저장소를 열지 못했어요.'));
  });
}

export function isCustomStickerId(id: string): boolean {
  return id.startsWith(CUSTOM_STICKER_PREFIX);
}

export function isPngFile(file: File): boolean {
  return file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
}

export async function hasPngSignature(file: Blob): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  return PNG_SIGNATURE.every((byte, index) => header[index] === byte);
}

export function stickerNameFromFile(name: string): string {
  const base = name.replace(/\.png$/i, '').trim().replace(/\s+/g, ' ');
  return (base || '내 스티커').slice(0, 20);
}

export async function saveStickerBlob(id: string, file: Blob): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(file, id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('스티커를 저장하지 못했어요.'));
      tx.onabort = () => reject(tx.error ?? new Error('스티커 저장이 취소됐어요.'));
    });
  } finally {
    db.close();
  }
}

export async function loadStickerBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readonly');
    const result = await new Promise<Blob | undefined>((resolve, reject) => {
      const request = tx.objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('스티커를 불러오지 못했어요.'));
    });
    return result instanceof Blob ? result : null;
  } finally {
    db.close();
  }
}

export async function deleteStickerBlob(id: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('스티커를 지우지 못했어요.'));
    });
  } finally {
    db.close();
  }
}

export async function clearStickerBlobs(): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('스티커를 비우지 못했어요.'));
    });
  } finally {
    db.close();
  }
}

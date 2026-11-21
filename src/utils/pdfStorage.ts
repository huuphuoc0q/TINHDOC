const DB_NAME = 'tinh-doc-pdf';
const STORE_NAME = 'files';
const PDF_KEY = 'current-pdf';

interface StoredPdf {
  file: File;
  name: string;
  savedAt: string;
}

function openPdfDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePdfToIndexedDb(file: File): Promise<void> {
  const db = await openPdfDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(
      { file, name: file.name, savedAt: new Date().toISOString() } satisfies StoredPdf,
      PDF_KEY,
    );
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function loadPdfFromIndexedDb(): Promise<StoredPdf | null> {
  const db = await openPdfDatabase();
  const stored = await new Promise<StoredPdf | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(PDF_KEY);
    request.onsuccess = () => resolve(request.result as StoredPdf | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return stored ?? null;
}

export async function clearPdfFromIndexedDb(): Promise<void> {
  const db = await openPdfDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(PDF_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function getPdfPageCount(file: File): Promise<number> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const data = await file.arrayBuffer();
  const document = await pdfjs.getDocument({ data: data.slice(0) }).promise;
  return document.numPages;
}

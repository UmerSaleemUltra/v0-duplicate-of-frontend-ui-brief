// IndexedDB utility for storing passport files temporarily
const DB_NAME = "buzzfiling_checkout"
const STORE_NAME = "passport_files"
const DB_VERSION = 1

export interface StoredFile {
  id: string
  file: File
  preview: string
  uploadedAt: number
  memberIndex: number
}

export const isIndexedDBAvailable = (): boolean => {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null
  } catch {
    return false
  }
}

export const testIndexedDB = async (): Promise<boolean> => {
  if (!isIndexedDBAvailable()) return false

  try {
    const testDB = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("test_db", 1)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains("test_store")) {
          db.createObjectStore("test_store")
        }
      }
    })

    testDB.close()
    indexedDB.deleteDatabase("test_db")
    return true
  } catch {
    return false
  }
}

// Initialize IndexedDB
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB is not available (possibly in incognito/private mode)"))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
  })
}

// Save file to IndexedDB
export const saveFileToIndexedDB = async (file: File, memberIndex: number): Promise<string> => {
  if (!isIndexedDBAvailable()) {
    throw new Error("IndexedDB is not available. Please disable incognito/private mode.")
  }

  const db = await initDB()
  const id = `passport_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const preview = URL.createObjectURL(file)

  const storedFile: StoredFile = {
    id,
    file,
    preview,
    uploadedAt: Date.now(),
    memberIndex,
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(storedFile)

    request.onsuccess = () => resolve(id)
    request.onerror = () => reject(request.error)
  })
}

// Get file from IndexedDB
export const getFileFromIndexedDB = async (id: string): Promise<StoredFile | null> => {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

// Get all files from IndexedDB
export const getAllFilesFromIndexedDB = async (): Promise<StoredFile[]> => {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

// Delete file from IndexedDB
export const deleteFileFromIndexedDB = async (id: string): Promise<void> => {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Clear all files from IndexedDB (cleanup after successful order)
export const clearAllFilesFromIndexedDB = async (): Promise<void> => {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

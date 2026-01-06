// IndexedDB utility for storing passport files temporarily
const DB_NAME = "buzzfiling_checkout"
const STORE_NAME = "passport_files"
const DB_VERSION = 1
const LOCALSTORAGE_KEY = "passport_files_backup"

export interface StoredFile {
  id: string
  file: File
  preview: string
  uploadedAt: number
  memberIndex: number
}

export interface StoredFileBackup {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  fileData: string // base64 encoded
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

// Save file to localStorage as backup (for incognito mode)
export const saveFileToLocalStorage = async (file: File, memberIndex: number): Promise<string> => {
  const id = `passport_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      try {
        const fileData = reader.result as string
        const backup: StoredFileBackup = {
          id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData,
          preview: URL.createObjectURL(file),
          uploadedAt: Date.now(),
          memberIndex,
        }

        const existing = localStorage.getItem(LOCALSTORAGE_KEY)
        const backups: StoredFileBackup[] = existing ? JSON.parse(existing) : []
        backups.push(backup)
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(backups))

        resolve(id)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// Get file from localStorage backup
export const getFileFromLocalStorage = async (id: string): Promise<StoredFile | null> => {
  try {
    const existing = localStorage.getItem(LOCALSTORAGE_KEY)
    if (!existing) return null

    const backups: StoredFileBackup[] = JSON.parse(existing)
    const backup = backups.find((b) => b.id === id)

    if (!backup) return null

    // Convert base64 back to File
    const response = await fetch(backup.fileData)
    const blob = await response.blob()
    const file = new File([blob], backup.fileName, { type: backup.fileType })

    return {
      id: backup.id,
      file,
      preview: backup.preview,
      uploadedAt: backup.uploadedAt,
      memberIndex: backup.memberIndex,
    }
  } catch (error) {
    console.error("[v0] Error retrieving file from localStorage:", error)
    return null
  }
}

// Get all files from localStorage backup
export const getAllFilesFromLocalStorage = async (): Promise<StoredFile[]> => {
  try {
    const existing = localStorage.getItem(LOCALSTORAGE_KEY)
    if (!existing) return []

    const backups: StoredFileBackup[] = JSON.parse(existing)

    const files = await Promise.all(
      backups.map(async (backup) => {
        try {
          const response = await fetch(backup.fileData)
          const blob = await response.blob()
          const file = new File([blob], backup.fileName, { type: backup.fileType })

          return {
            id: backup.id,
            file,
            preview: backup.preview,
            uploadedAt: backup.uploadedAt,
            memberIndex: backup.memberIndex,
          }
        } catch (error) {
          console.error(`[v0] Error converting backup file ${backup.id}:`, error)
          return null
        }
      }),
    )

    return files.filter((f): f is StoredFile => f !== null)
  } catch (error) {
    console.error("[v0] Error retrieving files from localStorage:", error)
    return []
  }
}

// Clear localStorage backup
export const clearLocalStorageBackup = (): void => {
  localStorage.removeItem(LOCALSTORAGE_KEY)
}

// Save file to IndexedDB
export const saveFileToIndexedDB = async (file: File, memberIndex: number): Promise<string> => {
  console.log("[v0] Attempting to save file to IndexedDB...")

  // Try IndexedDB first
  if (isIndexedDBAvailable()) {
    try {
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

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put(storedFile)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log("[v0] ✅ File saved to IndexedDB:", id)

      // Also save to localStorage as backup
      await saveFileToLocalStorage(file, memberIndex)
      console.log("[v0] ✅ File also saved to localStorage as backup")

      return id
    } catch (error) {
      console.warn("[v0] IndexedDB failed, falling back to localStorage:", error)
    }
  }

  // Fallback to localStorage if IndexedDB fails or unavailable
  console.log("[v0] Using localStorage for file storage (incognito mode detected)")
  return await saveFileToLocalStorage(file, memberIndex)
}

// Get file from IndexedDB
export const getFileFromIndexedDB = async (id: string): Promise<StoredFile | null> => {
  console.log("[v0] Retrieving file:", id)

  // Try IndexedDB first
  if (isIndexedDBAvailable()) {
    try {
      const db = await initDB()
      const file = await new Promise<StoredFile | null>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(id)

        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      })

      if (file) {
        console.log("[v0] ✅ File retrieved from IndexedDB")
        return file
      }
    } catch (error) {
      console.warn("[v0] IndexedDB retrieval failed, checking localStorage:", error)
    }
  }

  // Fallback to localStorage
  console.log("[v0] Checking localStorage for file")
  return await getFileFromLocalStorage(id)
}

// Get all files from IndexedDB
export const getAllFilesFromIndexedDB = async (): Promise<StoredFile[]> => {
  console.log("[v0] Retrieving all files...")
  const files: StoredFile[] = []

  // Try IndexedDB first
  if (isIndexedDBAvailable()) {
    try {
      const db = await initDB()
      const indexedDBFiles = await new Promise<StoredFile[]>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.getAll()

        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })

      files.push(...indexedDBFiles)
      console.log(`[v0] ✅ Retrieved ${indexedDBFiles.length} files from IndexedDB`)
    } catch (error) {
      console.warn("[v0] IndexedDB retrieval failed:", error)
    }
  }

  // Also check localStorage
  const localStorageFiles = await getAllFilesFromLocalStorage()
  console.log(`[v0] ✅ Retrieved ${localStorageFiles.length} files from localStorage`)

  // Merge, avoiding duplicates
  const uniqueFiles = new Map<string, StoredFile>()
  for (const file of [...files, ...localStorageFiles]) {
    uniqueFiles.set(file.id, file)
  }

  const result = Array.from(uniqueFiles.values())
  console.log(`[v0] Total unique files: ${result.length}`)
  return result
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
  console.log("[v0] Clearing all stored files...")

  // Clear IndexedDB
  if (isIndexedDBAvailable()) {
    try {
      const db = await initDB()
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.clear()

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
      console.log("[v0] ✅ IndexedDB cleared")
    } catch (error) {
      console.warn("[v0] Failed to clear IndexedDB:", error)
    }
  }

  // Clear localStorage backup
  clearLocalStorageBackup()
  console.log("[v0] ✅ localStorage backup cleared")
}

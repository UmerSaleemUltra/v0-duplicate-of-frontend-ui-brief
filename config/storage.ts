import { put, del, list, head } from "@vercel/blob"

process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_enipxGoXoWBCpr7X_5w7RhF4GZzv9S4dBcF8lVwfbINaiXm"

export interface UploadResult {
  url: string
  pathname: string
  contentType: string
  contentDisposition: string
}

export const blobStorage = {
  // Upload a file to Vercel Blob
  async upload(
    file: File | Blob,
    options: {
      folder?: string
      filename?: string
      access?: "public"
    } = {},
  ): Promise<UploadResult> {
    try {
      const pathname = options.folder
        ? `${options.folder}/${options.filename || Date.now()}`
        : options.filename || `${Date.now()}`

      const blob = await put(pathname, file, {
        access: options.access || "public",
        addRandomSuffix: true,
      })

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType || "",
        contentDisposition: blob.contentDisposition || "",
      }
    } catch (error) {
      console.error("Blob upload error:", error)
      throw new Error("Failed to upload file to storage")
    }
  },

  // Delete a file from Vercel Blob
  async delete(url: string): Promise<void> {
    try {
      await del(url)
    } catch (error) {
      console.error("Blob delete error:", error)
      throw new Error("Failed to delete file from storage")
    }
  },

  // List files in a folder
  async listFiles(prefix?: string): Promise<any[]> {
    try {
      const { blobs } = await list({ prefix })
      return blobs
    } catch (error) {
      console.error("Blob list error:", error)
      throw new Error("Failed to list files from storage")
    }
  },

  // Get file metadata
  async getMetadata(url: string): Promise<any> {
    try {
      const metadata = await head(url)
      return metadata
    } catch (error) {
      console.error("Blob metadata error:", error)
      throw new Error("Failed to get file metadata")
    }
  },
}

// Helper function to validate file types
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      const category = type.split("/")[0]
      return file.type.startsWith(category + "/")
    }
    return file.type === type
  })
}

// Helper function to validate file size
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSize = maxSizeMB * 1024 * 1024 // Convert MB to bytes
  return file.size <= maxSize
}

// Common file type groups
export const FILE_TYPES = {
  DOCUMENTS: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  IMAGES: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  ALL: ["*/*"],
}

// Max file sizes
export const MAX_FILE_SIZE = {
  DOCUMENT: 10, // 10 MB
  IMAGE: 5, // 5 MB
  PASSPORT: 10, // 10 MB
}

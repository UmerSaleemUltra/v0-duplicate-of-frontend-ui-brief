/**
 * File management utilities for checkout process
 * Handles saving, deleting, and retrieving files during checkout
 */

export const RECEIPT_FILE_KEY = "checkout_receipt"

interface FileData {
  key: string
  name: string
  data: string // base64 encoded
  timestamp: number
}

/**
 * Save file to localStorage
 */
export const saveFile = (key: string, file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const fileData: FileData = {
          key,
          name: file.name,
          data: reader.result as string,
          timestamp: Date.now(),
        }
        localStorage.setItem(`file_${key}`, JSON.stringify(fileData))
        resolve()
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

/**
 * Delete file from localStorage
 */
export const deleteFile = (key: string): void => {
  try {
    localStorage.removeItem(`file_${key}`)
  } catch (error) {
    console.error("[v0] Error deleting file:", error)
  }
}

/**
 * Clear all checkout files from localStorage
 */
export const clearAllFiles = (): void => {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith("file_")) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error("[v0] Error clearing files:", error)
  }
}

/**
 * Generate file key for member documents
 */
export const makeMemberFileKey = (memberId: string, docType: string): string => {
  return `member_${memberId}_${docType}`
}

/**
 * Get file from localStorage
 */
export const getFile = (key: string): FileData | null => {
  try {
    const data = localStorage.getItem(`file_${key}`)
    if (!data) return null
    return JSON.parse(data) as FileData
  } catch (error) {
    console.error("[v0] Error retrieving file:", error)
    return null
  }
}

/**
 * Upload file to server
 */
export const uploadFileToServer = async (
  key: string,
  file: File,
  checkoutToken: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("key", key)
    formData.append("checkoutToken", checkoutToken)

    const response = await fetch("/api/payment-receipt/upload", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${checkoutToken}`,
      },
    })

    if (!response.ok) {
      return { success: false, error: "Upload failed" }
    }

    const data = await response.json()
    return { success: true, url: data.url }
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return { success: false, error: String(error) }
  }
}

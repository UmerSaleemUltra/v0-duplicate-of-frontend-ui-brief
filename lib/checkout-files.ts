/**
 * File storage utilities for checkout forms
 * Handles saving, deleting, and managing files using IndexedDB
 */

import { openDB } from "idb";

const DB_NAME = "checkout-files-db";
const STORE_NAME = "files";
const DB_VERSION = 1;

export const RECEIPT_FILE_KEY = "payment-receipt";

/**
 * Get or create the IndexedDB database
 */
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

/**
 * Save a file to IndexedDB
 */
export async function saveFile(key: string, file: File): Promise<void> {
  try {
    const db = await getDB();
    const buffer = await file.arrayBuffer();
    const fileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      data: buffer,
      timestamp: Date.now(),
    };
    await db.put(STORE_NAME, fileData, key);
  } catch (error) {
    console.error("[checkout-files] Error saving file:", error);
    throw error;
  }
}

/**
 * Delete a file from IndexedDB
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, key);
  } catch (error) {
    console.error("[checkout-files] Error deleting file:", error);
    throw error;
  }
}

/**
 * Clear all files from IndexedDB
 */
export async function clearAllFiles(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch (error) {
    console.error("[checkout-files] Error clearing files:", error);
    throw error;
  }
}

/**
 * Get a file from IndexedDB
 */
export async function getFile(key: string): Promise<File | null> {
  try {
    const db = await getDB();
    const fileData = await db.get(STORE_NAME, key);
    if (!fileData) return null;
    return new File([fileData.data], fileData.name, { type: fileData.type });
  } catch (error) {
    console.error("[checkout-files] Error getting file:", error);
    return null;
  }
}

/**
 * Generate a consistent key for member ID files
 */
export function makeMemberFileKey(memberId: string): string {
  return `member-id-${memberId}`;
}

/**
 * List all file keys in storage
 */
export async function listFileKeys(): Promise<string[]> {
  try {
    const db = await getDB();
    return await db.getAllKeys(STORE_NAME);
  } catch (error) {
    console.error("[checkout-files] Error listing file keys:", error);
    return [];
  }
}

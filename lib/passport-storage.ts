export interface PassportData {
  id: string
  userId: string
  fileName: string
  fileType: string
  fileUrl: string
  uploadedAt: Date
}

export const savePassport = async (userId: string, file: File): Promise<PassportData> => {
  // This will be replaced with API call
  return {
    id: Date.now().toString(),
    userId,
    fileName: file.name,
    fileType: file.type,
    fileUrl: "",
    uploadedAt: new Date(),
  }
}

export const getPassport = async (userId: string): Promise<PassportData | null> => {
  return null
}

export const deletePassport = async (userId: string): Promise<void> => {
  // No-op
}

export const arrayBufferToFile = (buffer: ArrayBuffer, fileName: string, mimeType: string): File => {
  return new File([buffer], fileName, { type: mimeType })
}

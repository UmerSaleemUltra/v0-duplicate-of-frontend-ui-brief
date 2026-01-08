import { ObjectId } from "mongodb"

export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && /^[a-f\d]{24}$/i.test(id)
}

export function validateObjectId(id: string, fieldName: string = "ID"): void {
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ${fieldName} format`)
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long" }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter" }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" }
  }
  return { valid: true }
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/
  return phoneRegex.test(phone)
}

export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength)
}

export function validateFileUpload(file: File, options: {
  maxSize?: number
  allowedTypes?: string[]
} = {}): { valid: boolean; error?: string } {
  const maxSize = options.maxSize || 10 * 1024 * 1024 // 10MB default
  const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  
  if (file.size > maxSize) {
    return { valid: false, error: `File size must be less than ${maxSize / 1024 / 1024}MB` }
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` }
  }
  
  return { valid: true }
}

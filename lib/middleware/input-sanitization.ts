import { NextRequest } from "next/server"

// Prevent NoSQL injection attacks
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential MongoDB operators
    return input.replace(/[${}]/g, '')
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item))
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      // Skip MongoDB operators
      if (key.startsWith('$')) {
        continue
      }
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

// Validate and sanitize file uploads
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit',
    }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed. Only images, PDFs, and Word documents are accepted',
    }
  }

  return { valid: true }
}

// Detect suspicious patterns
export function detectSuspiciousPatterns(input: string): boolean {
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS attempts
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers
    /eval\s*\(/gi, // Eval usage
    /union\s+select/gi, // SQL injection
    /drop\s+table/gi, // SQL injection
    /delete\s+from/gi, // SQL injection
  ]

  return suspiciousPatterns.some(pattern => pattern.test(input))
}

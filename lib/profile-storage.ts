export const profileImageStorage = {
  get: (userId: string): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(`profile_image_${userId}`)
  },
  save: (userId: string, imageData: string): void => {
    if (typeof window === "undefined") return
    localStorage.setItem(`profile_image_${userId}`, imageData)
  },
  delete: (userId: string): void => {
    if (typeof window === "undefined") return
    localStorage.removeItem(`profile_image_${userId}`)
  },
}

import { getAllFilesFromIndexedDB, clearAllFilesFromIndexedDB } from "./indexeddb"
import type { Member } from "@/app/checkout/page"

export async function uploadPassportsFromIndexedDB(
  members: Member[],
  userId: string,
  companyId?: string,
): Promise<Member[]> {
  try {
    // Get all stored files from IndexedDB
    const storedFiles = await getAllFilesFromIndexedDB()

    if (storedFiles.length === 0) {
      return members
    }

    // Upload each file and update member data
    const updatedMembers = await Promise.all(
      members.map(async (member) => {
        const storedFile = storedFiles.find((sf) => sf.id === member.passportIndexedDBId)

        if (!storedFile) {
          return member
        }

        try {
          // Upload file to blob storage
          const formData = new FormData()
          formData.append("file", storedFile.file)
          formData.append("userId", userId)

          if (companyId) {
            formData.append("companyId", companyId)
          }

          formData.append("memberId", member.id)
          formData.append("memberName", member.name || "Unknown Member")

          const response = await fetch("/api/passports/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            console.error(`Failed to upload passport for member ${member.id}`)
            return member
          }

          const result = await response.json()

          // Return member with updated passport URLs
          return {
            ...member,
            passportKey: result.data?.fileUrl || result.url,
            passportUrl: result.data?.fileUrl || result.url,
            passportId: result.data?.id,
          }
        } catch (error) {
          console.error(`Error uploading passport for member ${member.id}:`, error)
          return member
        }
      }),
    )

    // Clear IndexedDB after successful upload
    await clearAllFilesFromIndexedDB()

    return updatedMembers
  } catch (error) {
    console.error("Error uploading passports from IndexedDB:", error)
    return members
  }
}

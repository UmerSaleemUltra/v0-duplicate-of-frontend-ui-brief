import { getAllFilesFromIndexedDB, clearAllFilesFromIndexedDB } from "./indexeddb"
import type { Member } from "@/app/checkout/page"

export async function uploadPassportsFromIndexedDB(
  members: Member[],
  userId: string,
  companyId?: string,
): Promise<Member[]> {
  console.log("\n === PASSPORT UPLOAD PROCESS START ===")
  console.log(" Members to process:", members.length)
  console.log(" User ID:", userId)
  console.log(" Company ID:", companyId || "none (pre-account creation)")

  try {
    // Get all stored files from IndexedDB/localStorage
    const storedFiles = await getAllFilesFromIndexedDB()
    console.log(` Retrieved ${storedFiles.length} stored files`)

    if (storedFiles.length === 0) {
      console.log(" ⚠️ No files found in storage")
      return members
    }

    const uploadResults = await Promise.allSettled(
      members.map(async (member, index) => {
        console.log(`\n Processing member ${index + 1}/${members.length}:`, member.name)
        console.log(" Member passport IndexedDB ID:", member.passportIndexedDBId)

        const storedFile = storedFiles.find((sf) => sf.id === member.passportIndexedDBId)

        if (!storedFile) {
          console.log(` ⚠️ No stored file found for member ${member.name}`)
          return member
        }

        console.log(` Found file for ${member.name}:`, {
          fileName: storedFile.file.name,
          fileSize: storedFile.file.size,
          fileType: storedFile.file.type,
        })

        try {
          if (!userId || userId === "undefined" || userId === "null") {
            console.error(` ❌ Invalid userId for member ${member.name}`)
            throw new Error("Invalid userId - account must be created first")
          }

          // Upload file to blob storage
          const formData = new FormData()
          formData.append("file", storedFile.file)
          formData.append("userId", userId)

          if (companyId && companyId !== "undefined" && companyId !== "null") {
            formData.append("companyId", companyId)
          }

          formData.append("memberId", member.id || `member_${index}`)
          formData.append("memberName", member.name || "Unknown Member")

          console.log(` Uploading passport for ${member.name}...`)

          const response = await fetch("/api/passports/upload", {
            method: "POST",
            body: formData,
          })

          const responseText = await response.text()
          let result

          try {
            result = JSON.parse(responseText)
          } catch (e) {
            console.error(` ❌ Failed to parse response for ${member.name}:`, responseText)
            throw new Error(`Server returned invalid JSON: ${responseText}`)
          }

          if (!response.ok) {
            console.error(` ❌ Upload failed for ${member.name}:`, result)
            throw new Error(result.error || `Upload failed with status ${response.status}`)
          }

          console.log(` ✅ Passport uploaded successfully for ${member.name}`)
          console.log(" Upload result:", result)

          // Return member with updated passport URLs
          return {
            ...member,
            passportKey: result.data?.fileUrl || result.url,
            passportUrl: result.data?.fileUrl || result.url,
            passportId: result.data?.id,
          }
        } catch (error) {
          console.error(` ❌ Error uploading passport for ${member.name}:`, error)
          throw error
        }
      }),
    )

    const updatedMembers: Member[] = []
    const failedUploads: { member: Member; error: string }[] = []

    uploadResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        updatedMembers.push(result.value)
      } else {
        failedUploads.push({
          member: members[index],
          error: result.reason?.message || "Unknown error",
        })
        updatedMembers.push(members[index]) // Keep original member data
      }
    })

    console.log(`\n Upload complete: ${updatedMembers.length - failedUploads.length}/${members.length} successful`)

    if (failedUploads.length > 0) {
      console.error(" ❌ Failed uploads:", failedUploads)
      throw new Error(`Failed to upload ${failedUploads.length} passport(s). Please check the console for details.`)
    }

    // Clear storage after successful upload
    await clearAllFilesFromIndexedDB()
    console.log(" ✅ Storage cleared after successful upload")

    console.log(" === PASSPORT UPLOAD PROCESS COMPLETE ===\n")
    return updatedMembers
  } catch (error) {
    console.error(" ❌ Fatal error in passport upload process:", error)
    throw error
  }
}

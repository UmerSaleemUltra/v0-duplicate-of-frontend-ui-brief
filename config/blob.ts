export const blobConfig = {
  token: process.env.BLOB_READ_WRITE_TOKEN!,
  baseUrl: "https://blob.vercel-storage.com",
}

if (!blobConfig.token) {
  console.warn("BLOB_READ_WRITE_TOKEN is not set")
}

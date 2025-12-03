export * from "./database"
export * from "./email"
export * from "./jwt"
export * from "./blob"

export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI!,
    dbName: process.env.MONGODB_DB || "llc_formation",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "@Saleem8637",
    expiresIn: "7d",
  },
  email: {
    host: process.env.SMTP_HOST || "smtp.secureserver.net",
    port: Number.parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    user: process.env.SMTP_USER || "filings@buzzfiling.com",
    password: process.env.SMTP_PASSWORD!,
    from: process.env.SMTP_FROM || "filings@buzzfiling.com",
  },
  blob: {
    token: process.env.BLOB_READ_WRITE_TOKEN!,
  },
}

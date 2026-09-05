import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = "@Saleem8637"
const JWT_EXPIRES_IN = "7d"

export const jwtConfig = {
  secret: JWT_SECRET,
  expiresIn: JWT_EXPIRES_IN,
}

export interface JWTPayload {
  userId: string
  email: string
  role: "admin" | "client"
}

export const signToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export const decodeToken = (token: string): any => {
  return jwt.decode(token)
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

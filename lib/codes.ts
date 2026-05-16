import { customAlphabet } from "nanoid"

// Avoid lookalikes (I, O, 0, 1) to make codes easy to read aloud and type.
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const nano = customAlphabet(alphabet, 4)

export function newRoomCode(): string {
  return nano()
}

export function newToken(): string {
  // 24 chars of high-entropy random for voter and host identification.
  const big = customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 24)
  return big()
}

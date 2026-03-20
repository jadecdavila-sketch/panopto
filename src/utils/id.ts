/**
 * Generate a unique ID using the Web Crypto API.
 * Returns a UUID v4 string.
 */
export function generateId(): string {
  return crypto.randomUUID()
}

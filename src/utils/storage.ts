/**
 * Typed localStorage utilities with JSON parsing and error handling.
 */

/**
 * Get a value from localStorage, parsed as JSON.
 * Returns the fallback value if the key doesn't exist or parsing fails.
 */
export function getStorageItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/**
 * Set a value in localStorage as JSON.
 * Returns true if successful, false if an error occurred.
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * Remove a value from localStorage.
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Silently ignore errors (e.g., SecurityError in some contexts)
  }
}

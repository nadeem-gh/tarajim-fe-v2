/**
 * User Preferences Manager
 * Handles localStorage-based user preferences for the application
 */

export type STTMethod = 'browser' | 'whisper'

export interface UserPreferences {
  sttMethod: STTMethod
  // Add more preferences as needed
  // theme: 'light' | 'dark'
  // language: string
}

const STORAGE_KEY = 'tarajim_user_preferences'
const DEFAULT_PREFERENCES: UserPreferences = {
  sttMethod: 'browser'
}

/**
 * Get all user preferences from localStorage
 */
export function getPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_PREFERENCES, ...parsed }
    }
  } catch (error) {
    console.warn('Failed to load user preferences:', error)
  }
  return DEFAULT_PREFERENCES
}

/**
 * Save user preferences to localStorage
 */
export function setPreferences(preferences: Partial<UserPreferences>): void {
  try {
    const current = getPreferences()
    const updated = { ...current, ...preferences }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.warn('Failed to save user preferences:', error)
  }
}

/**
 * Get the current STT method preference
 */
export function getSTTMethod(): STTMethod {
  return getPreferences().sttMethod
}

/**
 * Set the STT method preference
 */
export function setSTTMethod(method: STTMethod): void {
  setPreferences({ sttMethod: method })
}

/**
 * Clear all preferences (reset to defaults)
 */
export function clearPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear user preferences:', error)
  }
}

/**
 * Check if preferences are available (localStorage supported)
 */
export function isPreferencesAvailable(): boolean {
  try {
    return typeof Storage !== 'undefined' && localStorage !== null
  } catch {
    return false
  }
}

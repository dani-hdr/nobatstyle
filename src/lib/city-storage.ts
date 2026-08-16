'use client'

const KEY = 'nobatstyle.selectedCity'

/** Reads the user's last selected city id (best-effort client storage). */
export function getStoredCityId(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

/** Persists the user's selected city id so next visit starts pre-filtered. */
export function setStoredCityId(id: string): void {
  if (typeof window === 'undefined') return
  try {
    if (id) window.localStorage.setItem(KEY, id)
    else window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

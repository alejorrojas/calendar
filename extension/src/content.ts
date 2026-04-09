import type { PlasmoCSConfig } from "plasmo"

/**
 * Content script that runs on calendarito.com.
 * Reads the Supabase session from cookies and stores it
 * in chrome.storage.local so the side panel can access it.
 */
export const config: PlasmoCSConfig = {
  matches: ["https://calendarito.com/*"],
  run_at: "document_idle"
}

const STORAGE_KEY = "calendarito_session"

function readSessionFromLocalStorage(): object | null {
  // Supabase browser client stores the full session (including provider_token) in localStorage.
  // The SSR cookies only contain access_token/refresh_token/user — no provider_token.
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.includes("-auth-token")) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        const parsed = JSON.parse(raw)
        if (parsed?.access_token && parsed?.provider_token) {
          console.log("[calendarito-ext] Session found in localStorage (with provider_token)")
          return parsed
        }
      } catch {}
    }
  } catch (e) {
    console.error("[calendarito-ext] Failed to read localStorage:", e)
  }
  return null
}

function readSessionFromCookies(): object | null {
  const cookies = document.cookie.split(";")
  const tokenParts: { name: string; value: string }[] = []

  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split("=")
    const name = rawName.trim()
    const value = rest.join("=").trim()
    if (name.includes("-auth-token")) {
      tokenParts.push({ name, value })
    }
  }

  if (tokenParts.length > 0) {
    tokenParts.sort((a, b) => a.name.localeCompare(b.name))
    const raw = tokenParts.map((p) => decodeURIComponent(p.value)).join("")
    try {
      const jsonStr = raw.startsWith("base64-") ? atob(raw.slice(7)) : raw
      const parsed = JSON.parse(jsonStr)
      if (parsed?.access_token) {
        console.log("[calendarito-ext] Session found in cookies")
        return parsed
      }
    } catch (e) {
      console.error("[calendarito-ext] Failed to parse cookie session:", e)
    }
  }

  return null
}

function readSession(): object | null {
  // Prefer localStorage: it has provider_token (Google OAuth token) which cookies lack after refresh
  return readSessionFromLocalStorage() ?? readSessionFromCookies()
}

async function syncSession() {
  const session = readSession()

  if (session) {
    await chrome.storage.local.set({ [STORAGE_KEY]: session })
    console.log("[calendarito-ext] Session synced to storage ✓")
  } else {
    await chrome.storage.local.remove(STORAGE_KEY)
    console.log("[calendarito-ext] No session found, storage cleared")
  }
}

// Sync on load
syncSession()

// Re-sync when URL changes (SPA navigation)
let lastUrl = location.href
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    syncSession()
  }
}).observe(document.body, { subtree: true, childList: true })

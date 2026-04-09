import { useEffect, useState } from "react"

export type Session = {
  access_token: string
  refresh_token: string
  provider_token?: string
  provider_refresh_token?: string
  user: {
    id: string
    email?: string
    user_metadata?: {
      avatar_url?: string
      full_name?: string
    }
  }
}

const STORAGE_KEY = "calendarito_session"

/**
 * Reads the Supabase session from chrome.storage.local.
 * The session is written there by the content script running on calendarito.com.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial read
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const s = result[STORAGE_KEY] ?? null
      setSession(s)
      setLoading(false)
    })

    // Listen for changes (e.g. user logs in/out on the web app)
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (STORAGE_KEY in changes) {
        setSession(changes[STORAGE_KEY].newValue ?? null)
      }
    }

    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  return { session, loading }
}

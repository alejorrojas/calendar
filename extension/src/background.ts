import type { PlasmoMessaging } from "@plasmohq/messaging"

const STORAGE_KEY = "calendarito_session"
const APP_DOMAIN = "calendarito.com"

async function readSessionFromCookies() {
  try {
    // Use domain (not url) to get all cookies including HttpOnly
    const allCookies = await chrome.cookies.getAll({ domain: APP_DOMAIN })

    const tokenCookies = allCookies
      .filter((c) => c.name.includes("-auth-token"))
      .sort((a, b) => a.name.localeCompare(b.name))

    if (tokenCookies.length === 0) return null

    const raw = tokenCookies
      .map((c) => decodeURIComponent(c.value))
      .join("")

    const session = JSON.parse(raw)
    if (!session?.access_token) return null

    return session
  } catch {
    return null
  }
}

// Listen for message from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_SESSION_FROM_COOKIES") {
    readSessionFromCookies().then((session) => {
      if (session) {
        chrome.storage.local.set({ [STORAGE_KEY]: session })
      } else {
        chrome.storage.local.remove(STORAGE_KEY)
      }
      sendResponse({ session })
    })
    return true // keep channel open for async response
  }
})

// Open side panel on icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) chrome.sidePanel.open({ tabId: tab.id })
})

// Also run on startup in case the side panel is opened before visiting calendarito.com
chrome.runtime.onInstalled.addListener(() => {
  readSessionFromCookies().then((session) => {
    if (session) {
      chrome.storage.local.set({ [STORAGE_KEY]: session })
    }
  })
})

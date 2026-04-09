# Calendarito — Chrome Extension

> Drop or type anything, get events in your Calendar.

A Chrome side panel extension that lets you create Google Calendar events from anywhere — using natural language, files, or images — without leaving your current tab.

---

## Chrome Web Store Listing

### Name
```
Calendarito
```

### Short description (132 chars max)
```
Create Google Calendar events from any tab using natural language, files, or images. No copy-pasting. No switching tabs.
```

### Full description
```
Calendarito brings your scheduling workflow into the browser. Open the side panel from any tab, type what's on your schedule — or attach a file, PDF, or image — and we turn it into structured Google Calendar events in seconds.

HOW IT WORKS

1. Sign in once on calendarito.com with your Google account.
2. Click the Calendarito icon in your toolbar to open the side panel.
3. Type naturally ("Team sync Monday 10am", "Math exam next Friday") or attach a file.
4. Review and edit the extracted events — adjust title, date, time, and color.
5. Choose a calendar and click "Create in Google Calendar".

That's it. No copy-pasting. No tab switching. No manual form filling.

WHAT YOU CAN SHARE
— Natural language descriptions of events
— Screenshots or photos of schedules, invitations, or whiteboards
— PDF documents with dates and event details
— Plain text files and CSV files

PRIVACY
We never store or view your events. They are extracted using AI and created directly in your Google Calendar. Your session is read locally from calendarito.com — no credentials are ever transmitted to third parties.

See our Privacy Policy at calendarito.com/privacy.
```

### Category
```
Productivity
```

### Language
```
English
```

---

## Single Purpose

Calendarito has a single, concrete purpose: **create Google Calendar events from any browser tab using natural language**.

Every feature in the extension exists solely to serve this purpose — the side panel UI for input, the content script to read the user's existing session, and the API calls to extract and create events. The extension does not modify web pages, track browsing activity, inject ads, or perform any action unrelated to event creation.

---

## Permissions Justification

These are the permissions declared in the manifest and the justification for each, as required by the Chrome Web Store review process.

### `sidePanel`
The extension's entire UI lives in a Chrome Side Panel. This permission is required to register and open the side panel when the user clicks the extension icon.

### `storage`
Used to persist the user's Calendarito session (read from calendarito.com) in `chrome.storage.local`, so the side panel can access it without re-reading cookies on every interaction.

### `cookies`
Used by the background service worker to read the Supabase auth session from `calendarito.com` cookies via `chrome.cookies.getAll({ domain: "calendarito.com" })`. This allows the extension to pick up the user's existing login session without requiring a separate sign-in flow inside the extension.

> **Note:** Cookie access is strictly limited to `calendarito.com` by the declared `host_permissions`. The extension cannot read cookies from any other domain.

### `host_permissions: https://calendarito.com/*`
Required for two reasons:
1. The content script is injected into Calendarito pages to read the user's existing auth session — so users don't need to log in separately in the extension.
2. The extension makes API calls to `calendarito.com/api/*` to extract events and create them in Google Calendar.

No other domains are accessed.

---

## Remote Code

**Does the extension use remote code?** Yes.

The extension sends user-provided content (text, files, or images) to `calendarito.com/api/*` for server-side AI processing. The server extracts structured event data and returns it to the extension. No JavaScript or WebAssembly is fetched from a remote URL and executed at runtime — all extension code is bundled at build time. The remote calls are strictly API requests to the extension's own backend.

---

## Data Usage

### Data collected

| Data type | Collected | Purpose |
|-----------|-----------|---------|
| Personal identification info | No | — |
| Health information | No | — |
| Financial and payment info | No | — |
| Authentication information | Yes | The user's Supabase/Google OAuth session token is read from `calendarito.com` and stored in `chrome.storage.local` to authorize API calls. It is never shared with third parties. |
| Personal communications | No | — |
| Location | No | — |
| Web history | No | — |
| User activity | No | — |
| Web content | No | — |

### Certifications

- We do not sell or transfer user data to third parties, outside of the approved use cases.
- We do not use or transfer user data for purposes unrelated to the extension's single purpose.
- We do not use or transfer user data to determine creditworthiness or for lending purposes.

---

## Screenshots (required for store listing)

Minimum 1, maximum 5. Recommended size: **1280×800**.

Suggested shots:
1. Side panel open next to a busy webpage — showing the input area
2. Events extracted from a typed message ("Team sync Monday 10am, dentist Friday 3pm")
3. Expanded event editor with color picker
4. Calendar selector dropdown
5. Success state — "2 events created"

---

## Privacy Policy
```
https://calendarito.com/privacy
```

## Homepage URL
```
https://calendarito.com
```

---

## Development

### Install dependencies
```bash
bun install
```

### Run in dev mode
```bash
bun run dev
```
Load `build/chrome-mv3-dev` as an unpacked extension in `chrome://extensions`.

### Production build
```bash
bun run build
```
Output: `build/chrome-mv3-prod/`

### Package for submission
```bash
bun run package
```
Output: `build/chrome-mv3-prod.zip` — ready to upload to the Chrome Web Store.

---

## Architecture

```
extension/
├── src/
│   ├── sidepanel.tsx        # Main UI — input, event list, calendar selector, submit
│   ├── content.ts           # Injected into calendarito.com — reads auth session from cookies
│   ├── background.ts        # Service worker — opens side panel on icon click
│   ├── style.css            # Design tokens (Poppins, Inter, #E8E815 yellow)
│   └── features/
│       ├── useAuth.ts       # Reads session from chrome.storage.local
│       └── SourceInput.tsx  # Text input + file/image drag-drop component
└── assets/
    └── icon.png             # Calendarito mark (yellow circle + arrow)
```

### Auth flow
```
User logged in at calendarito.com
  → content.ts reads document.cookie (Supabase session, base64-decoded)
  → stores session in chrome.storage.local
  → sidepanel.tsx reads from chrome.storage.local
  → API calls use Authorization: Bearer <access_token> + X-Provider-Token
```

No separate login required. If the user is logged in on the web app, the extension works automatically.

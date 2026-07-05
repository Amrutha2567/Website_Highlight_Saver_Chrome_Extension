# Website Highlight Saver — Chrome Extension

Highlight text on any webpage, save it locally, view/delete saved highlights, and get an optional AI summary via OpenAI.

## Load it locally (unpacked)

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this folder (`highlight-saver`)
5. The extension icon will appear in your toolbar

## How to use

1. Go to any webpage and select some text
2. A small "Save Highlight?" bubble appears near your selection — click it
3. The text gets highlighted in yellow on the page and saved locally
4. Click the extension's toolbar icon to open the popup and see all saved highlights
5. Delete individual highlights, or use "Clear all"
6. (Optional) Paste an OpenAI API key into the field at the top of the popup and click **Save**, then hit **Summarize** on any highlight to get a one-sentence AI summary

## Notes on the Summarize feature

- Requires your own OpenAI API key (stored only in `chrome.storage.local` on your machine, never sent anywhere except directly to OpenAI's API)
- Uses the `gpt-4o-mini` model via `https://api.openai.com/v1/chat/completions`
- If no key is set, clicking Summarize shows a message asking you to add one

## Files

- `manifest.json` — extension config (Manifest V3)
- `content.js` / `content.css` — runs on every page, detects selection, shows the save bubble, highlights text
- `popup.html` / `popup.css` / `popup.js` — toolbar popup UI: list, delete, clear all, summarize
- `background.js` — service worker, initializes storage on install
- `icons/` — extension icons

## Demo video checklist (for submission)

- [ ] Show loading the extension unpacked via `chrome://extensions`
- [ ] Show selecting text on a real webpage and saving a highlight
- [ ] Show the popup listing saved highlights
- [ ] Show deleting a highlight
- [ ] Show the Summarize button producing an AI summary
- [ ] Keep it 2–5 minutes, show your face, speak in English

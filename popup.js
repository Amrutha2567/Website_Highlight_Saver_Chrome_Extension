const listEl = document.getElementById("list");
const emptyStateEl = document.getElementById("empty-state");
const apiKeyInput = document.getElementById("api-key-input");
const saveKeyBtn = document.getElementById("save-key-btn");
const clearAllBtn = document.getElementById("clear-all-btn");

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function hostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function loadHighlights() {
  chrome.storage.local.get({ highlights: [] }, (data) => {
    renderList(data.highlights);
  });
}

function renderList(highlights) {
  listEl.innerHTML = "";

  if (!highlights.length) {
    emptyStateEl.hidden = false;
    return;
  }
  emptyStateEl.hidden = true;

  for (const h of highlights) {
    const card = document.createElement("div");
    card.className = "highlight-card";
    card.dataset.id = h.id;

    card.innerHTML = `
      <p class="highlight-text">${escapeHtml(h.text)}</p>
      <div class="highlight-meta">
        <span class="highlight-source" title="${escapeHtml(h.url)}">${escapeHtml(hostname(h.url))}</span>
        <span>${timeAgo(h.createdAt)}</span>
      </div>
      <div class="highlight-actions">
        <button class="action-btn primary summarize-btn">Summarize</button>
        <button class="action-btn danger delete-btn">Delete</button>
      </div>
    `;

    card.querySelector(".delete-btn").addEventListener("click", () => deleteHighlight(h.id));
    card.querySelector(".summarize-btn").addEventListener("click", () => summarizeHighlight(h, card));

    listEl.appendChild(card);
  }
}

function deleteHighlight(id) {
  chrome.storage.local.get({ highlights: [] }, (data) => {
    const updated = data.highlights.filter((h) => h.id !== id);
    chrome.storage.local.set({ highlights: updated }, loadHighlights);
  });
}

clearAllBtn.addEventListener("click", () => {
  if (!confirm("Delete all saved highlights? This cannot be undone.")) return;
  chrome.storage.local.set({ highlights: [] }, loadHighlights);
});

// --- API key persistence ---
chrome.storage.local.get({ openaiApiKey: "" }, (data) => {
  apiKeyInput.value = data.openaiApiKey || "";
});

saveKeyBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  chrome.storage.local.set({ openaiApiKey: key }, () => {
    saveKeyBtn.textContent = "Saved!";
    setTimeout(() => (saveKeyBtn.textContent = "Save"), 1200);
  });
});

// --- Summarize via OpenAI ---
async function summarizeHighlight(highlight, cardEl) {
  const existingBox = cardEl.querySelector(".summary-box");
  if (existingBox) existingBox.remove();

  const box = document.createElement("div");
  box.className = "summary-box loading";
  box.textContent = "Summarizing...";
  cardEl.appendChild(box);

  const { openaiApiKey } = await chrome.storage.local.get({ openaiApiKey: "" });

  if (!openaiApiKey) {
    box.className = "summary-box error";
    box.textContent = "Add your OpenAI API key above to use Summarize.";
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Summarize the given highlighted text in one short, clear sentence.",
          },
          { role: "user", content: highlight.text },
        ],
        max_tokens: 80,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Request failed (${response.status})`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || "No summary returned.";

    box.className = "summary-box";
    box.textContent = summary;
  } catch (err) {
    box.className = "summary-box error";
    box.textContent = `Error: ${err.message}`;
  }
}

loadHighlights();

// Keep the popup in sync if storage changes elsewhere (e.g. new highlight saved
// while popup happens to be open, or another instance of the popup).
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.highlights) {
    loadHighlights();
  }
});

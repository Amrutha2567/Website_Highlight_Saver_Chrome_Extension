(function () {
  let currentBubble = null;
  let currentRange = null;

  function removeBubble() {
    if (currentBubble) {
      currentBubble.remove();
      currentBubble = null;
      currentRange = null;
    }
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "hls-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
  }

  function highlightRange(range) {
    try {
      const mark = document.createElement("mark");
      mark.className = "hls-highlight-mark";
      range.surroundContents(mark);
    } catch (e) {
      // Range spans multiple elements (can't simply surround) - skip visual wrap,
      // the text is still saved to storage.
    }
  }

  function saveHighlight(text, range) {
    const highlight = {
      id: `hl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text: text.trim(),
      url: window.location.href,
      title: document.title,
      createdAt: new Date().toISOString(),
    };

    chrome.storage.local.get({ highlights: [] }, (data) => {
      const highlights = data.highlights;
      highlights.unshift(highlight);
      chrome.storage.local.set({ highlights }, () => {
        showToast("Highlight saved");
      });
    });

    if (range) {
      highlightRange(range);
    }
  }

  function showBubble(rect, range) {
    removeBubble();
    currentRange = range;

    const bubble = document.createElement("div");
    bubble.className = "hls-save-bubble";
    bubble.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.2 7.1L12 17.8 5.8 21.3 7 14.2 2 9.3l7.1-.7z"/>
      </svg>
      <span>Save Highlight?</span>
    `;

    const top = window.scrollY + rect.top - 40;
    const left = window.scrollX + rect.left + rect.width / 2 - 70;

    bubble.style.top = `${Math.max(top, window.scrollY + 4)}px`;
    bubble.style.left = `${Math.max(left, 4)}px`;

    bubble.addEventListener("mousedown", (e) => {
      // Prevent this mousedown from clearing the selection before click fires.
      e.preventDefault();
      e.stopPropagation();
    });

    bubble.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const selectedText = range.toString();
      saveHighlight(selectedText, range.cloneRange());
      window.getSelection().removeAllRanges();
      removeBubble();
    });

    document.body.appendChild(bubble);
    currentBubble = bubble;
  }

  document.addEventListener("mouseup", (e) => {
    // Don't reprocess clicks on our own bubble.
    if (currentBubble && currentBubble.contains(e.target)) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      if (!text || selection.rangeCount === 0) {
        removeBubble();
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        removeBubble();
        return;
      }

      showBubble(rect, range);
    }, 0);
  });

  document.addEventListener("mousedown", (e) => {
    if (currentBubble && !currentBubble.contains(e.target)) {
      removeBubble();
    }
  });

  document.addEventListener("scroll", removeBubble, true);
  window.addEventListener("resize", removeBubble);
})();

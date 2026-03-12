/* ================================================
   gemini-injector.js
   Injiziert Prompts und Bild-Aktionen in Gemini
   ================================================ */

// Hilfsfunktion: Wartet auf das Eingabefeld und setzt den Text
function injectTextAndSend(text, onDone) {
  const maxAttempts = 20;
  let attempts = 0;

  const interval = setInterval(() => {
    attempts++;

    let inputField = document.querySelector('[contenteditable="true"]');
    if (!inputField) inputField = document.querySelector('rich-textarea');
    if (!inputField) inputField = document.querySelector('[data-block-id]');

    if (inputField) {
      inputField.focus();
      inputField.textContent = text;
      inputField.innerText   = text;
      if (inputField.tagName === 'INPUT' || inputField.tagName === 'TEXTAREA') {
        inputField.value = text;
      }

      inputField.dispatchEvent(new Event('input',  { bubbles: true }));
      inputField.dispatchEvent(new Event('change', { bubbles: true }));

      // Sende-Button suchen und klicken
      setTimeout(() => {
        let sendButton = document.querySelector(
          '[aria-label*="senden"], [aria-label*="Senden"], [aria-label*="Send"], button[type="submit"]'
        );
        if (!sendButton) {
          for (const btn of document.querySelectorAll('button')) {
            const lbl = (btn.getAttribute('aria-label') || '').toLowerCase();
            if (
              btn.textContent.toLowerCase().includes('senden') ||
              lbl.includes('senden') || lbl.includes('send') ||
              btn.classList.toString().includes('send')
            ) {
              sendButton = btn;
              break;
            }
          }
        }
        if (sendButton && !sendButton.disabled) {
          sendButton.click();
        }
        if (onDone) onDone();
      }, 300);

      clearInterval(interval);
      return;
    }

    if (attempts >= maxAttempts) {
      clearInterval(interval);
      console.log('[Addon] Eingabefeld nicht gefunden.');
    }
  }, 500);
}

// ── 1. Normaler Text-Prompt ──────────────────────
chrome.storage.local.get(['pendingPrompt'], (result) => {
  if (result.pendingPrompt) {
    chrome.storage.local.remove('pendingPrompt');
    injectTextAndSend(result.pendingPrompt, null);
  }
});

// ── 2. Bild-Aktion aus Kontextmenü ──────────────
chrome.storage.local.get(['pendingImageAction'], (result) => {
  if (!result.pendingImageAction) return;
  const { action, imageUrl, prompt } = result.pendingImageAction;
  chrome.storage.local.remove('pendingImageAction');

  switch (action) {

    case 'imageSend':
      // Nur das Bild schicken – URL in das Eingabefeld setzen, kein Text
      injectTextAndSend(imageUrl, null);
      break;

    case 'imageAnalyze':
    case 'imageTryOn':
      // Prompt + Bild-URL kombiniert senden
      injectTextAndSend(prompt, null);
      break;
  }
});

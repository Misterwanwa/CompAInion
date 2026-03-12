// prompt-enhancer.js

const CHAT_INPUT_SELECTORS = {
    'claude.ai': 'div[contenteditable="true"]',
    'chat.openai.com': '#prompt-textarea',
    'chatgpt.com': '#prompt-textarea',
    'gemini.google.com': '.input-area', // This is a container, will need to find the textarea inside
    'chat.mistral.ai': 'textarea',
    'copilot.microsoft.com': '#searchbox',
    'poe.com': 'textarea[placeholder^="Talk to"]'
};

function isEnhancerSupportedPage() {
    return Object.keys(CHAT_INPUT_SELECTORS).includes(window.location.hostname);
}

function createEnhancerButton() {
    const host = window.location.hostname;
    const selector = CHAT_INPUT_SELECTORS[host];
    if (!selector) return;

    const inputArea = document.querySelector(selector);
    if (!inputArea) return;

    const button = document.createElement('button');
    button.id = 'prompt-enhancer-btn';
    button.innerHTML = '🪄';
    button.style.position = 'absolute';
    button.style.right = '10px';
    button.style.bottom = '10px';
    button.style.backgroundColor = 'transparent';
    button.style.border = 'none';
    button.style.fontSize = '20px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '1000';

    // Position relative to the input area
    inputArea.parentElement.style.position = 'relative';
    inputArea.parentElement.appendChild(button);

    button.addEventListener('click', enhancePrompt);
}

const NEW_CHAT_URLS = {
    'claude.ai': 'https://claude.ai/new',
    'chat.openai.com': 'https://chat.openai.com/',
    'chatgpt.com': 'https://chatgpt.com/',
    'gemini.google.com': 'https://gemini.google.com/app',
    'chat.mistral.ai': 'https://chat.mistral.ai/chat',
    'copilot.microsoft.com': 'https://copilot.microsoft.com/',
    'poe.com': 'https://poe.com/',
};

function showToast(msg) {
  const old = document.getElementById('gemini-toast');
  if (old) old.remove();
  const toast = document.createElement('div');
  toast.id = 'gemini-toast';
  toast.textContent = msg;
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.backgroundColor = '#333';
  toast.style.color = 'white';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '5px';
  toast.style.zIndex = '10000';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function enhancePrompt() {
    const host = window.location.hostname;
    const selector = CHAT_INPUT_SELECTORS[host];
    const inputArea = document.querySelector(selector);
    const originalPrompt = inputArea.value || inputArea.innerText;

    if (!originalPrompt.trim()) {
        showToast('Bitte zuerst einen Prompt eingeben.');
        return;
    }

    inputArea.value = '';
    if (inputArea.innerText) {
        inputArea.innerText = '';
    }

    const enhancingPrompt = `Ich möchte den folgenden Prompt verbessern. Bitte:
1. Analysiere den Prompt auf Schwächen, Unklarheiten und fehlendes Kontext
2. Stelle mir 2–3 gezielte Rückfragen, die den Prompt präziser machen würden
3. Liefere direkt eine verbesserte Version des Prompts ("Enhanced Prompt"), die du für optimal hältst
4. Erkläre in 2–3 Sätzen, was du warum verändert hast

Ursprünglicher Prompt:
"""
${originalPrompt}
"""`;

    const newChatUrl = NEW_CHAT_URLS[host] || window.location.href;
    
    chrome.runtime.sendMessage({
        action: 'openNewTabWithPrompt',
        prompt: enhancingPrompt,
        url: newChatUrl
    });
}

if (isEnhancerSupportedPage()) {
    // Use a MutationObserver to wait for the input field to appear
    const observer = new MutationObserver((mutations, obs) => {
        const selector = CHAT_INPUT_SELECTORS[window.location.hostname];
        if (document.querySelector(selector)) {
            createEnhancerButton();
            obs.disconnect(); // Stop observing once the button is created
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

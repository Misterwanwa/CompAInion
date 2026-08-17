// prompt-enhancer.js

// Konfiguration für verschiedene KI-Plattformen mit spezifischen Selektoren
const PLATFORM_CONFIG = {
    'claude.ai': {
        inputSelector: 'div[contenteditable="true"]',
        sendButtonSelector: 'button[aria-label="Send message"], button[type="submit"]',
        containerSelector: '.flex.gap-2, .flex.gap-3', // Container um Eingabefeld und Senden-Button
        buttonPosition: 'before' // Zauberstab vor dem Senden-Button
    },
    'chat.openai.com': {
        inputSelector: '#prompt-textarea',
        sendButtonSelector: 'button[data-testid="send-button"], button[aria-label="Send prompt"]',
        containerSelector: '.flex.gap-2, .flex.items-end',
        buttonPosition: 'before'
    },
    'chatgpt.com': {
        inputSelector: '#prompt-textarea',
        sendButtonSelector: 'button[data-testid="send-button"], button[aria-label="Send prompt"]',
        containerSelector: '.flex.gap-2, .flex.items-end, [class*="gap"][class*="flex"]',
        buttonPosition: 'before'
    },
    'gemini.google.com': {
        inputSelector: 'rich-textarea [contenteditable="true"], [contenteditable="true"]',
        sendButtonSelector: 'button[aria-label="Senden"], button[aria-label*="send"], button.send-button, mat-icon-button.send-button',
        containerSelector: '.input-area, .send-container, [class*="input"][class*="area"]',
        buttonPosition: 'before'
    },
    'chat.mistral.ai': {
        inputSelector: 'textarea',
        sendButtonSelector: 'button[aria-label="Send"], button[type="submit"]',
        containerSelector: '.flex.gap-2, .input-container',
        buttonPosition: 'before'
    },
    'copilot.microsoft.com': {
        inputSelector: '#searchbox, textarea',
        sendButtonSelector: 'button[aria-label="Submit"], button[type="submit"]',
        containerSelector: '.flex.gap-2, .input-wrapper',
        buttonPosition: 'before'
    },
    'poe.com': {
        inputSelector: 'textarea[placeholder^="Talk to"]',
        sendButtonSelector: 'button[aria-label="Send message"], button[type="submit"]',
        containerSelector: '.ChatMessageInputContainer, .flex.gap-2',
        buttonPosition: 'before'
    }
};

function isEnhancerSupportedPage() {
    return Object.keys(PLATFORM_CONFIG).some(host => window.location.hostname.includes(host));
}

function getPlatformConfig() {
    const host = Object.keys(PLATFORM_CONFIG).find(h => window.location.hostname.includes(h));
    return host ? PLATFORM_CONFIG[host] : null;
}

function createEnhancerButton() {
    // Prüfen ob Button bereits existiert
    if (document.getElementById('prompt-enhancer-btn')) {
        return;
    }

    const config = getPlatformConfig();
    if (!config) return;

    // Finde den Senden-Button
    let sendButton = document.querySelector(config.sendButtonSelector);
    
    // Fallback: Suche nach aria-labels
    if (!sendButton) {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
            if (ariaLabel.includes('send') || ariaLabel.includes('senden') || ariaLabel.includes('absenden')) {
                sendButton = btn;
                break;
            }
        }
    }

    if (!sendButton) return;

    // Erstelle den Zauberstab-Button
    const button = document.createElement('button');
    button.id = 'prompt-enhancer-btn';
    button.innerHTML = '🪄';
    button.type = 'button'; // Verhindert Formular-Absenden

    // Styles für den Button
    button.style.cssText = `
        background: transparent;
        border: 1px solid rgba(128, 128, 128, 0.3);
        border-radius: 8px;
        font-size: 18px;
        cursor: pointer;
        padding: 6px 10px;
        margin-right: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 1000;
        position: relative;
    `;

    // Erstelle das benutzerdefinierte Tooltip
    const tooltip = document.createElement('div');
    tooltip.textContent = 'Prompt verbessern';
    tooltip.style.cssText = `
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        background-color: #1a1a1a;
        color: #fff;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-family: system-ui, -apple-system, sans-serif;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease, visibility 0.2s ease;
        pointer-events: none;
        z-index: 10001;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    `;

    // Pfeil für das Tooltip
    const arrow = document.createElement('div');
    arrow.style.cssText = `
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: #1a1a1a;
    `;
    tooltip.appendChild(arrow);
    button.appendChild(tooltip);

    // Hover-Effekte
    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
        button.style.transform = 'scale(1.05)';
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
    });
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = 'transparent';
        button.style.transform = 'scale(1)';
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
    });

    // Event Listener für Klick
    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        enhancePrompt();
    });

    // Füge den Button vor dem Senden-Button ein
    const parent = sendButton.parentElement;
    if (parent) {
        // Versuche den Button direkt vor dem Senden-Button einzufügen
        if (config.buttonPosition === 'before' && sendButton.previousElementSibling) {
            parent.insertBefore(button, sendButton);
        } else if (config.buttonPosition === 'before') {
            parent.insertBefore(button, sendButton);
        } else {
            parent.appendChild(button);
        }
    }
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
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #333;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function enhancePrompt() {
    const config = getPlatformConfig();
    if (!config) return;

    const inputArea = document.querySelector(config.inputSelector);
    if (!inputArea) {
        showToast('Eingabefeld nicht gefunden.');
        return;
    }

    const originalPrompt = inputArea.value || inputArea.innerText || inputArea.textContent;

    if (!originalPrompt.trim()) {
        showToast('Bitte zuerst einen Prompt eingeben.');
        return;
    }

    inputArea.value = '';
    if (inputArea.innerText) {
        inputArea.innerText = '';
    }
    if (inputArea.textContent) {
        inputArea.textContent = '';
    }
    // Trigger input event
    inputArea.dispatchEvent(new Event('input', { bubbles: true }));

    const enhancingPrompt = `Ich möchte den folgenden Prompt verbessern. Bitte:
1. Analysiere den Prompt auf Schwächen, Unklarheiten und fehlendes Kontext
2. Stelle mir 2–3 gezielte Rückfragen, die den Prompt präziser machen würden
3. Liefere direkt eine verbesserte Version des Prompts ("Enhanced Prompt"), die du für optimal hältst
4. Erkläre in 2–3 Sätzen, was du warum verändert hast

Ursprünglicher Prompt:
"""
${originalPrompt}
"""`;

    // Finde die passende URL für den aktuellen Host
    let newChatUrl = window.location.href;
    const host = Object.keys(NEW_CHAT_URLS).find(h => window.location.hostname.includes(h));
    if (host) {
        newChatUrl = NEW_CHAT_URLS[host];
    }
    
    chrome.runtime.sendMessage({
        action: 'openNewTabWithPrompt',
        prompt: enhancingPrompt,
        url: newChatUrl
    });
}

let enhancerObserver = null;
let urlObserver = null;

function startEnhancer() {
    if (!isEnhancerSupportedPage()) return;
    
    // Initialer Versuch
    createEnhancerButton();

    // MutationObserver für dynamische Seiten (SPAs)
    if (!enhancerObserver) {
        enhancerObserver = new MutationObserver((mutations, obs) => {
            // Prüfe alle paar Sekunden, ob der Button noch existiert
            if (!document.getElementById('prompt-enhancer-btn')) {
                createEnhancerButton();
            }
        });

        enhancerObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Prüfe auch bei URL-Änderungen (für SPAs)
    if (!urlObserver) {
        let lastUrl = location.href;
        urlObserver = new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                // Entferne alten Button und erstelle neuen
                const oldButton = document.getElementById('prompt-enhancer-btn');
                if (oldButton) oldButton.remove();
                setTimeout(createEnhancerButton, 1000);
            }
        });
        urlObserver.observe(document, { subtree: true, childList: true });
    }
}

function stopEnhancer() {
    const oldButton = document.getElementById('prompt-enhancer-btn');
    if (oldButton) oldButton.remove();
    
    if (enhancerObserver) {
        enhancerObserver.disconnect();
        enhancerObserver = null;
    }
    if (urlObserver) {
        urlObserver.disconnect();
        urlObserver = null;
    }
}

// Initialer Check beim Laden
if (isEnhancerSupportedPage()) {
    chrome.storage.sync.get(['enable-prompt-enhancer'], (result) => {
        const isEnabled = result['enable-prompt-enhancer'] !== undefined ? result['enable-prompt-enhancer'] : false;
        if (isEnabled) {
            startEnhancer();
        }
    });

    // Auf Änderungen reagieren
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && 'enable-prompt-enhancer' in changes) {
            const isEnabled = changes['enable-prompt-enhancer'].newValue;
            if (isEnabled) {
                startEnhancer();
            } else {
                stopEnhancer();
            }
        }
    });
}

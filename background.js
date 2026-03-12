/* ================================================
   background.js – Service Worker
   Kontextmenü für Rechtsklick auf Bilder
   ================================================ */

'use strict';

// URL-Mapping (muss mit MODEL_URLS in content.js übereinstimmen)
const MODEL_URLS = {
  claude:     'https://claude.ai/new',
  chatgpt:    'https://chatgpt.com/',
  deepseek:   'https://chat.deepseek.com/',
  gemini:     'https://gemini.google.com/app',
  grok:       'https://grok.com/',
  perplexity: 'https://www.perplexity.ai/',
};

function getAiConfig(callback) {
  chrome.storage.sync.get(['selectedModel', 'localLlmBackend', 'localLlmEndpoint', 'localLlmModel', 'localLlmApiKey'], (result) => {
    const model = result.selectedModel || 'gemini';
    if (model === 'local') {
      callback({
        type: 'local',
        backend: result.localLlmBackend,
        endpoint: result.localLlmEndpoint,
        model: result.localLlmModel,
        apiKey: result.localLlmApiKey
      });
    } else {
      callback({
        type: 'cloud',
        url: MODEL_URLS[model] || MODEL_URLS.gemini
      });
    }
  });
}

// Kontextmenü beim Installieren/Starten registrieren
chrome.runtime.onInstalled.addListener(createContextMenus);
chrome.runtime.onStartup.addListener(createContextMenus);

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    // ── Bild-Kontextmenü ──
    chrome.contextMenus.create({
      id:       'ai-image-parent',
      title:    'Senden an AI',
      contexts: ['image'],
    });
    chrome.contextMenus.create({
      id:       'ai-image-send',
      parentId: 'ai-image-parent',
      title:    'Bild senden',
      contexts: ['image'],
    });
    chrome.contextMenus.create({
      id:       'ai-image-analyze',
      parentId: 'ai-image-parent',
      title:    'Bild analysieren',
      contexts: ['image'],
    });
    chrome.contextMenus.create({
      id:       'ai-image-tryon',
      parentId: 'ai-image-parent',
      title:    'Kleidung anprobieren',
      contexts: ['image'],
    });

    // ── Text-Auswahl-Kontextmenü ──
    chrome.contextMenus.create({
      id:       'ai-selection-parent',
      title:    'AI: Markierten Text …',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id:       'ai-selection-ask',
      parentId: 'ai-selection-parent',
      title:    '❓ Frage stellen',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id:       'ai-selection-explain',
      parentId: 'ai-selection-parent',
      title:    '💡 Erklären',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id:       'ai-selection-translate',
      parentId: 'ai-selection-parent',
      title:    '🌐 Übersetzen',
      contexts: ['selection'],
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'summarizeWithCloud') {
        const { prompt, config } = request;
        chrome.storage.local.set({ pendingPrompt: prompt }, () => {
            chrome.tabs.create({ url: config.url });
        });
    } else if (request.action === 'openNewTabWithPrompt') {
        const { prompt, url } = request;
        chrome.storage.local.set({ pendingPrompt: prompt }, () => {
            chrome.tabs.create({ url: url });
        });
    }
});

// Klick-Handler
chrome.contextMenus.onClicked.addListener((info, tab) => {

  // ── Text-Auswahl-Aktionen ──
  if (['ai-selection-ask', 'ai-selection-explain', 'ai-selection-translate'].includes(info.menuItemId)) {
    const selectedText = info.selectionText || '';
    if (!selectedText.trim()) return;

    if (info.menuItemId === 'ai-selection-ask') {
      // Frage stellen: zuerst Pop-Up im content.js anfordern
      chrome.tabs.sendMessage(tab.id, {
        action: 'showAskPopup',
        selectedText,
      });
    } else {
      // Direkt Prompt senden
      chrome.storage.sync.get(['toneMimic'], (result) => {
        const toneMimic = result.toneMimic || '';

        let prompt = '';
        if (info.menuItemId === 'ai-selection-explain') {
          prompt = `Du bist ein freundlicher Erklär-Experte, der komplexe Konzepte verständlich macht.\n\n**Erkläre folgenden Text auf einfache, verständliche Weise:**\n\n> ${selectedText}\n\n**Deine Aufgabe:**\n- Vereinfache technische oder schwierige Begriffe\n- Nutze Analogien und Alltagsbeispiele\n- Strukturiere die Erklärung mit Überschriften\n- Antworte auf Deutsch in Markdown-Format`;
        } else if (info.menuItemId === 'ai-selection-translate') {
          prompt = `Du bist ein Übersetzungs-Experte.\n\n**Übersetze folgenden Text:**\n\n> ${selectedText}\n\n**Anweisung:**\n- Erkenne die Ausgangssprache automatisch\n- Übersetze ins Deutsche (oder Englisch, falls der Text bereits Deutsch ist)\n- Behalte Ton, Stil und Struktur bei\n- Fachbegriffe oder Code nicht übersetzen, nur mit Erklärung\n- Antworte in Markdown-Format`;
        }

        const fullPrompt = toneMimic.trim()
          ? `${prompt}\n\nWende folgende Anweisungen zur Sprache und zum Ton an: ${toneMimic.trim()}`
          : prompt;

        getAiConfig(config => {
          if (config.type === 'local') {
            chrome.tabs.sendMessage(tab.id, {
              action: 'localLlmRequest',
              prompt: fullPrompt,
              config: config
            });
          } else {
            chrome.storage.local.set({ pendingPrompt: fullPrompt }, () => {
              chrome.tabs.create({ url: config.url });
            });
          }
        });
      });
    }
    return;
  }

  // ── Bild-Aktionen ──
  const imageUrl = info.srcUrl;
  if (!imageUrl) return;

  chrome.storage.sync.get(['selectedModel'], (result) => {
    const model = result.selectedModel || 'gemini';
    const targetUrl = MODEL_URLS[model] || MODEL_URLS.gemini;

    let prompt = '';
    let action = '';

    switch (info.menuItemId) {

      case 'ai-image-send':
        // Nur das Bild schicken, kein Text-Prompt
        action = 'imageSend';
        prompt = '';
        break;

      case 'ai-image-analyze':
        action = 'imageAnalyze';
        prompt =
          `Analysiere dieses Bild detailliert:\n${imageUrl}\n\n` +
          `Beschreibe:\n` +
          `- Was ist auf dem Bild zu sehen?\n` +
          `- Welche Objekte, Personen oder Szenen sind erkennbar?\n` +
          `- Welche Farben, Formen und Stimmungen dominieren?\n` +
          `- Gibt es Text im Bild? Wenn ja, was steht dort?\n` +
          `- Was könnte der Kontext oder Zweck des Bildes sein?\n\n` +
          `Gib eine strukturierte, ausführliche Analyse auf Deutsch.`;
        break;

      case 'ai-image-tryon':
        action = 'imageTryOn';
        prompt =
          `Du bist ein professioneller KI-Bildgenerator-Assistent.\n\n` +
          `Auf diesem Bild ist ein Kleidungsstück zu sehen:\n${imageUrl}\n\n` +
          `Deine Aufgabe:\n` +
          `Erstelle einen präzisen Bild-Generierungs-Prompt (für Imagen, DALL-E oder ähnliche Tools), ` +
          `der dieses exakte Kleidungsstück so darstellt, als würde es von mir getragen werden.\n\n` +
          `Beschreibe dazu das Kleidungsstück zunächst exakt (Typ, Farbe, Schnitt, Material, Details).\n\n` +
          `Falls du noch kein Bild von mir hast: Bitte lade jetzt ein Foto von dir hoch, ` +
          `damit ich das Kleidungsstück realistisch auf dich anpassen kann.\n\n` +
          `Sobald du ein Foto hochgeladen hast, generiere direkt ein Bild, das zeigt, ` +
          `wie dieses Kleidungsstück an dir aussieht – möglichst realistisch, ` +
          `in natürlicher Haltung, mit passendem Hintergrund.`;
        break;

      default:
        return;
    }

    // Speichere Aktion + Bild-URL + Prompt für den Injector
    chrome.storage.local.set({
      pendingImageAction: {
        action,
        imageUrl,
        prompt,
      },
    }, () => {
      chrome.tabs.create({ url: targetUrl });
    });
  });
});

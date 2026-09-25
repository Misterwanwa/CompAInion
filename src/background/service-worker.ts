/**
 * service-worker.ts / background.ts
 * Background Service Worker für CompAInion mit integriertem Autopilot-Agenten.
 * Verwaltet OpenRouter-Anfragen, Nachrichten-Routing, Screenshots und Tab-State.
 */

import { AgentCore } from '../agent/agent-core';
import { AgentConfig, DOMSnapshot } from '../types/agent';

const agentCore = new AgentCore();

// ------------------ EXTENSION LIFECYCLE ------------------

chrome.runtime.onInstalled.addListener(() => {
  console.log('[CompAInion Service Worker] Extension installed/updated.');
  initContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  initContextMenus();
});

function initContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'ai-image-parent',
      title: 'Senden an AI',
      contexts: ['image'],
    });
    chrome.contextMenus.create({
      id: 'ai-selection-parent',
      title: 'AI: Markierten Text …',
      contexts: ['selection'],
    });
  });
}

// ------------------ MESSAGE ROUTING ------------------

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. Task starten
  if (request.action === 'AGENT_START_TASK') {
    const { goal, url, model } = request;
    agentCore
      .startTask(goal, url, model)
      .then((state) => {
        updateBadge(sender.tab?.id, 'RUN');
        sendResponse({ success: true, state });
      })
      .catch((err: Error) => {
        sendResponse({ success: false, error: err.message });
      });
    return true; // async
  }

  // 2. Nächsten Schritt via LLM berechnen
  if (request.action === 'AGENT_GET_NEXT_STEP') {
    const snapshot = request.snapshot as DOMSnapshot;
    const lastObservation = request.lastObservation as string | undefined;

    agentCore
      .getNextStep(snapshot, lastObservation)
      .then(({ llmResponse, requiresConfirmation }) => {
        const state = agentCore.getState();
        if (requiresConfirmation) {
          updateBadge(sender.tab?.id, 'WAIT');
        }
        sendResponse({
          success: true,
          llmResponse,
          requiresConfirmation,
          state,
        });
      })
      .catch((err: Error) => {
        console.error('[ServiceWorker] Error in getNextStep:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // async
  }

  // 3. Ausgeführten Schritt aufzeichnen
  if (request.action === 'AGENT_RECORD_STEP') {
    agentCore
      .recordStep(request.step)
      .then((state) => {
        if (state.status === 'completed') {
          updateBadge(sender.tab?.id, 'DONE');
        }
        sendResponse({ success: true, state });
      })
      .catch((err: Error) => {
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // 4. Task-Steuerung (Stop / Pause / Resume)
  if (request.action === 'AGENT_STOP_TASK') {
    agentCore.stopTask().then((state) => {
      updateBadge(sender.tab?.id, '');
      sendResponse({ success: true, state });
    });
    return true;
  }

  if (request.action === 'AGENT_PAUSE_TASK') {
    agentCore.pauseTask().then((state) => {
      updateBadge(sender.tab?.id, 'PAUS');
      sendResponse({ success: true, state });
    });
    return true;
  }

  if (request.action === 'AGENT_RESUME_TASK') {
    agentCore.resumeTask().then((state) => {
      updateBadge(sender.tab?.id, 'RUN');
      sendResponse({ success: true, state });
    });
    return true;
  }

  // 5. OpenRouter Modelle abfragen
  if (request.action === 'AGENT_GET_MODELS') {
    agentCore
      .fetchAvailableModels()
      .then((models) => {
        sendResponse({ success: true, models });
      })
      .catch((err: Error) => {
        sendResponse({ success: false, error: err.message, models: [] });
      });
    return true;
  }

  // 6. Konfiguration speichern
  if (request.action === 'AGENT_SAVE_CONFIG') {
    agentCore.saveConfig(request.config as Partial<AgentConfig>).then((config) => {
      sendResponse({ success: true, config });
    });
    return true;
  }

  // 7. Aktuellen Status abfragen
  if (request.action === 'AGENT_GET_STATE') {
    sendResponse({ success: true, state: agentCore.getState() });
    return false;
  }

  // 8. Screenshot erfassen
  if (request.action === 'captureScreenshot') {
    chrome.tabs.captureVisibleTab({ format: 'png', quality: 90 }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, dataUrl });
      }
    });
    return true;
  }

  // 9. Kompatibilität mit bisherigen CompAInion Funktionen
  if (request.action === 'summarizeWithCloud') {
    const { prompt, config } = request;
    chrome.storage.local.set({ pendingPrompt: prompt }, () => {
      chrome.tabs.create({ url: config.url });
    });
    return false;
  }

  if (request.action === 'openNewTabWithPrompt') {
    const { prompt, url } = request;
    chrome.storage.local.set({ pendingPrompt: prompt }, () => {
      chrome.tabs.create({ url });
    });
    return false;
  }

  if (request.action === 'reloadExtension') {
    chrome.runtime.reload();
    return false;
  }

  return false;
});

// ------------------ HELPERS ------------------

function updateBadge(tabId: number | undefined, text: string): void {
  if (tabId === undefined) return;
  chrome.action.setBadgeText({ tabId, text });
  if (text === 'RUN') {
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#10b981' });
  } else if (text === 'WAIT') {
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#f59e0b' });
  } else if (text === 'PAUS') {
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#64748b' });
  } else if (text === 'DONE') {
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#3b82f6' });
  }
}

/**
 * service-worker.ts / background.ts
 * Background Service Worker für CompAInion mit integriertem Autopilot-Agenten.
 * Verwaltet OpenRouter-Anfragen, Nachrichten-Routing, Screenshots und Tab-State.
 */

import { AgentCore } from '../agent/agent-core';
import {
  AgentAction,
  AgentConfig,
  BrowserTabInfo,
  DOMSnapshot,
  TabContentSummary,
} from '../types/agent';

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
    const crossTabSummaries = request.crossTabSummaries as TabContentSummary[] | undefined;
    const availableTabs = request.availableTabs as BrowserTabInfo[] | undefined;

    agentCore
      .getNextStep(snapshot, lastObservation, crossTabSummaries, availableTabs)
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

  // 9. Tab-Liste für Multi-Tab Kontext & Automatisierung
  if (request.action === 'AGENT_GET_TABS') {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message, tabs: [] });
        return;
      }
      const valid: BrowserTabInfo[] = (tabs || [])
        .filter(
          (t) =>
            t.id !== undefined &&
            t.url &&
            !t.url.startsWith('chrome://') &&
            !t.url.startsWith('chrome-extension://') &&
            !t.url.startsWith('edge://') &&
            !t.url.startsWith('about:')
        )
        .map((t) => ({
          id: t.id as number,
          title: t.title || 'Tab',
          url: t.url as string,
          favIconUrl: t.favIconUrl,
          active: !!t.active,
          groupId: t.groupId,
        }));
      sendResponse({ success: true, tabs: valid });
    });
    return true; // async
  }

  // 10. Multi-Tab Inhalts-Extraktion (Text-Zusammenfassungen für Cross-Tab-Prompts)
  if (request.action === 'AGENT_EXTRACT_MULTI_TAB_CONTENT') {
    const tabIds = (request.tabIds || []) as number[];
    if (!tabIds.length) {
      sendResponse({ success: true, summaries: [] });
      return false;
    }

    Promise.all(
      tabIds.map(async (tabId) => {
        try {
          // 1. Erst versuchen Nachricht an existierendes Content-Script zu senden
          const direct = await new Promise<TabContentSummary | null>((resolve) => {
            chrome.tabs.sendMessage(tabId, { action: 'AGENT_GET_PAGE_SUMMARY' }, (resp) => {
              if (chrome.runtime.lastError || !resp || !resp.content) {
                resolve(null);
              } else {
                resolve({
                  tabId,
                  title: resp.title || 'Tab',
                  url: resp.url || '',
                  content: resp.content,
                });
              }
            });
          });
          if (direct) return direct;

          // 2. Fallback via scripting.executeScript
          const executed = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
              const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
                .map((h) => (h.textContent || '').trim().replace(/\s+/g, ' '))
                .filter((t) => t.length > 5)
                .slice(0, 8);

              const paras = Array.from(document.querySelectorAll('main p, article p, p'))
                .map((p) => (p.textContent || '').trim().replace(/\s+/g, ' '))
                .filter((t) => t.length > 20)
                .slice(0, 8);

              return {
                title: document.title || 'Tab',
                url: window.location.href,
                content: [...headings, ...paras].join('\n\n').substring(0, 3000),
              };
            },
          });

          if (executed && executed[0] && executed[0].result) {
            return {
              tabId,
              title: executed[0].result.title,
              url: executed[0].result.url,
              content: executed[0].result.content,
            };
          }
        } catch (err) {
          console.warn(`[ServiceWorker] Extraction failed for tab ${tabId}:`, err);
        }
        return null;
      })
    )
      .then((results) => {
        const summaries = results.filter((r): r is TabContentSummary => r !== null);
        sendResponse({ success: true, summaries });
      })
      .catch((err: Error) => {
        sendResponse({ success: false, error: err.message, summaries: [] });
      });
    return true; // async
  }

  // 11. Native Browser-Aktionen (Tab-Gruppierung, Schließen, Wechseln, Öffnen)
  if (request.action === 'AGENT_EXECUTE_BROWSER_ACTION') {
    const action = request.agentAction as AgentAction;
    executeBrowserAction(action)
      .then((res) => sendResponse(res))
      .catch((err: Error) => sendResponse({ success: false, error: err.message }));
    return true; // async
  }

  // 12. Kompatibilität mit bisherigen CompAInion Funktionen
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

async function executeBrowserAction(
  action: AgentAction
): Promise<{ success: boolean; observation: string; error?: string }> {
  try {
    switch (action.type) {
      case 'group_tabs': {
        const rawIds = action.tabIds && action.tabIds.length ? action.tabIds : [];
        let tabIds = rawIds;
        if (!tabIds.length) {
          const currentTabs = await chrome.tabs.query({ currentWindow: true });
          tabIds = currentTabs
            .filter((t) => t.id !== undefined)
            .map((t) => t.id as number);
        }
        if (!tabIds.length) {
          return { success: false, observation: 'Keine Tabs zum Gruppieren gefunden.' };
        }
        const groupId = await chrome.tabs.group({ tabIds: tabIds as [number, ...number[]] });
        if (action.groupTitle) {
          await chrome.tabGroups.update(groupId, {
            title: action.groupTitle,
            color: action.color || 'blue',
            collapsed: !!action.collapsed,
          });
        }
        return {
          success: true,
          observation: `Erfolgreich ${tabIds.length} Tabs in Gruppe "${action.groupTitle || 'Gruppe'}" (${action.color || 'blue'}) zusammengefasst.`,
        };
      }

      case 'close_tabs': {
        if (!action.tabIds || !action.tabIds.length) {
          return { success: false, observation: 'Keine Tab-IDs zum Schließen angegeben.' };
        }
        await chrome.tabs.remove(action.tabIds);
        return {
          success: true,
          observation: `Erfolgreich ${action.tabIds.length} Tab(s) geschlossen.`,
        };
      }

      case 'switch_tab': {
        await chrome.tabs.update(action.tabId, { active: true });
        return {
          success: true,
          observation: `Zu Tab #${action.tabId} gewechselt.`,
        };
      }

      case 'open_tab': {
        await chrome.tabs.create({ url: action.url, active: !!action.active });
        return {
          success: true,
          observation: `Neuer Tab mit URL "${action.url}" geöffnet.`,
        };
      }

      default:
        return {
          success: false,
          observation: `Nicht unterstützte Browser-Aktion: ${(action as any).type}`,
        };
    }
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      observation: `Fehler bei Browser-Aktion: ${error.message}`,
      error: error.message,
    };
  }
}

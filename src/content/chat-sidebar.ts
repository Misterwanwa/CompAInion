/**
 * chat-sidebar.ts
 * Handhabt die UI und Interaktionen der Autopilot Chat-Sidebar:
 * - Ein-/Ausblenden und Minimieren
 * - Durchsuchbare Modellauswahl aus OpenRouter
 * - Lokale Konfiguration des API-Keys (verstecktes Einstellungs-Panel)
 * - Anzeige des ReAct Chatverlaufs (Thought -> Action -> Observation)
 * - Interaktives Bestätigungs-Modal für sicherheitskritische Aktionen
 * - Autosuggestion-Prompt-Chips
 */

import {
  AgentAction,
  AgentConfig,
  BrowserTabInfo,
  OpenRouterModel,
  PendingConfirmation,
  TaskState,
  TaskStep,
} from '../types/agent';

export const ALL_AVAILABLE_PROMPTS = [
  { label: '📖 Zusammenfassen', prompt: 'Fasse die wichtigsten Kernaussagen dieser Seite prägnant zusammen.' },
  { label: '🔍 Deep Research', prompt: 'Führe eine tiefgehende Recherche zu den Themen auf dieser Seite durch.' },
  { label: '✅ Checkliste', prompt: 'Erstelle eine praktische Schritt-für-Schritt Checkliste aus dem Inhalt.' },
  { label: '⚖️ Vor- & Nachteile', prompt: 'Analysiere die Vor- und Nachteile der Optionen auf dieser Seite.' },
  { label: '❓ FAQ erstellen', prompt: 'Erstelle die wichtigsten FAQs mit präzisen Antworten basierend auf dieser Seite.' },
  { label: '🕵️ Seite analysieren', prompt: 'Analysiere den Aufbau, die Botschaft und den Nutzen dieser Webseite.' },
  { label: '🌐 Übersetzen', prompt: 'Übersetze die wesentlichen Inhalte dieser Seite ins Deutsche.' },
  { label: '✉️ E-Mail Entwurf', prompt: 'Formuliere einen professionellen E-Mail-Entwurf zum Thema dieser Seite.' },
  { label: '📝 Grammatik prüfen', prompt: 'Prüfe den Text auf dieser Seite auf Grammatik, Rechtschreibung und Stil.' },
  { label: '💡 3 Prompts finden', prompt: 'Schlage 3 intelligente Folgeprompts für dieses Thema vor.' },
  { label: '♿ Barrierefreiheit', prompt: 'Prüfe Barrierefreiheit, Lesbarkeit und Kontraste dieser Seite.' },
  { label: '🎯 Fakten-Check', prompt: 'Überprüfe die zentralen Aussagen und Zahlen dieser Seite auf Plausibilität.' },
  { label: '💬 Zitate extrahieren', prompt: 'Extrahiere die prägnantesten Zitate und Kernaussagen.' },
  { label: '🧠 Quiz erstellen', prompt: 'Erstelle ein 5-Fragen-Quiz zum Verständnis dieser Seite.' },
  { label: '🎯 Kernaussagen', prompt: 'Extrahiere die 3 wichtigsten Takeaways dieser Seite.' }
];

export const MULTI_TAB_PROMPTS = [
  { label: '📊 Decision Brief', prompt: 'Erstelle einen strukturierten Decision Brief mit Kernaussage, normierter Entscheidungsmatrix, Trade-offs und Empfehlung basierend auf den ausgewählten Tabs.' },
  { label: '⚖️ Tabs vergleichen', prompt: 'Vergleiche die Inhalte, Preise, Funktionen und Spezifikationen der ausgewählten Tabs in einer detaillierten Vergleichstabelle.' },
  { label: '🗂️ Tabs organisieren', prompt: 'Analysiere alle offenen Tabs und gruppiere sie thematisch in sinnvolle, farbige Chrome Tab-Gruppen (group_tabs).' },
  { label: '🏷️ Preisvergleich', prompt: 'Führe einen tabübergreifenden Preis- und Konditionenvergleich durch und ermittle das beste Angebot.' },
  { label: '📑 Multi-Zusammenfassung', prompt: 'Fasse die wichtigsten Erkenntnisse und Kernaussagen aus allen ausgewählten Tabs in einer gemeinsamen Übersicht zusammen.' },
];

export function getThreeRandomPrompts(isMultiTab = false) {
  const pool = isMultiTab ? MULTI_TAB_PROMPTS : ALL_AVAILABLE_PROMPTS;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

export interface SidebarCallbacks {
  onStartTask: (goal: string, model: string, selectedTabIds?: number[]) => void;
  onStopTask: () => void;
  onPauseTask: () => void;
  onResumeTask: () => void;
  onConfirmAction: (confirmed: boolean) => void;
  onSaveConfig: (config: Partial<AgentConfig>) => void;
}

export class ChatSidebar {
  private container: HTMLElement | null = null;
  private callbacks: SidebarCallbacks;
  private isMinimized = false;
  private isSettingsOpen = false;
  private availableModels: OpenRouterModel[] = [];
  private selectedModel = 'anthropic/claude-3.5-haiku';
  private apiKey = '';
  private currentTheme = 'aero';
  private selectedTabIds: number[] = [];
  private availableTabs: BrowserTabInfo[] = [];
  private isTabPopoverOpen = false;

  constructor(callbacks: SidebarCallbacks) {
    this.callbacks = callbacks;

    // Theme mit der Haupterweiterung synchronisieren
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['theme'], (res) => {
          if (res && (res as any).theme) {
            this.setTheme((res as any).theme);
          }
        });
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === 'sync' && changes.theme && typeof changes.theme.newValue === 'string') {
            this.setTheme(changes.theme.newValue);
          }
        });
      }
    } catch (e) {}

    if (document.body) {
      this.init();
    } else {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        const check = setInterval(() => {
          if (document.body) {
            clearInterval(check);
            this.init();
          }
        }, 30);
      }
    }
  }

  public setTheme(theme: string): void {
    this.currentTheme = theme || 'aero';
    if (this.container) {
      this.container.classList.remove('theme-aero', 'theme-retro', 'theme-apple');
      this.container.classList.add('theme-' + this.currentTheme);
    }
  }

  private init(): void {
    if (document.getElementById('compainion-agent-sidebar')) return;
    const parent = document.body || document.documentElement;
    if (!parent) return;

    this.container = document.createElement('div');
    this.container.id = 'compainion-agent-sidebar';
    this.container.className = 'is-hidden theme-' + this.currentTheme;

    const randomChips = getThreeRandomPrompts();
    const chipsHtml = randomChips
      .map(
        (c) =>
          `<span class="compainion-suggestion-chip" data-prompt="${this.escapeHtml(c.prompt)}">${this.escapeHtml(c.label)}</span>`
      )
      .join('');

    this.container.innerHTML = `
      <!-- Header -->
      <div class="compainion-sidebar-header">
        <div class="compainion-header-brand">
          <div class="compainion-brand-icon">🤖</div>
          <span class="compainion-brand-title">CompAInion Autopilot</span>
          <span class="compainion-status-badge idle" id="compainion-agent-badge">Bereit</span>
        </div>
        <div class="compainion-header-actions">
          <button class="compainion-btn-icon" id="compainion-btn-settings" title="Einstellungen / API-Key">⚙️</button>
          <button class="compainion-btn-icon" id="compainion-btn-minimize" title="Minimieren">━</button>
          <button class="compainion-btn-icon" id="compainion-btn-close" title="Schließen">✕</button>
        </div>
      </div>

      <!-- Settings Panel -->
      <div class="compainion-settings-panel" id="compainion-settings-panel">
        <div class="compainion-settings-title">OpenRouter API-Konfiguration</div>
        <div class="compainion-input-group">
          <label class="compainion-input-label" for="compainion-api-key-input">OpenRouter API-Key (sk-or-v1-...)</label>
          <div class="compainion-api-input-wrap">
            <input
              type="text"
              id="compainion-api-key-input"
              name="compainion-token-field"
              class="compainion-text-input compainion-masked-input"
              placeholder="sk-or-v1-..."
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              data-form-type="other"
            />
            <button class="compainion-btn-save" id="compainion-btn-save-key">Speichern</button>
          </div>
        </div>
      </div>

      <!-- Model Picker Bar -->
      <div class="compainion-model-bar">
        <span class="compainion-model-label">Modell:</span>
        <div class="compainion-model-select-wrapper">
          <select id="compainion-model-select" class="compainion-model-select">
            <option value="anthropic/claude-3.5-haiku">Claude 3.5 Haiku (Tokensparend & Pfeilschnell)</option>
            <option value="openai/gpt-4o-mini">GPT-4o Mini (Tokensparend & Effizient)</option>
            <option value="deepseek/deepseek-chat">DeepSeek V3 (Top-Intelligenz, Sparpreis)</option>
            <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (Astra / Multimodal)</option>
            <option value="moonshotai/kimi-k1.5">Kimi K1.5 / K3 (Ultra-Long Context)</option>
            <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet / Opus (Agenten-Präzision)</option>
            <option value="openai/gpt-4o">OpenAI GPT-4o / Luna (Reasoning-Flaggschiff)</option>
          </select>
        </div>
      </div>

      <!-- Chat / Step History Stream -->
      <div class="compainion-chat-history" id="compainion-chat-history">
        <div class="compainion-msg-card step">
          <div class="compainion-observation">
            👋 <strong>Agent aktiv</strong><br>
            Gib ein Ziel ein (z.B. "Finde die Kontaktdaten" oder "Fülle das Formular aus").
          </div>
        </div>
      </div>

      <!-- Suggestions Bar -->
      <div class="compainion-suggestions-bar">
        ${chipsHtml}
      </div>

      <!-- Context & Tab Selection Bar -->
      <div class="compainion-context-bar">
        <div class="compainion-tab-picker-wrapper">
          <button class="compainion-tab-picker-btn" id="compainion-tab-picker-btn" type="button" title="Geöffnete Tabs für Cross-Tab-Kontext & Vergleiche auswählen">
            <span class="compainion-tab-picker-icon">📑</span>
            <span class="compainion-tab-picker-label" id="compainion-tab-picker-label">1 Tab aktiv</span>
            <span class="compainion-tab-picker-arrow">▾</span>
          </button>
          <button class="compainion-tab-reset-btn" id="compainion-tab-reset-btn" type="button" title="Auf aktiven Tab zurücksetzen" style="display: none;">✕</button>

          <!-- Popover Dropdown -->
          <div class="compainion-tab-popover" id="compainion-tab-popover" style="display: none;">
            <div class="compainion-tab-popover-header">
              <span class="compainion-tab-popover-title">Tabs für Kontext auswählen</span>
              <div class="compainion-tab-popover-quick">
                <button type="button" id="compainion-tab-select-all" class="compainion-tab-quick-btn">Alle</button>
                <button type="button" id="compainion-tab-select-none" class="compainion-tab-quick-btn">Nur aktiv</button>
              </div>
            </div>
            <div class="compainion-tab-list" id="compainion-tab-list">
              <div class="compainion-tab-list-loading">Lade offene Tabs...</div>
            </div>
            <div class="compainion-tab-popover-footer">
              <span class="compainion-tab-count-hint" id="compainion-tab-count-hint">1 Tab ausgewählt</span>
              <button type="button" id="compainion-tab-popover-done" class="compainion-tab-btn-done">Fertig</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Bar -->
      <div class="compainion-input-bar">
        <textarea id="compainion-prompt-input" class="compainion-prompt-textarea" placeholder="Was soll der Agent tun? (Enter zum Senden)" rows="1"></textarea>
        <button id="compainion-btn-action" class="compainion-btn-action" title="Starten">▶</button>
      </div>
    `;

    parent.appendChild(this.container);
    this.bindEvents();
    this.loadInitialSettings();
  }

  public renderRandomChips(): void {
    if (!this.container) return;
    const bar = this.container.querySelector('.compainion-suggestions-bar');
    if (!bar) return;

    const isMultiTab = this.selectedTabIds.length > 1;
    const chips = getThreeRandomPrompts(isMultiTab);
    bar.innerHTML = chips
      .map(
        (c) =>
          `<span class="compainion-suggestion-chip" data-prompt="${this.escapeHtml(c.prompt)}">${this.escapeHtml(c.label)}</span>`
      )
      .join('');

    bar.querySelectorAll('.compainion-suggestion-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        const textarea = this.container?.querySelector('#compainion-prompt-input') as HTMLTextAreaElement;
        if (textarea && prompt) {
          textarea.value = prompt;
          textarea.focus();
        }
      });
    });
  }

  private bindEvents(): void {
    if (!this.container) return;

    // Minimize / Expand
    this.container.querySelector('#compainion-btn-minimize')?.addEventListener('click', () => {
      this.toggleMinimize();
    });

    // Close
    this.container.querySelector('#compainion-btn-close')?.addEventListener('click', () => {
      this.hide();
    });

    // Settings Toggle
    this.container.querySelector('#compainion-btn-settings')?.addEventListener('click', () => {
      this.toggleSettings();
    });

    // Tab Picker Popover Toggle
    this.container.querySelector('#compainion-tab-picker-btn')?.addEventListener('click', () => {
      this.toggleTabPopover();
    });

    // Tab Reset
    this.container.querySelector('#compainion-tab-reset-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.resetTabSelection();
    });

    // Tab Popover Done
    this.container.querySelector('#compainion-tab-popover-done')?.addEventListener('click', () => {
      this.toggleTabPopover(false);
    });

    // Tab Select All
    this.container.querySelector('#compainion-tab-select-all')?.addEventListener('click', () => {
      this.selectAllTabs();
    });

    // Tab Select Active Only
    this.container.querySelector('#compainion-tab-select-none')?.addEventListener('click', () => {
      this.resetTabSelection();
    });

    // Save API Key
    this.container.querySelector('#compainion-btn-save-key')?.addEventListener('click', () => {
      const input = this.container?.querySelector('#compainion-api-key-input') as HTMLInputElement;
      if (input) {
        this.apiKey = input.value.trim();
        this.callbacks.onSaveConfig({ openRouterApiKey: this.apiKey });
        input.value = ''; // Sofort aus dem DOM entfernen
        this.toggleSettings(false);
        this.addNotification('API-Key erfolgreich gespeichert.');
      }
    });

    // Model Change
    const modelSelect = this.container.querySelector('#compainion-model-select') as HTMLSelectElement;
    modelSelect?.addEventListener('change', () => {
      this.selectedModel = modelSelect.value;
      this.callbacks.onSaveConfig({ selectedModel: this.selectedModel });
    });

    // Suggestions Chips
    this.container.querySelectorAll('.compainion-suggestion-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        const textarea = this.container?.querySelector('#compainion-prompt-input') as HTMLTextAreaElement;
        if (textarea && prompt) {
          textarea.value = prompt;
          textarea.focus();
        }
      });
    });

    // Send / Action Button
    const actionBtn = this.container.querySelector('#compainion-btn-action') as HTMLButtonElement;
    const promptInput = this.container.querySelector('#compainion-prompt-input') as HTMLTextAreaElement;

    actionBtn?.addEventListener('click', () => {
      this.handleSendClick();
    });

    promptInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendClick();
      }
    });
  }

  private handleSendClick(): void {
    const promptInput = this.container?.querySelector('#compainion-prompt-input') as HTMLTextAreaElement;
    const actionBtn = this.container?.querySelector('#compainion-btn-action') as HTMLButtonElement;

    if (actionBtn.classList.contains('compainion-btn-stop')) {
      // Nutzer möchte laufenden Task stoppen
      this.callbacks.onStopTask();
      return;
    }

    const text = promptInput?.value.trim();
    if (!text) return;

    if (!this.apiKey) {
      this.toggleSettings(true);
      this.addNotification('⚠️ Bitte trage zuerst deinen OpenRouter API-Key ein.');
      return;
    }

    promptInput.value = '';
    this.addUserMessage(text);
    this.callbacks.onStartTask(text, this.selectedModel, this.selectedTabIds);
  }

  // ------------------ PUBLIC CONTROLS ------------------

  public getSelectedTabIds(): number[] {
    return this.selectedTabIds;
  }

  public getAvailableTabs(): BrowserTabInfo[] {
    return this.availableTabs;
  }

  public setSelectedTabIds(tabIds: number[]): void {
    this.selectedTabIds = tabIds;
    this.updateTabSelectionUI();
  }

  private toggleTabPopover(force?: boolean): void {
    const popover = this.container?.querySelector('#compainion-tab-popover') as HTMLElement;
    if (!popover) return;
    this.isTabPopoverOpen = force !== undefined ? force : !this.isTabPopoverOpen;
    popover.style.display = this.isTabPopoverOpen ? 'flex' : 'none';

    if (this.isTabPopoverOpen) {
      this.refreshTabList();
    }
  }

  private async refreshTabList(): Promise<void> {
    const listElem = this.container?.querySelector('#compainion-tab-list') as HTMLElement;
    if (!listElem) return;

    listElem.innerHTML = '<div class="compainion-tab-list-loading">Lade offene Tabs...</div>';

    try {
      chrome.runtime.sendMessage({ action: 'AGENT_GET_TABS' }, (resp) => {
        if (!resp || !resp.success || !Array.isArray(resp.tabs)) {
          listElem.innerHTML = '<div class="compainion-tab-list-loading">Tabs konnten nicht geladen werden.</div>';
          return;
        }

        this.availableTabs = resp.tabs as BrowserTabInfo[];

        // Wenn noch keine Tabs gewählt wurden, aktiven Tab als Standard setzen
        if (this.selectedTabIds.length === 0) {
          const active = this.availableTabs.find((t) => t.active);
          if (active) {
            this.selectedTabIds = [active.id];
          } else if (this.availableTabs.length > 0) {
            this.selectedTabIds = [this.availableTabs[0].id];
          }
        }

        this.renderTabList();
        this.updateTabSelectionUI();
      });
    } catch {
      listElem.innerHTML = '<div class="compainion-tab-list-loading">Fehler beim Laden.</div>';
    }
  }

  private renderTabList(): void {
    const listElem = this.container?.querySelector('#compainion-tab-list') as HTMLElement;
    if (!listElem) return;

    if (!this.availableTabs.length) {
      listElem.innerHTML = '<div class="compainion-tab-list-loading">Keine Web-Tabs geöffnet.</div>';
      return;
    }

    listElem.innerHTML = this.availableTabs
      .map((tab) => {
        const isChecked = this.selectedTabIds.includes(tab.id);
        const fav = tab.favIconUrl
          ? `<img class="compainion-tab-fav" src="${this.escapeHtml(tab.favIconUrl)}" onerror="this.style.display='none'" />`
          : '<span class="compainion-tab-fav-fallback">🌐</span>';
        const hostname = this.getHostname(tab.url);

        return `
          <label class="compainion-tab-item ${isChecked ? 'is-selected' : ''}">
            <input type="checkbox" class="compainion-tab-cb" value="${tab.id}" ${isChecked ? 'checked' : ''} />
            ${fav}
            <div class="compainion-tab-info">
              <span class="compainion-tab-title" title="${this.escapeHtml(tab.title)}">${this.escapeHtml(tab.title || 'Tab')}</span>
              <span class="compainion-tab-url">${this.escapeHtml(hostname)}</span>
            </div>
            ${tab.active ? '<span class="compainion-tab-active-tag">Aktiv</span>' : ''}
          </label>
        `;
      })
      .join('');

    listElem.querySelectorAll('.compainion-tab-cb').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const tabId = parseInt(target.value, 10);
        if (target.checked) {
          if (!this.selectedTabIds.includes(tabId)) {
            this.selectedTabIds.push(tabId);
          }
        } else {
          this.selectedTabIds = this.selectedTabIds.filter((id) => id !== tabId);
        }
        target.closest('.compainion-tab-item')?.classList.toggle('is-selected', target.checked);
        this.updateTabSelectionUI();
      });
    });
  }

  private selectAllTabs(): void {
    this.selectedTabIds = this.availableTabs.map((t) => t.id);
    this.renderTabList();
    this.updateTabSelectionUI();
  }

  private resetTabSelection(): void {
    const active = this.availableTabs.find((t) => t.active);
    this.selectedTabIds = active ? [active.id] : (this.availableTabs[0] ? [this.availableTabs[0].id] : []);
    this.renderTabList();
    this.updateTabSelectionUI();
  }

  private updateTabSelectionUI(): void {
    const label = this.container?.querySelector('#compainion-tab-picker-label') as HTMLElement;
    const btn = this.container?.querySelector('#compainion-tab-picker-btn') as HTMLElement;
    const resetBtn = this.container?.querySelector('#compainion-tab-reset-btn') as HTMLElement;
    const hint = this.container?.querySelector('#compainion-tab-count-hint') as HTMLElement;

    const count = this.selectedTabIds.length;
    if (label) {
      if (count <= 1) {
        label.textContent = '1 Tab aktiv';
      } else {
        label.textContent = `${count} Tabs aktiv (Multi-Tab)`;
      }
    }

    if (btn) {
      btn.classList.toggle('has-multi-tabs', count > 1);
    }

    if (resetBtn) {
      resetBtn.style.display = count > 1 ? 'inline-flex' : 'none';
    }

    if (hint) {
      hint.textContent = `${count} von ${this.availableTabs.length || count} Tabs gewählt`;
    }

    this.renderRandomChips();
  }

  private getHostname(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url.substring(0, 30);
    }
  }

  public show(): void {
    if (!this.container) {
      this.init();
    }
    if (!this.container) return;
    this.renderRandomChips();
    this.container.classList.remove('is-hidden');
    const promptInput = this.container.querySelector('#compainion-prompt-input') as HTMLTextAreaElement;
    promptInput?.focus();
  }

  public hide(): void {
    if (!this.container) return;
    this.container.classList.add('is-hidden');
  }

  public toggle(): void {
    if (!this.container) {
      this.init();
    }
    if (!this.container) return;
    if (this.container.classList.contains('is-hidden')) {
      this.show();
    } else {
      this.hide();
    }
  }

  public setModels(models: OpenRouterModel[]): void {
    this.availableModels = models;
    const select = this.container?.querySelector('#compainion-model-select') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '';
    models.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      if (m.id === this.selectedModel) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  }

  public getModels(): OpenRouterModel[] {
    return this.availableModels;
  }

  public updateState(state: TaskState): void {
    const badge = this.container?.querySelector('#compainion-agent-badge') as HTMLElement;
    const actionBtn = this.container?.querySelector('#compainion-btn-action') as HTMLButtonElement;

    if (!badge || !actionBtn) return;

    badge.className = `compainion-status-badge ${state.status}`;

    switch (state.status) {
      case 'running':
        badge.textContent = `Schritt ${state.currentStep}/${state.maxSteps}`;
        actionBtn.textContent = '⏹';
        actionBtn.title = 'Task anhalten';
        actionBtn.classList.add('compainion-btn-stop');
        break;

      case 'waiting_confirmation':
        badge.textContent = 'Bestätigung!';
        actionBtn.textContent = '⏸';
        actionBtn.classList.remove('compainion-btn-stop');
        break;

      case 'paused':
        badge.textContent = 'Pausiert';
        actionBtn.textContent = '▶';
        actionBtn.classList.remove('compainion-btn-stop');
        break;

      case 'completed':
        badge.textContent = 'Fertig';
        actionBtn.textContent = '▶';
        actionBtn.classList.remove('compainion-btn-stop');
        break;

      case 'error':
        badge.textContent = 'Fehler';
        actionBtn.textContent = '▶';
        actionBtn.classList.remove('compainion-btn-stop');
        break;

      default:
        badge.textContent = 'Bereit';
        actionBtn.textContent = '▶';
        actionBtn.classList.remove('compainion-btn-stop');
        break;
    }
  }

  public addStepMessage(step: TaskStep): void {
    const history = this.container?.querySelector('#compainion-chat-history');
    if (!history) return;

    const actionIcons: Record<string, string> = {
      click: '🖱️ Klick',
      type: '⌨️ Eingabe',
      scroll: '📜 Scrollen',
      navigate: '🧭 Navigation',
      wait: '⏳ Warten',
      finish: '🏁 Abschluss',
      ask_user: '❓ Frage',
      group_tabs: '🗂️ Gruppe',
      close_tabs: '🗑️ Tabs schließen',
      switch_tab: '🔀 Tab wechseln',
      open_tab: '🌐 Tab öffnen',
    };

    const actionText = this.formatActionDetails(step.action);
    const iconLabel = actionIcons[step.action.type] || '⚡ Aktion';

    const details = document.createElement('details');
    details.className = 'compainion-step-details';
    details.innerHTML = `
      <summary class="compainion-step-summary">
        <span class="compainion-step-badge">Schritt ${step.stepNumber}</span>
        <span class="compainion-step-action-desc">${iconLabel}: ${this.escapeHtml(actionText)}</span>
        <span class="compainion-step-toggle-icon">▾</span>
      </summary>
      <div class="compainion-step-code-box">
        <pre class="compainion-step-code"><code>// Aktion
Typ:         ${this.escapeHtml(step.action.type)}
Ziel/Wert:   ${this.escapeHtml(actionText)}
// Ergebnis
Beobachtung: ${this.escapeHtml(step.observation || 'Erfolgreich ausgeführt')}</code></pre>
      </div>
    `;

    history.appendChild(details);
    history.scrollTop = history.scrollHeight;
  }

  public addFinalAnswerMessage(message: string): void {
    const history = this.container?.querySelector('#compainion-chat-history');
    if (!history) return;

    const card = document.createElement('div');
    card.className = 'compainion-msg-card agent-answer';
    card.innerHTML = `
      <div class="compainion-answer-header">
        <span class="compainion-answer-title">💡 Ergebnis</span>
        <button class="compainion-copy-answer-btn" title="Ergebnis als Markdown kopieren">📋 Kopieren</button>
      </div>
      <div class="compainion-answer-body">
        ${this.formatStructuredAnswer(message)}
      </div>
    `;

    const copyBtn = card.querySelector('.compainion-copy-answer-btn') as HTMLButtonElement;
    copyBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(message);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Kopiert!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 1800);
      } catch (err) {
        console.warn('Clipboard copy failed:', err);
      }
    });

    history.appendChild(card);
    history.scrollTop = history.scrollHeight;
  }

  public showBatchLimitConfirmation(limit: number, onContinue: () => void, onStop: () => void): void {
    const history = this.container?.querySelector('#compainion-chat-history');
    if (!history) return;

    const card = document.createElement('div');
    card.className = 'compainion-confirmation-card';
    card.innerHTML = `
      <div class="compainion-confirmation-title">⏱️ ${limit} Schritte erreicht</div>
      <div class="compainion-confirmation-reason">
        Der Autopilot hat ${limit} Schritte ausgeführt. Möchtest du weitere 100 Schritte freigeben oder den Task beenden?
      </div>
      <div class="compainion-confirmation-actions">
        <button class="compainion-btn-confirm" id="btn-batch-continue">Weitere 100 Schritte freigeben</button>
        <button class="compainion-btn-reject" id="btn-batch-stop">Task beenden</button>
      </div>
    `;

    card.querySelector('#btn-batch-continue')?.addEventListener('click', () => {
      card.remove();
      onContinue();
    });

    card.querySelector('#btn-batch-stop')?.addEventListener('click', () => {
      card.remove();
      onStop();
    });

    history.appendChild(card);
    history.scrollTop = history.scrollHeight;
  }

  public formatStructuredAnswer(rawText: string): string {
    if (!rawText) return '<p>Task abgeschlossen.</p>';
    // Entferne etwaige interne Gedankenspuren ("thought:", "gedanke:")
    let cleaned = String(rawText)
      .replace(/^(thought|gedanke|analyse):\s*/i, '')
      .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
      .trim();

    // 0. Markdown-Tabellen vorab rendern
    cleaned = this.parseMarkdownTables(cleaned);

    // 1. Code-Blöcke (```)
    cleaned = cleaned.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_, _lang, code) => {
      return `<pre class="compainion-step-code"><code>${this.escapeHtml(code.trim())}</code></pre>`;
    });

    // 2. Inline-Code (`...`)
    cleaned = cleaned.replace(/`([^`]+)`/g, (_, code) => `<code>${this.escapeHtml(code)}</code>`);

    // 3. Fett / Kursiv
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 4. Überschriften
    cleaned = cleaned.replace(/^### (.*$)/gim, '<h4 style="margin: 8px 0 4px 0; font-size: 13px; font-weight: 700; color: inherit;">$1</h4>');
    cleaned = cleaned.replace(/^## (.*$)/gim, '<h3 style="margin: 10px 0 6px 0; font-size: 14px; font-weight: 700; color: inherit;">$1</h3>');

    // 5. Listenaufzählungen
    const lines = cleaned.split('\n');
    let inList = false;
    const formattedLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('<div class="compainion-table-wrapper">') || trimmed.includes('compainion-table')) {
        if (inList) {
          formattedLines.push('</ul>');
          inList = false;
        }
        formattedLines.push(trimmed);
        continue;
      }
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
      const isNumbered = /^\d+\.\s/.test(trimmed);

      if (isBullet || isNumbered) {
        if (!inList) {
          formattedLines.push('<ul>');
          inList = true;
        }
        const itemText = isBullet ? trimmed.substring(2) : trimmed.replace(/^\d+\.\s/, '');
        formattedLines.push(`<li>${itemText}</li>`);
      } else {
        if (inList) {
          formattedLines.push('</ul>');
          inList = false;
        }
        if (trimmed.length > 0) {
          formattedLines.push(`<p>${trimmed}</p>`);
        }
      }
    }
    if (inList) formattedLines.push('</ul>');

    return formattedLines.join('');
  }

  private parseMarkdownTables(text: string): string {
    const tableRegex = /((?:^[ \t]*\|[^\n]+\|[ \t]*\r?\n){2,})/gm;
    return text.replace(tableRegex, (match) => {
      const rows = match
        .trim()
        .split(/\r?\n/)
        .map((r) => r.trim())
        .filter(Boolean);
      if (rows.length < 2) return match;

      // Header row
      const headerCells = rows[0]
        .split('|')
        .slice(1, -1)
        .map((c) => this.escapeHtml(c.trim()));

      // Separator row (must contain dashes)
      if (!rows[1].includes('-')) return match;

      const bodyRows = rows.slice(2);
      let tableHtml = '<div class="compainion-table-wrapper"><table class="compainion-table"><thead><tr>';
      headerCells.forEach((h) => {
        tableHtml += `<th>${h}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';

      bodyRows.forEach((row) => {
        const cells = row
          .split('|')
          .slice(1, -1)
          .map((c) => this.escapeHtml(c.trim()));
        tableHtml += '<tr>';
        cells.forEach((c) => {
          tableHtml += `<td>${c}</td>`;
        });
        tableHtml += '</tr>';
      });

      tableHtml += '</tbody></table></div>';
      return `\n${tableHtml}\n`;
    });
  }

  public showConfirmationDialog(confirmation: PendingConfirmation): void {
    const history = this.container?.querySelector('#compainion-chat-history');
    if (!history) return;

    const card = document.createElement('div');
    card.className = 'compainion-confirmation-card';
    card.id = 'compainion-pending-confirmation';
    card.innerHTML = `
      <div class="compainion-confirmation-title">
        ⚠️ Sicherheitsbestätigung erforderlich
      </div>
      <div class="compainion-confirmation-reason">
        ${this.escapeHtml(confirmation.reason)}
      </div>
      <div class="compainion-confirmation-actions">
        <button class="compainion-btn-confirm" id="compainion-btn-confirm-yes">Aktion bestätigen</button>
        <button class="compainion-btn-reject" id="compainion-btn-confirm-no">Abbrechen</button>
      </div>
    `;

    card.querySelector('#compainion-btn-confirm-yes')?.addEventListener('click', () => {
      card.remove();
      this.callbacks.onConfirmAction(true);
    });

    card.querySelector('#compainion-btn-confirm-no')?.addEventListener('click', () => {
      card.remove();
      this.callbacks.onConfirmAction(false);
    });

    history.appendChild(card);
    history.scrollTop = history.scrollHeight;
  }

  public addUserMessage(text: string): void {
    const history = this.container?.querySelector('#compainion-chat-history');
    if (!history) return;

    const msg = document.createElement('div');
    msg.className = 'compainion-msg-card user';
    msg.textContent = text;
    history.appendChild(msg);
    history.scrollTop = history.scrollHeight;
  }

  public addNotification(text: string): void {
    const history = this.container?.querySelector('#compainion-chat-history');
    if (!history) return;

    const msg = document.createElement('div');
    msg.className = 'compainion-msg-card step';
    msg.innerHTML = `<div class="compainion-observation">${this.escapeHtml(text)}</div>`;
    history.appendChild(msg);
    history.scrollTop = history.scrollHeight;
  }

  // ------------------ HELPERS ------------------

  private toggleMinimize(): void {
    if (!this.container) return;
    this.isMinimized = !this.isMinimized;
    this.container.classList.toggle('is-minimized', this.isMinimized);
    const minBtn = this.container.querySelector('#compainion-btn-minimize');
    if (minBtn) minBtn.textContent = this.isMinimized ? '□' : '━';
  }

  private toggleSettings(force?: boolean): void {
    const panel = this.container?.querySelector('#compainion-settings-panel');
    if (!panel) return;
    this.isSettingsOpen = force !== undefined ? force : !this.isSettingsOpen;
    panel.classList.toggle('is-open', this.isSettingsOpen);

    // API Key nur im DOM halten, solange das Einstellungs-Panel sichtbar ist
    const input = this.container?.querySelector('#compainion-api-key-input') as HTMLInputElement;
    if (input) {
      if (this.isSettingsOpen) {
        input.value = this.apiKey;
        input.focus();
      } else {
        input.value = '';
      }
    }
  }

  private loadInitialSettings(): void {
    chrome.storage.local.get(['agentOpenRouterApiKey', 'agentSelectedModel'], (items) => {
      const res = items as Record<string, any>;
      if (typeof res.agentOpenRouterApiKey === 'string' && res.agentOpenRouterApiKey) {
        this.apiKey = res.agentOpenRouterApiKey;
        // WICHTIG: Nicht sofort ins DOM schreiben, damit kein Password-Manager anspringt!
      }
      if (typeof res.agentSelectedModel === 'string' && res.agentSelectedModel) {
        this.selectedModel = res.agentSelectedModel;
        const select = this.container?.querySelector('#compainion-model-select') as HTMLSelectElement;
        if (select) select.value = this.selectedModel;
      }
    });
  }

  private formatActionDetails(action: AgentAction): string {
    switch (action.type) {
      case 'click':
        return action.selector;
      case 'type':
        return `"${action.text}" in ${action.selector}`;
      case 'scroll':
        return `${action.direction || 'down'} (${action.distance || 500}px)`;
      case 'navigate':
        return action.url;
      case 'wait':
        return `${action.durationMs || 1000}ms`;
      case 'finish':
        return action.message;
      case 'ask_user':
        return action.question;
      case 'group_tabs':
        return `Tab-Gruppe "${action.groupTitle}" (${(action.tabIds || []).length} Tabs)`;
      case 'close_tabs':
        return `${action.tabIds.length} Tab(s) schließen (${action.reason || 'Bereinigung'})`;
      case 'switch_tab':
        return `Wechsel zu Tab #${action.tabId}`;
      case 'open_tab':
        return `Öffne URL: ${action.url}`;
      default:
        return '';
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

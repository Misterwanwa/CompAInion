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

export function getThreeRandomPrompts() {
  const shuffled = [...ALL_AVAILABLE_PROMPTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

export interface SidebarCallbacks {
  onStartTask: (goal: string, model: string) => void;
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
            <input type="password" id="compainion-api-key-input" class="compainion-text-input" placeholder="sk-or-v1-..." />
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

    const randomChips = getThreeRandomPrompts();
    bar.innerHTML = randomChips
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

    // Save API Key
    this.container.querySelector('#compainion-btn-save-key')?.addEventListener('click', () => {
      const input = this.container?.querySelector('#compainion-api-key-input') as HTMLInputElement;
      if (input) {
        this.apiKey = input.value.trim();
        this.callbacks.onSaveConfig({ openRouterApiKey: this.apiKey });
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
    this.callbacks.onStartTask(text, this.selectedModel);
  }

  // ------------------ PUBLIC CONTROLS ------------------

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
      type: '⌨️ Tippen',
      scroll: '📜 Scrollen',
      navigate: '🧭 Navigation',
      wait: '⏳ Warten',
      finish: '🏁 Abschluss',
      ask_user: '❓ Nutzerfrage',
    };

    const actionText = this.formatActionDetails(step.action);

    const stepCard = document.createElement('div');
    stepCard.className = 'compainion-msg-card step';
    stepCard.innerHTML = `
      <div class="compainion-step-header">
        <span>Schritt ${step.stepNumber}</span>
      </div>
      <div class="compainion-thought-bubble">
        ${this.escapeHtml(step.thought)}
      </div>
      <div class="compainion-action-badge">
        ${actionIcons[step.action.type] || '⚡ Aktion'}: ${this.escapeHtml(actionText)}
      </div>
      ${step.observation ? `<div class="compainion-observation">${this.escapeHtml(step.observation)}</div>` : ''}
    `;

    history.appendChild(stepCard);
    history.scrollTop = history.scrollHeight;
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
  }

  private loadInitialSettings(): void {
    chrome.storage.local.get(['agentOpenRouterApiKey', 'agentSelectedModel'], (items) => {
      const res = items as Record<string, any>;
      if (typeof res.agentOpenRouterApiKey === 'string' && res.agentOpenRouterApiKey) {
        this.apiKey = res.agentOpenRouterApiKey;
        const input = this.container?.querySelector('#compainion-api-key-input') as HTMLInputElement;
        if (input) input.value = this.apiKey;
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

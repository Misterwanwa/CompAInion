/**
 * agent-core.ts
 * Kernlogik des Autopiloten: OpenRouter-Kommunikation, ReAct-Steuerung,
 * Sicherheitsprüfungen, Retry mit Exponential Backoff & State-Management.
 */

import {
  AgentAction,
  AgentConfig,
  DOMSnapshot,
  isLLMResponse,
  LLMResponse,
  OpenRouterModel,
  PendingConfirmation,
  TaskState,
  TaskStep,
} from '../types/agent';
import { AGENT_SYSTEM_PROMPT, buildUserPrompt } from './prompt-template';

const DEFAULT_MODEL = 'anthropic/claude-3.5-haiku';
const MAX_DEFAULT_STEPS = 30;
const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';

// Schlüsselwörter für destruktive Aktionen
const DESTRUCTIVE_KEYWORDS = [
  'kaufen',
  'bestellen',
  'kostenpflichtig',
  'zahlungspflichtig',
  'checkout',
  'purchase',
  'buy',
  'order',
  'delete',
  'löschen',
  'entfernen',
  'kündigen',
  'pay',
  'bezahlen',
  'abonnieren',
  'subscribe',
];

// Sensible Domains, die vor Navigation eine Bestätigung verlangen
const SENSITIVE_DOMAINS = [
  'paypal.com',
  'stripe.com',
  'bank',
  'sparkasse.de',
  'postbank.de',
  'dkb.de',
  'ing.de',
  'klarna.com',
  'checkout.shopify.com',
  'amazon.de/gp/buy',
  'amazon.com/gp/buy',
];

export class AgentCore {
  private config: AgentConfig = {
    openRouterApiKey: '',
    selectedModel: DEFAULT_MODEL,
    maxSteps: MAX_DEFAULT_STEPS,
    autoConfirmSafeActions: true,
    highlightActions: true,
  };

  private currentState: TaskState | null = null;
  private abortController: AbortController | null = null;

  constructor() {
    this.loadConfig();
    this.loadState();
  }

  // ------------------ CONFIG & STATE PERSISTENCE ------------------

  public async loadConfig(): Promise<AgentConfig> {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        [
          'agentOpenRouterApiKey',
          'agentSelectedModel',
          'agentMaxSteps',
          'agentAutoConfirm',
          'agentHighlightActions',
        ],
        (items) => {
          const result = items as Record<string, any>;
          this.config = {
            openRouterApiKey: (typeof result.agentOpenRouterApiKey === 'string' ? result.agentOpenRouterApiKey : ''),
            selectedModel: (typeof result.agentSelectedModel === 'string' ? result.agentSelectedModel : DEFAULT_MODEL),
            maxSteps: (typeof result.agentMaxSteps === 'number' ? result.agentMaxSteps : MAX_DEFAULT_STEPS),
            autoConfirmSafeActions: result.agentAutoConfirm !== false,
            highlightActions: result.agentHighlightActions !== false,
          };
          resolve(this.config);
        }
      );
    });
  }

  public async saveConfig(partial: Partial<AgentConfig>): Promise<AgentConfig> {
    this.config = { ...this.config, ...partial };
    return new Promise((resolve) => {
      chrome.storage.local.set(
        {
          agentOpenRouterApiKey: this.config.openRouterApiKey,
          agentSelectedModel: this.config.selectedModel,
          agentMaxSteps: this.config.maxSteps,
          agentAutoConfirm: this.config.autoConfirmSafeActions,
          agentHighlightActions: this.config.highlightActions,
        },
        () => resolve(this.config)
      );
    });
  }

  public async loadState(): Promise<TaskState | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['agentTaskState'], (items) => {
        const result = items as Record<string, any>;
        this.currentState = (result.agentTaskState as TaskState) || null;
        resolve(this.currentState);
      });
    });
  }

  public async saveState(state: TaskState | null): Promise<void> {
    this.currentState = state;
    return new Promise((resolve) => {
      chrome.storage.local.set({ agentTaskState: state }, () => resolve());
    });
  }

  public getState(): TaskState | null {
    return this.currentState;
  }

  // ------------------ OPENROUTER API & MODEL LIST ------------------

  public async fetchAvailableModels(): Promise<OpenRouterModel[]> {
    try {
      const resp = await fetch(`${OPENROUTER_API_BASE}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/Misterwanwa/CompAInion',
          'X-Title': 'CompAInion Autopilot',
        },
      });

      if (!resp.ok) {
        throw new Error(`OpenRouter HTTP ${resp.status}: ${resp.statusText}`);
      }

      const data = await resp.json();
      if (!data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.map((m: Record<string, unknown>) => ({
        id: String(m.id || ''),
        name: String(m.name || m.id || ''),
        description: typeof m.description === 'string' ? m.description : undefined,
        context_length: typeof m.context_length === 'number' ? m.context_length : undefined,
      }));
    } catch (err) {
      console.error('[AgentCore] Error fetching models:', err);
      // Fallback-Modelle falls Offline oder kein Key
      return [
        { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku (Tokensparend & Pfeilschnell)' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (Tokensparend & Effizient)' },
        { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Top-Intelligenz, Sparpreis)' },
        { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (Astra / Multimodal)' },
        { id: 'moonshotai/kimi-k1.5', name: 'Kimi K1.5 / K3 (Ultra-Long Context)' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet / Opus (Agenten-Präzision)' },
        { id: 'openai/gpt-4o', name: 'OpenAI GPT-4o / Luna (Reasoning-Flaggschiff)' },
      ];
    }
  }

  // ------------------ TASK LIFECYCLE ------------------

  public async startTask(goal: string, currentUrl: string, modelOverride?: string): Promise<TaskState> {
    await this.loadConfig();

    if (!this.config.openRouterApiKey.trim()) {
      throw new Error('Bitte hinterlege zuerst deinen OpenRouter API-Key in den Sidebar-Einstellungen.');
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const model = modelOverride || this.config.selectedModel || DEFAULT_MODEL;

    const newState: TaskState = {
      taskId,
      status: 'running',
      goal,
      model,
      currentStep: 0,
      maxSteps: this.config.maxSteps,
      currentUrl,
      steps: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.saveState(newState);
    return newState;
  }

  public async stopTask(reason: string = 'Vom Nutzer gestoppt'): Promise<TaskState | null> {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (!this.currentState) return null;

    this.currentState.status = 'idle';
    this.currentState.error = reason;
    this.currentState.updatedAt = Date.now();
    await this.saveState(this.currentState);
    return this.currentState;
  }

  public async pauseTask(): Promise<TaskState | null> {
    if (!this.currentState) return null;
    this.currentState.status = 'paused';
    this.currentState.updatedAt = Date.now();
    await this.saveState(this.currentState);
    return this.currentState;
  }

  public async resumeTask(): Promise<TaskState | null> {
    if (!this.currentState) return null;
    this.currentState.status = 'running';
    this.currentState.updatedAt = Date.now();
    await this.saveState(this.currentState);
    return this.currentState;
  }

  // ------------------ LLM REASONING LOOP STEP ------------------

  /**
   * Fordert das LLM auf, basierend auf dem Snapshot und der Historie die nächste Aktion zu bestimmen.
   */
  public async getNextStep(
    snapshot: DOMSnapshot,
    lastObservation?: string
  ): Promise<{ llmResponse: LLMResponse; requiresConfirmation?: PendingConfirmation }> {
    if (!this.currentState) {
      throw new Error('Kein aktiver Task vorhanden.');
    }

    // Loop-Schutz: Maximale Schritte prüfen
    if (this.currentState.currentStep >= this.currentState.maxSteps) {
      const finishResp: LLMResponse = {
        thought: `Maximales Schritt-Limit (${this.currentState.maxSteps}) erreicht. Breche zur Sicherheit ab.`,
        action: {
          type: 'finish',
          message: `Das Limit von ${this.currentState.maxSteps} Schritten wurde erreicht. Bitte prüfe das Ergebnis manuell.`,
          success: false,
        },
        isFinal: true,
      };
      return { llmResponse: finishResp };
    }

    // Snapshot formatieren für LLM
    const formattedSnapshot = this.formatSnapshotForPrompt(snapshot);
    const historySummary = this.formatHistory(this.currentState.steps);

    const userPrompt = buildUserPrompt({
      goal: this.currentState.goal,
      stepNumber: this.currentState.currentStep + 1,
      maxSteps: this.currentState.maxSteps,
      currentUrl: snapshot.url,
      historySummary,
      domSnapshotText: formattedSnapshot,
      lastObservation,
    });

    // LLM Anfrage mit Retry-Mechanismus
    const llmResponse = await this.callOpenRouterWithRetry(userPrompt);

    // Sicherheitsprüfung auf destruktive Aktionen oder sensible Domains
    const confirmation = this.checkSafetyConstraints(llmResponse.action, snapshot);

    return {
      llmResponse,
      requiresConfirmation: confirmation || undefined,
    };
  }

  /**
   * Protokolliert einen ausgeführten Schritt im Task-State
   */
  public async recordStep(
    step: Omit<TaskStep, 'stepNumber' | 'timestamp'>
  ): Promise<TaskState> {
    if (!this.currentState) {
      throw new Error('Kein aktiver Task zum Protokollieren.');
    }

    const stepNumber = this.currentState.currentStep + 1;
    const recordedStep: TaskStep = {
      ...step,
      stepNumber,
      timestamp: Date.now(),
    };

    this.currentState.steps.push(recordedStep);
    this.currentState.currentStep = stepNumber;
    this.currentState.updatedAt = Date.now();

    if (step.action.type === 'finish') {
      this.currentState.status = 'completed';
    }

    await this.saveState(this.currentState);
    return this.currentState;
  }

  // ------------------ SAFETY & GUARDS ------------------

  public checkSafetyConstraints(action: AgentAction, snapshot: DOMSnapshot): PendingConfirmation | null {
    // 1. Navigation zu sensiblen Domains
    if (action.type === 'navigate') {
      const lowerUrl = action.url.toLowerCase();
      const isSensitive = SENSITIVE_DOMAINS.some((domain) => lowerUrl.includes(domain));
      if (isSensitive) {
        return {
          action,
          reason: `Navigation zu einer sicherheitsrelevanten Domain erkannt (${action.url}).`,
          riskLevel: 'high',
        };
      }
    }

    // 2. Destruktive Klicks (Kaufen, Bestellen, Löschen)
    if (action.type === 'click') {
      const targetElem = snapshot.elements.find((el) => {
        if (el.selector === action.selector) return true;
        if (el.id === action.selector.replace(/[[\]'"]/g, '')) return true;
        return false;
      });

      const combinedText = [
        targetElem?.text || '',
        targetElem?.ariaLabel || '',
        targetElem?.name || '',
        action.selector,
      ]
        .join(' ')
        .toLowerCase();

      const matchedKeyword = DESTRUCTIVE_KEYWORDS.find((kw) => combinedText.includes(kw));
      if (matchedKeyword) {
        return {
          action,
          reason: `Mögliche sicherheitskritische Aktion erkannt (${matchedKeyword.toUpperCase()}) auf: "${targetElem?.text || action.selector}"`,
          riskLevel: 'high',
        };
      }
    }

    // 3. Typen in Passwort- oder Zahlungsfelder
    if (action.type === 'type') {
      const targetElem = snapshot.elements.find((el) => el.selector === action.selector);
      if (targetElem?.type === 'password' || targetElem?.name?.toLowerCase().includes('card')) {
        return {
          action,
          reason: 'Eingabe in ein sensibles Feld (Passwort / Kreditkarte) erfordert Bestätigung.',
          riskLevel: 'high',
        };
      }
    }

    return null;
  }

  // ------------------ OPENROUTER API CALL MIT EXPONENTIAL BACKOFF ------------------

  private async callOpenRouterWithRetry(
    userPrompt: string,
    maxRetries = 3
  ): Promise<LLMResponse> {
    let attempt = 0;
    let delay = 1000; // 1s Basis-Verzögerung

    while (attempt < maxRetries) {
      attempt++;
      try {
        this.abortController = new AbortController();
        const timeoutId = setTimeout(() => this.abortController?.abort(), 45000); // 45s Timeout

        const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.openRouterApiKey.trim()}`,
            'HTTP-Referer': 'https://github.com/Misterwanwa/CompAInion',
            'X-Title': 'CompAInion Autopilot',
          },
          body: JSON.stringify({
            model: this.currentState?.model || this.config.selectedModel,
            messages: [
              { role: 'system', content: AGENT_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
            max_tokens: 1000,
          }),
          signal: this.abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errBody = await response.text();
          // Rate-Limit (429) oder temporärer Serverfehler (5xx) -> Backoff
          if (response.status === 429 || response.status >= 500) {
            console.warn(`[AgentCore] OpenRouter HTTP ${response.status}. Retry in ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
            delay *= 2;
            continue;
          }
          throw new Error(`OpenRouter API Fehler (${response.status}): ${errBody}`);
        }

        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (!rawContent) {
          throw new Error('Leere Antwort vom OpenRouter Modell erhalten.');
        }

        const parsed = this.cleanAndParseJSON(rawContent);
        if (!isLLMResponse(parsed)) {
          throw new Error(`LLM Antwort entspricht nicht dem geforderten Schema: ${rawContent.substring(0, 200)}...`);
        }

        return parsed;
      } catch (err: unknown) {
        const error = err as Error;
        console.warn(`[AgentCore] Versuch ${attempt}/${maxRetries} fehlgeschlagen:`, error.message);

        if (attempt >= maxRetries) {
          throw new Error(`OpenRouter Anfrage nach ${maxRetries} Versuchen fehlgeschlagen: ${error.message}`);
        }

        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      }
    }

    throw new Error('Unbekannter Fehler beim Aufruf von OpenRouter.');
  }

  // ------------------ HELPERS ------------------

  private cleanAndParseJSON(raw: string): unknown {
    let cleaned = raw.trim();
    // Falls das LLM Markdown Backticks hinzugefügt hat
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    return JSON.parse(cleaned);
  }

  private formatSnapshotForPrompt(snapshot: DOMSnapshot): string {
    const parts: string[] = [
      `Titel: "${snapshot.title}"`,
      `URL: ${snapshot.url}`,
      `Viewport: ${snapshot.viewport.width}x${snapshot.viewport.height} (ScrollY: ${snapshot.viewport.scrollY}px)`,
      `\nInteraktive Elemente auf der Seite:`,
    ];

    snapshot.elements.forEach((el) => {
      const details = [
        el.tagName,
        el.type ? `type="${el.type}"` : null,
        el.role ? `role="${el.role}"` : null,
        el.text ? `text="${el.text}"` : null,
        el.placeholder ? `placeholder="${el.placeholder}"` : null,
        el.name ? `name="${el.name}"` : null,
        el.ariaLabel ? `aria-label="${el.ariaLabel}"` : null,
        el.href ? `href="${el.href}"` : null,
      ]
        .filter(Boolean)
        .join(' | ');

      parts.push(`- [data-agent-id="${el.id}"] | Selector: ${el.selector} | (${details})`);
    });

    if (snapshot.textSummary) {
      parts.push(`\nSeitentext-Auszug:\n${snapshot.textSummary}`);
    }

    return parts.join('\n');
  }

  private formatHistory(steps: TaskStep[]): string {
    if (!steps.length) return '';
    return steps
      .slice(-6) // Nur die letzten 6 Schritte für Context Window Effizienz
      .map((s) => {
        const actionStr = JSON.stringify(s.action);
        return `Schritt ${s.stepNumber}:\n  Gedanke: ${s.thought}\n  Aktion: ${actionStr}\n  Beobachtung: ${s.observation || (s.error ? `FEHLER: ${s.error}` : 'Erfolgreich ausgeführt')}`;
      })
      .join('\n\n');
  }
}

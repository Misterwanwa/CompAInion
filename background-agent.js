/**
 * background-agent.js
 * OpenRouter-Kommunikation, ReAct-Steuerung, Sicherheitsschranken und
 * Task-State-Management für den CompAInion Autopilot im Background Service Worker.
 */

'use strict';

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'anthropic/claude-3.5-haiku';

const AGENT_SYSTEM_PROMPT = `Du bist CompAInion Autopilot, ein hochpräziser autonomer Web-Agent.
Deine Aufgabe ist es, Benutzeranweisungen auf der aktuellen Webseite Schritt für Schritt durch Browser-Aktionen zu erfüllen.

### RE-ACT MUSTER (Thought -> Action -> Observation)
In jedem Schritt analysierst du:
1. Das ursprüngliche Ziel des Nutzers.
2. Den bisherigen Verlauf (ausgeführte Aktionen und Beobachtungen).
3. Den aktuellen DOM-Snapshot (Titel, URL, interaktive Elemente mit stabilen Selektoren und IDs).
4. Du formulierst deinen Gedanken ("thought") und wählst EXAKT EINE logische nächste Aktion ("action").

### VERFÜGBARES TOOL-SET (JSON Actions):
1. **click**: Klickt ein Element an.
   {"type": "click", "selector": "#search-button"}
2. **type**: Schreibt Text in ein Eingabefeld.
   {"type": "type", "selector": "input[name='q']", "text": "Suchbegriff", "pressEnter": true, "clearFirst": true}
3. **scroll**: Scrollt die Seite oder ein Element.
   {"type": "scroll", "direction": "down", "distance": 600}
4. **navigate**: Navigiert zu einer neuen URL.
   {"type": "navigate", "url": "https://example.com"}
5. **wait**: Wartet kurz (z.B. auf asynchrones Nachladen).
   {"type": "wait", "durationMs": 1500}
6. **ask_user**: Fragt den Benutzer nach einer Klärung oder Anmeldedaten.
   {"type": "ask_user", "question": "Welche Option bevorzugst du?"}
7. **finish**: Beendet den Task erfolgreich oder mit Begründung.
   {"type": "finish", "message": "Zusammenfassung des Ergebnisses", "success": true}

### SICHERHEITS- & BETRIEBSREGELN:
1. **Destruktive Aktionen**: Klicke NIEMALS unbedacht auf Kauf-, Bezahl- oder Löschbuttons ("Kaufen", "Bestellen", "Delete", "Confirm Payment").
2. **Selektoren**: Nutze die stabilen Selektoren aus dem DOM-Snapshot (vorrangig [data-agent-id="..."], ID oder name).
3. **Keine Endlosschleifen**: Maximal 30 Schritte.

### ANTWORT-FORMAT:
Du MUSST ausnahmslos in validem JSON antworten (keine Markdown-Backticks außerhalb).
Schema:
{
  "thought": "Prägnante Analyse und Begründung.",
  "action": {
    "type": "click" | "type" | "scroll" | "navigate" | "wait" | "finish" | "ask_user",
    "selector": "CSS-Selektor",
    "text": "Eingabetext (nur bei type)",
    "pressEnter": true,
    "clearFirst": true,
    "direction": "down",
    "distance": 500,
    "url": "https://...",
    "durationMs": 1000,
    "message": "Ergebnis",
    "success": true,
    "question": "Frage"
  },
  "isFinal": false,
  "finalMessage": null
}`;

const DESTRUCTIVE_KEYWORDS = [
  'kaufen', 'bestellen', 'kostenpflichtig', 'zahlungspflichtig',
  'checkout', 'purchase', 'buy', 'order', 'delete', 'löschen',
  'pay', 'bezahlen', 'abonnieren', 'subscribe'
];

const SENSITIVE_DOMAINS = [
  'paypal.com', 'stripe.com', 'sparkasse.de', 'postbank.de',
  'dkb.de', 'ing.de', 'klarna.com'
];

class BackgroundAgentManager {
  constructor() {
    this.currentState = null;
    this.loadState();
  }

  loadState() {
    chrome.storage.local.get(['agentTaskState'], (res) => {
      this.currentState = res.agentTaskState || null;
    });
  }

  saveState(state) {
    this.currentState = state;
    chrome.storage.local.set({ agentTaskState: state });
  }

  async startTask(goal, url, model) {
    const config = await this.getConfig();
    if (!config.apiKey) {
      throw new Error('Bitte hinterlege deinen OpenRouter API-Key in den Sidebar-Einstellungen.');
    }

    const state = {
      taskId: `task_${Date.now()}`,
      status: 'running',
      goal,
      model: model || config.model || DEFAULT_MODEL,
      currentStep: 0,
      maxSteps: 30,
      currentUrl: url,
      steps: [],
      createdAt: Date.now(),
    };

    this.saveState(state);
    return state;
  }

  async stopTask() {
    if (!this.currentState) return null;
    this.currentState.status = 'idle';
    this.saveState(this.currentState);
    return this.currentState;
  }

  async recordStep(step) {
    if (!this.currentState) return null;
    const stepNumber = this.currentState.currentStep + 1;
    this.currentState.steps.push({
      ...step,
      stepNumber,
      timestamp: Date.now(),
    });
    this.currentState.currentStep = stepNumber;
    if (step.action && step.action.type === 'finish') {
      this.currentState.status = 'completed';
    }
    this.saveState(this.currentState);
    return this.currentState;
  }

  async getNextStep(snapshot, lastObservation) {
    if (!this.currentState) {
      throw new Error('Kein aktiver Task vorhanden.');
    }

    const config = await this.getConfig();
    const prompt = this.buildPrompt(this.currentState, snapshot, lastObservation);

    const llmResponse = await this.callOpenRouterWithRetry(config.apiKey, this.currentState.model, prompt);
    const requiresConfirmation = this.checkSafety(llmResponse.action, snapshot);

    return { llmResponse, requiresConfirmation };
  }

  checkSafety(action, snapshot) {
    if (!action) return null;

    if (action.type === 'navigate' && action.url) {
      const lower = action.url.toLowerCase();
      if (SENSITIVE_DOMAINS.some(d => lower.includes(d))) {
        return {
          action,
          reason: `Navigation zu sicherheitsrelevanter Domain: ${action.url}`,
          riskLevel: 'high',
        };
      }
    }

    if (action.type === 'click' && action.selector) {
      const el = (snapshot.elements || []).find(e => e.selector === action.selector || e.id === action.selector);
      const text = `${el?.text || ''} ${el?.ariaLabel || ''} ${action.selector}`.toLowerCase();
      const kw = DESTRUCTIVE_KEYWORDS.find(k => text.includes(k));
      if (kw) {
        return {
          action,
          reason: `Möglicherweise kostenpflichtige oder destruktive Aktion erkannt (${kw.toUpperCase()}): "${el?.text || action.selector}"`,
          riskLevel: 'high',
        };
      }
    }

    if (action.type === 'type' && action.selector) {
      const el = (snapshot.elements || []).find(e => e.selector === action.selector);
      if (el?.type === 'password' || (el?.name && el.name.toLowerCase().includes('card'))) {
        return {
          action,
          reason: 'Eingabe in ein Passwort- oder Zahlungsfeld erfordert deine Bestätigung.',
          riskLevel: 'high',
        };
      }
    }

    return null;
  }

  buildPrompt(state, snapshot, lastObservation) {
    const formattedElements = (snapshot.elements || []).map(el => {
      const parts = [
        el.tagName,
        el.type ? `type="${el.type}"` : null,
        el.text ? `text="${el.text}"` : null,
        el.placeholder ? `placeholder="${el.placeholder}"` : null,
        el.name ? `name="${el.name}"` : null,
      ].filter(Boolean).join(' | ');
      return `- [data-agent-id="${el.id}"] | Selector: ${el.selector} | (${parts})`;
    }).join('\n');

    const historyText = (state.steps || []).slice(-5).map(s => {
      return `Schritt ${s.stepNumber}:\n  Gedanke: ${s.thought}\n  Aktion: ${JSON.stringify(s.action)}\n  Beobachtung: ${s.observation || 'OK'}`;
    }).join('\n\n');

    return `### ZIEL DES NUTZERS:
"${state.goal}"

### STATUS:
- Schritt: ${state.currentStep + 1} von max. ${state.maxSteps}
- Aktuelle URL: ${snapshot.url}

### BISHERIGER VERLAUF:
${historyText || 'Noch keine vorherigen Schritte.'}

${lastObservation ? `### LETZTE BEOBACHTUNG:\n${lastObservation}\n` : ''}

### INTERAKTIVE ELEMENTE AUF DER SEITE:
${formattedElements}

${snapshot.textSummary ? `### SEITENTEXT-AUSZUG:\n${snapshot.textSummary}\n` : ''}

Antworte ausschließlich im definierten JSON-Format.`;
  }

  async callOpenRouterWithRetry(apiKey, model, userPrompt, maxRetries = 3) {
    let attempt = 0;
    let delay = 1000;

    while (attempt < maxRetries) {
      attempt++;
      try {
        const resp = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://github.com/Misterwanwa/CompAInion',
            'X-Title': 'CompAInion Autopilot',
          },
          body: JSON.stringify({
            model: model || DEFAULT_MODEL,
            messages: [
              { role: 'system', content: AGENT_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
            max_tokens: 1000,
          }),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          if (resp.status === 429 || resp.status >= 500) {
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
            continue;
          }
          throw new Error(`OpenRouter HTTP ${resp.status}: ${errText}`);
        }

        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('Leere Antwort vom Modell erhalten.');

        let cleaned = content.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
        else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');

        return JSON.parse(cleaned);
      } catch (err) {
        if (attempt >= maxRetries) throw err;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }
  }

  async fetchModels() {
    try {
      const resp = await fetch(`${OPENROUTER_API_BASE}/models`, {
        headers: {
          'HTTP-Referer': 'https://github.com/Misterwanwa/CompAInion',
          'X-Title': 'CompAInion Autopilot',
        },
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      return (data.data || []).map(m => ({ id: m.id, name: m.name || m.id })).slice(0, 30);
    } catch (e) {
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

  getConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['agentOpenRouterApiKey', 'agentSelectedModel'], (res) => {
        resolve({
          apiKey: res.agentOpenRouterApiKey || '',
          model: res.agentSelectedModel || DEFAULT_MODEL,
        });
      });
    });
  }
}

// Globaler Manager für den Background Worker
const backgroundAgent = new BackgroundAgentManager();

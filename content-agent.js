/**
 * content-agent.js
 * Browser-integrierte Autopilot-Logik für CompAInion:
 * - Long-Press-Erkennung (>500ms) auf dem schwebenden #gemini-logo
 * - Injektion & Steuerung der kollabierbaren Chat-Sidebar
 * - DOM-Snapshot-Extraktor (max. 4000 Tokens)
 * - Robuster Action-Executor mit ReAct-Feedback
 */

(function () {
  'use strict';

  console.log('[CompAInion Autopilot] Content Agent initialisiert.');

  const AGENT_ATTR = 'data-agent-id';
  const MAX_CHAR_LIMIT = 12000;

  // ------------------ LONG-PRESS DETECTOR ------------------

  class LongPressDetector {
    constructor(element, options) {
      this.element = element;
      this.thresholdMs = options.thresholdMs || 500;
      this.moveThresholdPx = options.moveThresholdPx || 7;
      this.onLongPress = options.onLongPress;
      this.onShortClick = options.onShortClick;

      this.timer = null;
      this.startX = 0;
      this.startY = 0;
      this.isLongPressTriggered = false;
      this.isPointerDown = false;

      this.bindEvents();
    }

    bindEvents() {
      this.element.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        this.startPress(e.clientX, e.clientY, e);
      });

      window.addEventListener('mousemove', (e) => {
        if (!this.isPointerDown || this.isLongPressTriggered) return;
        const dx = Math.abs(e.clientX - this.startX);
        const dy = Math.abs(e.clientY - this.startY);
        if (dx > this.moveThresholdPx || dy > this.moveThresholdPx) {
          this.cancelTimer();
        }
      });

      window.addEventListener('mouseup', (e) => {
        if (!this.isPointerDown) return;
        const wasLongPress = this.isLongPressTriggered;
        this.cancelTimer();
        this.isPointerDown = false;

        if (!wasLongPress) {
          if (e.target === this.element || this.element.contains(e.target)) {
            this.onShortClick(e);
          }
        } else {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    }

    startPress(x, y, e) {
      this.isPointerDown = true;
      this.isLongPressTriggered = false;
      this.startX = x;
      this.startY = y;

      this.timer = window.setTimeout(() => {
        if (this.isPointerDown) {
          this.isLongPressTriggered = true;
          window.__compainionLongPressActive = true;
          this.element.classList.add('compainion-agent-activated');
          setTimeout(() => {
            this.element.classList.remove('compainion-agent-activated');
          }, 600);
          this.onLongPress(e);
        }
      }, this.thresholdMs);
    }

    cancelTimer() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
  }

  // ------------------ DOM SNAPSHOT EXTRACTOR ------------------

  class DOMSnapshotExtractor {
    constructor() {
      this.counter = 0;
    }

    getSnapshot() {
      this.counter = 0;
      const elements = [];

      const nodes = document.querySelectorAll(
        'a[href], button, input, textarea, select, [role="button"], [role="link"], [role="checkbox"], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
      );

      nodes.forEach((node) => {
        if (node.closest('#gemini-chat-overlay, #gemini-logo, #gemini-context-menu, #compainion-agent-sidebar')) {
          return;
        }

        if (!this.isVisible(node)) return;

        this.counter++;
        const agentId = `agent-elem-${this.counter}`;
        node.setAttribute(AGENT_ATTR, agentId);

        const rect = node.getBoundingClientRect();
        const selector = this.computeSelector(node, agentId);
        const text = this.extractText(node);

        elements.push({
          id: agentId,
          selector,
          tagName: node.tagName.toLowerCase(),
          role: node.getAttribute('role') || undefined,
          type: node instanceof HTMLInputElement ? node.type : undefined,
          text,
          name: node.getAttribute('name') || undefined,
          placeholder: node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement ? node.placeholder : undefined,
          value: node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement ? (node.type === 'password' ? '***' : node.value) : undefined,
          href: node instanceof HTMLAnchorElement ? node.href : undefined,
          ariaLabel: node.getAttribute('aria-label') || undefined,
          isVisible: true,
          isInteractive: true,
          bounds: {
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        });
      });

      const textSummary = this.extractSummary();

      const snapshot = {
        title: document.title || 'Kein Titel',
        url: window.location.href,
        elements,
        textSummary,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollY: Math.round(window.scrollY),
        },
        tokenEstimate: 0,
      };

      this.enforceSize(snapshot);
      return snapshot;
    }

    isVisible(el) {
      if (el.offsetWidth <= 0 || el.offsetHeight <= 0) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || style.pointerEvents === 'none') {
        return false;
      }
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > window.innerHeight + 5000) return false;
      return true;
    }

    computeSelector(el, agentId) {
      if (el.id && document.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1) {
        return `#${CSS.escape(el.id)}`;
      }
      const testId = el.getAttribute('data-testid');
      if (testId && document.querySelectorAll(`[data-testid="${CSS.escape(testId)}"]`).length === 1) {
        return `[data-testid="${testId}"]`;
      }
      const name = el.getAttribute('name');
      if (name && document.querySelectorAll(`[name="${CSS.escape(name)}"]`).length === 1) {
        return `${el.tagName.toLowerCase()}[name="${name}"]`;
      }
      return `[${AGENT_ATTR}="${agentId}"]`;
    }

    extractText(el) {
      if (el instanceof HTMLInputElement) {
        return el.value || el.placeholder || '';
      }
      const inner = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (inner.length > 0) {
        return inner.length > 80 ? inner.substring(0, 77) + '...' : inner;
      }
      return el.getAttribute('aria-label') || '';
    }

    extractSummary() {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .filter((h) => this.isVisible(h))
        .slice(0, 8)
        .map((h) => `${h.tagName}: ${(h.textContent || '').trim().replace(/\s+/g, ' ')}`);

      const paras = Array.from(document.querySelectorAll('main p, article p, p'))
        .filter((p) => this.isVisible(p))
        .slice(0, 5)
        .map((p) => (p.textContent || '').trim().replace(/\s+/g, ' '));

      return [...headings, ...paras].join('\n').substring(0, 2500);
    }

    enforceSize(snapshot) {
      let str = JSON.stringify(snapshot);
      if (str.length > MAX_CHAR_LIMIT) {
        snapshot.textSummary = snapshot.textSummary.substring(0, 400);
        snapshot.elements = snapshot.elements.slice(0, 45);
      }
      snapshot.tokenEstimate = Math.round(JSON.stringify(snapshot).length / 3.5);
    }
  }

  // ------------------ ACTION EXECUTOR ------------------

  class ActionExecutor {
    constructor() {
      this.overlay = null;
      this.createOverlay();
    }

    createOverlay() {
      if (document.getElementById('compainion-agent-highlight')) {
        this.overlay = document.getElementById('compainion-agent-highlight');
        return;
      }
      const el = document.createElement('div');
      el.id = 'compainion-agent-highlight';
      el.style.position = 'absolute';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '2147483640';
      el.style.border = '2px solid #10b981';
      el.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
      el.style.borderRadius = '6px';
      el.style.boxShadow = '0 0 16px rgba(16, 185, 129, 0.6)';
      el.style.transition = 'all 0.15s ease-out';
      el.style.display = 'none';

      const label = document.createElement('div');
      label.className = 'compainion-highlight-label';
      label.style.position = 'absolute';
      label.style.top = '-24px';
      label.style.left = '0';
      label.style.backgroundColor = '#10b981';
      label.style.color = '#ffffff';
      label.style.fontSize = '11px';
      label.style.fontWeight = 'bold';
      label.style.padding = '2px 6px';
      label.style.borderRadius = '4px';

      el.appendChild(label);
      document.body.appendChild(el);
      this.overlay = el;
    }

    highlight(target, text, duration = 1500) {
      if (!this.overlay) this.createOverlay();
      if (!this.overlay || !target) return;

      const rect = target.getBoundingClientRect();
      this.overlay.style.top = `${rect.top + window.scrollY}px`;
      this.overlay.style.left = `${rect.left + window.scrollX}px`;
      this.overlay.style.width = `${rect.width}px`;
      this.overlay.style.height = `${rect.height}px`;
      this.overlay.style.display = 'block';

      const lbl = this.overlay.querySelector('.compainion-highlight-label');
      if (lbl) lbl.textContent = text || '🤖 Autopilot';

      setTimeout(() => {
        if (this.overlay) this.overlay.style.display = 'none';
      }, duration);
    }

    async execute(action) {
      const maxRetries = 3;
      let attempt = 0;
      let delay = 300;

      while (attempt < maxRetries) {
        attempt++;
        try {
          switch (action.type) {
            case 'click':
              return await this.click(action);
            case 'type':
              return await this.type(action);
            case 'scroll':
              return await this.scroll(action);
            case 'navigate':
              window.location.href = action.url;
              return { success: true, observation: `Navigation zu ${action.url} gestartet.` };
            case 'wait':
              await this.sleep(action.durationMs || 1000);
              return { success: true, observation: `Wartezeit von ${action.durationMs || 1000}ms beendet.` };
            case 'finish':
              return { success: action.success, observation: action.message };
            case 'ask_user':
              return { success: true, observation: `Frage: ${action.question}` };
            default:
              return { success: false, observation: `Unbekannter Typ: ${action.type}` };
          }
        } catch (err) {
          if (attempt >= maxRetries) {
            return { success: false, observation: `Fehler nach ${maxRetries} Versuchen: ${err.message}`, error: err.message };
          }
          await this.sleep(delay);
          delay *= 2;
        }
      }
      return { success: false, observation: 'Aktion abgebrochen.' };
    }

    async click(action) {
      const el = await this.find(action.selector);
      if (!el) throw new Error(`Element "${action.selector}" nicht gefunden.`);

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(200);

      this.highlight(el, 'Klick 🖱️');
      await this.sleep(150);

      const rect = el.getBoundingClientRect();
      const opts = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        button: 0,
        buttons: 1,
      };

      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      if (typeof el.focus === 'function') el.focus();
      await this.sleep(40);
      el.dispatchEvent(new PointerEvent('pointerup', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.dispatchEvent(new MouseEvent('click', opts));
      if (el instanceof HTMLAnchorElement || el instanceof HTMLButtonElement) {
        el.click();
      }

      await this.sleep(400);
      return { success: true, observation: `Auf "${(el.innerText || el.getAttribute('aria-label') || el.tagName).substring(0, 40)}" geklickt.` };
    }

    async type(action) {
      const el = await this.find(action.selector);
      if (!el) throw new Error(`Feld "${action.selector}" nicht gefunden.`);

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(150);

      this.highlight(el, 'Tippen ⌨️');
      if (typeof el.focus === 'function') el.focus();

      const isInput = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (isInput && action.clearFirst !== false) {
        this.setValue(el, '');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }

      let val = isInput && action.clearFirst === false ? el.value : '';
      for (const char of action.text) {
        val += char;
        const keyOpts = { key: char, code: `Key${char.toUpperCase()}`, bubbles: true };
        el.dispatchEvent(new KeyboardEvent('keydown', keyOpts));
        el.dispatchEvent(new KeyboardEvent('keypress', keyOpts));

        if (isInput) {
          this.setValue(el, val);
        } else if (el.isContentEditable) {
          el.textContent = val;
        }

        el.dispatchEvent(new InputEvent('input', { bubbles: true, data: char, inputType: 'insertText' }));
        el.dispatchEvent(new KeyboardEvent('keyup', keyOpts));
        await this.sleep(25);
      }

      if (isInput) el.dispatchEvent(new Event('change', { bubbles: true }));

      if (action.pressEnter) {
        await this.sleep(100);
        const enterOpts = { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true };
        el.dispatchEvent(new KeyboardEvent('keydown', enterOpts));
        el.dispatchEvent(new KeyboardEvent('keyup', enterOpts));
        if (el instanceof HTMLInputElement && el.form) {
          el.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }

      await this.sleep(300);
      return { success: true, observation: `Text "${action.text}" in Feld eingegeben.` };
    }

    async scroll(action) {
      if (action.selector) {
        const el = await this.find(action.selector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await this.sleep(400);
          return { success: true, observation: `Zu ${action.selector} gescrollt.` };
        }
      }

      const dist = action.distance || 500;
      const dir = action.direction || 'down';
      if (dir === 'down') window.scrollBy({ top: dist, behavior: 'smooth' });
      else if (dir === 'up') window.scrollBy({ top: -dist, behavior: 'smooth' });
      else if (dir === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
      else if (dir === 'bottom') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

      await this.sleep(400);
      return { success: true, observation: `Um ${dist}px nach ${dir} gescrollt.` };
    }

    async find(selector) {
      try {
        const direct = document.querySelector(selector);
        if (direct) return direct;
      } catch (e) {}

      if (selector.startsWith('agent-elem-') || !selector.startsWith('[')) {
        const byAgentId = document.querySelector(`[${AGENT_ATTR}="${selector}"]`);
        if (byAgentId) return byAgentId;
      }

      const clean = selector.replace(/^[#]/, '');
      const byId = document.getElementById(clean);
      if (byId) return byId;

      return null;
    }

    setValue(el, val) {
      const proto = el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      if (desc && desc.set) {
        desc.set.call(el, val);
      } else {
        el.value = val;
      }
    }

    sleep(ms) {
      return new Promise((r) => setTimeout(r, ms));
    }
  }

  // ------------------ CHAT SIDEBAR UI ------------------

  class ChatSidebarUI {
    constructor(callbacks) {
      this.callbacks = callbacks;
      this.isMinimized = false;
      this.isSettingsOpen = false;
      this.selectedModel = 'anthropic/claude-3.5-sonnet';
      this.apiKey = '';
      this.create();
    }

    create() {
      if (document.getElementById('compainion-agent-sidebar')) return;

      const sidebar = document.createElement('div');
      sidebar.id = 'compainion-agent-sidebar';
      sidebar.className = 'is-hidden';
      sidebar.innerHTML = `
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

        <div class="compainion-settings-panel" id="compainion-settings-panel">
          <div class="compainion-settings-title">OpenRouter API-Konfiguration</div>
          <div class="compainion-input-group">
            <label class="compainion-input-label" for="compainion-api-key-input">OpenRouter API-Key</label>
            <div class="compainion-api-input-wrap">
              <input type="password" id="compainion-api-key-input" class="compainion-text-input" placeholder="sk-or-v1-..." />
              <button class="compainion-btn-save" id="compainion-btn-save-key">Speichern</button>
            </div>
          </div>
        </div>

        <div class="compainion-model-bar">
          <span class="compainion-model-label">Modell:</span>
          <div class="compainion-model-select-wrapper">
            <select id="compainion-model-select" class="compainion-model-select">
              <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (Empfohlen)</option>
              <option value="openai/gpt-4o">OpenAI GPT-4o</option>
              <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
              <option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash</option>
              <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B</option>
            </select>
          </div>
        </div>

        <div class="compainion-chat-history" id="compainion-chat-history">
          <div class="compainion-msg-card step">
            <div class="compainion-observation">
              👋 <strong>Autopilot aktiviert!</strong><br>
              Halte das ✨ Icon 500ms gedrückt, um mich jederzeit ein- oder auszublenden.
            </div>
          </div>
        </div>

        <div class="compainion-suggestions-bar">
          <span class="compainion-suggestion-chip" data-prompt="Finde die wichtigsten Kernaussagen dieser Seite">📖 Zusammenfassen</span>
          <span class="compainion-suggestion-chip" data-prompt="Suche nach dem Kontaktformular und navigiere dorthin">📩 Kontakt suchen</span>
          <span class="compainion-suggestion-chip" data-prompt="Vergleiche die Angebote und zeige die beste Option">⚖️ Vergleichen</span>
        </div>

        <div class="compainion-input-bar">
          <textarea id="compainion-prompt-input" class="compainion-prompt-textarea" placeholder="Ziel für den Autopiloten eingeben..."></textarea>
          <button id="compainion-btn-action" class="compainion-btn-action" title="Starten">🚀</button>
        </div>
      `;

      document.body.appendChild(sidebar);
      this.bindEvents(sidebar);
      this.loadConfig();
    }

    bindEvents(sidebar) {
      sidebar.querySelector('#compainion-btn-minimize').addEventListener('click', () => {
        this.isMinimized = !this.isMinimized;
        sidebar.classList.toggle('is-minimized', this.isMinimized);
        sidebar.querySelector('#compainion-btn-minimize').textContent = this.isMinimized ? '□' : '━';
      });

      sidebar.querySelector('#compainion-btn-close').addEventListener('click', () => {
        this.hide();
      });

      sidebar.querySelector('#compainion-btn-settings').addEventListener('click', () => {
        this.isSettingsOpen = !this.isSettingsOpen;
        sidebar.querySelector('#compainion-settings-panel').classList.toggle('is-open', this.isSettingsOpen);
      });

      sidebar.querySelector('#compainion-btn-save-key').addEventListener('click', () => {
        const val = sidebar.querySelector('#compainion-api-key-input').value.trim();
        this.apiKey = val;
        this.callbacks.onSaveConfig({ openRouterApiKey: val });
        sidebar.querySelector('#compainion-settings-panel').classList.remove('is-open');
        this.isSettingsOpen = false;
        this.notify('API-Key gespeichert.');
      });

      sidebar.querySelector('#compainion-model-select').addEventListener('change', (e) => {
        this.selectedModel = e.target.value;
        this.callbacks.onSaveConfig({ selectedModel: this.selectedModel });
      });

      sidebar.querySelectorAll('.compainion-suggestion-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          sidebar.querySelector('#compainion-prompt-input').value = chip.getAttribute('data-prompt');
          sidebar.querySelector('#compainion-prompt-input').focus();
        });
      });

      const send = () => {
        const btn = sidebar.querySelector('#compainion-btn-action');
        if (btn.classList.contains('compainion-btn-stop')) {
          this.callbacks.onStopTask();
          return;
        }

        const input = sidebar.querySelector('#compainion-prompt-input');
        const text = input.value.trim();
        if (!text) return;

        if (!this.apiKey) {
          sidebar.querySelector('#compainion-settings-panel').classList.add('is-open');
          this.isSettingsOpen = true;
          this.notify('⚠️ Bitte gib deinen OpenRouter API-Key ein.');
          return;
        }

        input.value = '';
        this.addUserMsg(text);
        this.callbacks.onStartTask(text, this.selectedModel);
      };

      sidebar.querySelector('#compainion-btn-action').addEventListener('click', send);
      sidebar.querySelector('#compainion-prompt-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          send();
        }
      });
    }

    show() {
      const el = document.getElementById('compainion-agent-sidebar');
      if (el) {
        el.classList.remove('is-hidden');
        el.querySelector('#compainion-prompt-input')?.focus();
      }
    }

    hide() {
      const el = document.getElementById('compainion-agent-sidebar');
      if (el) el.classList.add('is-hidden');
    }

    toggle() {
      const el = document.getElementById('compainion-agent-sidebar');
      if (el) {
        if (el.classList.contains('is-hidden')) this.show();
        else this.hide();
      }
    }

    updateState(status, step = 0, maxSteps = 30) {
      const badge = document.getElementById('compainion-agent-badge');
      const btn = document.getElementById('compainion-btn-action');
      if (!badge || !btn) return;

      badge.className = `compainion-status-badge ${status}`;

      if (status === 'running') {
        badge.textContent = `Schritt ${step}/${maxSteps}`;
        btn.textContent = '⏹️';
        btn.classList.add('compainion-btn-stop');
      } else if (status === 'waiting_confirmation') {
        badge.textContent = 'Bestätigung!';
        btn.textContent = '⏸️';
        btn.classList.remove('compainion-btn-stop');
      } else {
        badge.textContent = status === 'completed' ? 'Fertig' : 'Bereit';
        btn.textContent = '🚀';
        btn.classList.remove('compainion-btn-stop');
      }
    }

    addStepMsg(stepNumber, thought, action, observation) {
      const hist = document.getElementById('compainion-chat-history');
      if (!hist) return;

      const card = document.createElement('div');
      card.className = 'compainion-msg-card step';
      card.innerHTML = `
        <div class="compainion-step-header"><span>Schritt ${stepNumber}</span></div>
        <div class="compainion-thought-bubble">${this.escape(thought)}</div>
        <div class="compainion-action-badge">⚡ ${action.type}: ${this.escape(action.selector || action.url || action.message || '')}</div>
        ${observation ? `<div class="compainion-observation">${this.escape(observation)}</div>` : ''}
      `;
      hist.appendChild(card);
      hist.scrollTop = hist.scrollHeight;
    }

    showConfirmation(reason, onConfirm, onReject) {
      const hist = document.getElementById('compainion-chat-history');
      if (!hist) return;

      const card = document.createElement('div');
      card.className = 'compainion-confirmation-card';
      card.innerHTML = `
        <div class="compainion-confirmation-title">⚠️ Sicherheitsbestätigung erforderlich</div>
        <div class="compainion-confirmation-reason">${this.escape(reason)}</div>
        <div class="compainion-confirmation-actions">
          <button class="compainion-btn-confirm" id="btn-conf-ok">Aktion erlauben</button>
          <button class="compainion-btn-reject" id="btn-conf-no">Abbrechen</button>
        </div>
      `;

      card.querySelector('#btn-conf-ok').addEventListener('click', () => {
        card.remove();
        onConfirm();
      });

      card.querySelector('#btn-conf-no').addEventListener('click', () => {
        card.remove();
        onReject();
      });

      hist.appendChild(card);
      hist.scrollTop = hist.scrollHeight;
    }

    addUserMsg(text) {
      const hist = document.getElementById('compainion-chat-history');
      if (!hist) return;
      const msg = document.createElement('div');
      msg.className = 'compainion-msg-card user';
      msg.textContent = text;
      hist.appendChild(msg);
      hist.scrollTop = hist.scrollHeight;
    }

    notify(text) {
      const hist = document.getElementById('compainion-chat-history');
      if (!hist) return;
      const msg = document.createElement('div');
      msg.className = 'compainion-msg-card step';
      msg.innerHTML = `<div class="compainion-observation">${this.escape(text)}</div>`;
      hist.appendChild(msg);
      hist.scrollTop = hist.scrollHeight;
    }

    loadConfig() {
      chrome.storage.local.get(['agentOpenRouterApiKey', 'agentSelectedModel'], (items) => {
        if (items.agentOpenRouterApiKey) {
          this.apiKey = items.agentOpenRouterApiKey;
          const input = document.getElementById('compainion-api-key-input');
          if (input) input.value = this.apiKey;
        }
        if (items.agentSelectedModel) {
          this.selectedModel = items.agentSelectedModel;
          const sel = document.getElementById('compainion-model-select');
          if (sel) sel.value = this.selectedModel;
        }
      });
    }

    setModels(models) {
      const sel = document.getElementById('compainion-model-select');
      if (!sel) return;
      sel.innerHTML = '';
      models.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        if (m.id === this.selectedModel) opt.selected = true;
        sel.appendChild(opt);
      });
    }

    escape(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
  }

  // ------------------ MAIN ORCHESTRATION ------------------

  const actionExecutor = new ActionExecutor();
  const snapshotExtractor = new DOMSnapshotExtractor();
  let isExecuting = false;
  let currentStep = 0;
  const maxSteps = 30;

  const sidebarUI = new ChatSidebarUI({
    onStartTask: (goal, model) => startTask(goal, model),
    onStopTask: () => stopTask(),
    onPauseTask: () => { isExecuting = false; sidebarUI.updateState('paused'); },
    onResumeTask: () => { isExecuting = true; sidebarUI.updateState('running', currentStep, maxSteps); runLoop(); },
    onSaveConfig: (config) => {
      chrome.storage.local.set({
        agentOpenRouterApiKey: config.openRouterApiKey,
        agentSelectedModel: config.selectedModel,
      });
    },
  });

  // Long-Press Integration an das existierende #gemini-logo
  function attachToLogo() {
    const logo = document.getElementById('gemini-logo');
    if (!logo) {
      setTimeout(attachToLogo, 100);
      return;
    }

    if (logo.dataset.agentAttached) return;
    logo.dataset.agentAttached = 'true';

    new LongPressDetector(logo, {
      thresholdMs: 500,
      onLongPress: () => {
        sidebarUI.toggle();
      },
      onShortClick: (e) => {
        // Bestehendes Kontextmenü aufrufen falls definiert
        if (typeof window.showContextMenu === 'function') {
          window.showContextMenu(e);
        } else {
          // Click Event an bestehende Listener delegieren
          const evt = new CustomEvent('gemini-logo-short-click', { bubbles: true });
          logo.dispatchEvent(evt);
        }
      },
    });
  }

  attachToLogo();

  // Task ausführen
  async function startTask(goal, model) {
    isExecuting = true;
    currentStep = 0;
    sidebarUI.updateState('running', 0, maxSteps);

    chrome.runtime.sendMessage({
      action: 'AGENT_START_TASK',
      goal,
      url: window.location.href,
      model,
    }, (resp) => {
      if (resp && resp.success) {
        runLoop();
      } else {
        sidebarUI.notify(`❌ Startfehler: ${resp?.error || 'Unbekannt'}`);
        isExecuting = false;
        sidebarUI.updateState('idle');
      }
    });
  }

  function stopTask() {
    isExecuting = false;
    sidebarUI.updateState('idle');
    chrome.runtime.sendMessage({ action: 'AGENT_STOP_TASK' });
    sidebarUI.notify('Task gestoppt.');
  }

  async function runLoop(lastObs) {
    if (!isExecuting) return;

    if (currentStep >= maxSteps) {
      sidebarUI.notify(`⚠️ Maximales Limit von ${maxSteps} Schritten erreicht. Autopilot gestoppt.`);
      isExecuting = false;
      sidebarUI.updateState('idle');
      return;
    }

    const snapshot = snapshotExtractor.getSnapshot();

    chrome.runtime.sendMessage({
      action: 'AGENT_GET_NEXT_STEP',
      snapshot,
      lastObservation: lastObs,
    }, async (resp) => {
      if (!isExecuting) return;

      if (!resp || !resp.success || !resp.llmResponse) {
        sidebarUI.notify(`❌ Fehler bei Modell-Antwort: ${resp?.error || 'Keine Antwort'}`);
        isExecuting = false;
        sidebarUI.updateState('idle');
        return;
      }

      const { thought, action, isFinal, finalMessage } = resp.llmResponse;

      if (resp.requiresConfirmation) {
        sidebarUI.updateState('waiting_confirmation');
        sidebarUI.showConfirmation(
          resp.requiresConfirmation.reason,
          async () => {
            sidebarUI.updateState('running', currentStep + 1, maxSteps);
            await executeAndContinue(thought, action);
          },
          () => {
            stopTask();
          }
        );
        return;
      }

      if (isFinal || action.type === 'finish') {
        currentStep++;
        sidebarUI.addStepMsg(currentStep, thought, action, finalMessage || action.message);
        sidebarUI.updateState('completed');
        isExecuting = false;
        chrome.runtime.sendMessage({
          action: 'AGENT_RECORD_STEP',
          step: { thought, action, observation: finalMessage || action.message },
        });
        return;
      }

      await executeAndContinue(thought, action);
    });
  }

  async function executeAndContinue(thought, action) {
    currentStep++;
    sidebarUI.updateState('running', currentStep, maxSteps);

    const result = await actionExecutor.execute(action);
    sidebarUI.addStepMsg(currentStep, thought, action, result.observation);

    chrome.runtime.sendMessage({
      action: 'AGENT_RECORD_STEP',
      step: { thought, action, observation: result.observation, error: result.error },
    });

    setTimeout(() => {
      runLoop(result.observation);
    }, 600);
  }

  // Modelle laden
  chrome.runtime.sendMessage({ action: 'AGENT_GET_MODELS' }, (resp) => {
    if (resp && resp.success && resp.models) {
      sidebarUI.setModels(resp.models);
    }
  });

  // Globale Referenz für Tastaturkürzel / Debugging
  window.compainionAutopilot = {
    toggle: () => sidebarUI.toggle(),
    show: () => sidebarUI.show(),
    hide: () => sidebarUI.hide(),
  };
})();

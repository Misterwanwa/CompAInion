/**
 * action-executor.ts
 * Robuster DOM Action Executor für das Content Script:
 * - Highlighten von Elementen (optischer grüner Rahmen)
 * - Echtes Event-Dispatching (pointerdown/mousedown/focus/pointerup/mouseup/click)
 * - Menschliche Tastatur-Eingaben (keyboard events, React-Tracker)
 * - Smooth Scrolling
 * - Retry-Logik mit exponential backoff (max 3 Retries pro Action)
 */

import { AgentAction, ClickAction, ScrollAction, TypeAction } from '../types/agent';

export interface ActionResult {
  success: boolean;
  observation: string;
  error?: string;
}

export class ActionExecutor {
  private highlightOverlay: HTMLElement | null = null;

  constructor() {
    // Lazy creation in highlightElement to ensure document.body exists
  }

  /**
   * Führt eine AgentAction mit automatischer Retry-Logik (max 3 Versuche) aus
   */
  public async executeAction(action: AgentAction): Promise<ActionResult> {
    const maxRetries = 3;
    let attempt = 0;
    let delay = 300;

    while (attempt < maxRetries) {
      attempt++;
      try {
        switch (action.type) {
          case 'click':
            return await this.clickElement(action);

          case 'type':
            return await this.typeText(action);

          case 'scroll':
            return await this.scrollTo(action);

          case 'navigate':
            return await this.navigate(action.url);

          case 'wait':
            await this.wait(action.durationMs ?? 1000);
            return {
              success: true,
              observation: `Wartezeit von ${action.durationMs ?? 1000}ms beendet. DOM ist stabilisiert.`,
            };

          case 'finish':
            return {
              success: action.success,
              observation: `Task abgeschlossen: ${action.message}`,
            };

          case 'ask_user':
            return {
              success: true,
              observation: `Frage an den Benutzer gestellt: "${action.question}"`,
            };

          default:
            return {
              success: false,
              observation: `Unbekannter Aktionstyp: ${(action as AgentAction).type}`,
              error: 'Unknown action type',
            };
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.warn(`[ActionExecutor] Aktion ${action.type} Versuch ${attempt}/${maxRetries} fehlgeschlagen:`, error.message);

        if (attempt >= maxRetries) {
          return {
            success: false,
            observation: `Aktion fehlgeschlagen nach ${maxRetries} Versuchen: ${error.message}`,
            error: error.message,
          };
        }

        // Warte mit Exponential Backoff bevor der nächste Versuch startet
        await this.wait(delay);
        delay *= 2;
      }
    }

    return {
      success: false,
      observation: 'Unerwarteter Abbruch der Aktionsausführung.',
      error: 'Unexpected executor failure',
    };
  }

  // ------------------ HIGHLIGHTING ------------------

  public highlightElement(target: HTMLElement, textLabel?: string, durationMs = 1500): void {
    if (!this.highlightOverlay) {
      this.createHighlightOverlay();
    }

    const rect = target.getBoundingClientRect();
    if (!this.highlightOverlay) return;

    this.highlightOverlay.style.top = `${rect.top + window.scrollY}px`;
    this.highlightOverlay.style.left = `${rect.left + window.scrollX}px`;
    this.highlightOverlay.style.width = `${rect.width}px`;
    this.highlightOverlay.style.height = `${rect.height}px`;
    this.highlightOverlay.style.display = 'block';

    const labelElem = this.highlightOverlay.querySelector('.compainion-highlight-label') as HTMLElement;
    if (labelElem) {
      labelElem.textContent = textLabel || '🤖 Autopilot';
    }

    window.setTimeout(() => {
      if (this.highlightOverlay) {
        this.highlightOverlay.style.display = 'none';
      }
    }, durationMs);
  }

  private createHighlightOverlay(): void {
    if (document.getElementById('compainion-agent-highlight')) return;

    const overlay = document.createElement('div');
    overlay.id = 'compainion-agent-highlight';
    overlay.style.position = 'absolute';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '2147483640';
    overlay.style.border = '2px solid #10b981'; // Neon Emerald Grün
    overlay.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
    overlay.style.borderRadius = '6px';
    overlay.style.boxShadow = '0 0 16px rgba(16, 185, 129, 0.6)';
    overlay.style.transition = 'all 0.15s ease-out';
    overlay.style.display = 'none';

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
    label.style.whiteSpace = 'nowrap';
    label.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

    const parent = document.body || document.documentElement;
    if (!parent) return;

    overlay.appendChild(label);
    parent.appendChild(overlay);
    this.highlightOverlay = overlay;
  }

  // ------------------ CLICK ACTION ------------------

  public async clickElement(action: ClickAction): Promise<ActionResult> {
    const el = await this.findElement(action.selector);
    if (!el) {
      throw new Error(`Element mit Selektor "${action.selector}" nicht im DOM gefunden.`);
    }

    // Sanft in den Viewport scrollen
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    await this.wait(200);

    this.highlightElement(el, 'Klick 🖱️');
    await this.wait(150);

    // Vollständige Event-Kette für React/Angular/Vue Kompatibilität
    const rect = el.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;

    const eventOpts: MouseEventInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX,
      clientY,
      button: 0,
      buttons: 1,
    };

    // 1. Pointerdown & Mousedown
    el.dispatchEvent(new PointerEvent('pointerdown', eventOpts));
    el.dispatchEvent(new MouseEvent('mousedown', eventOpts));

    // 2. Fokus setzen
    if (typeof el.focus === 'function') {
      el.focus();
    }

    await this.wait(40);

    // 3. Pointerup, Mouseup & Click
    el.dispatchEvent(new PointerEvent('pointerup', eventOpts));
    el.dispatchEvent(new MouseEvent('mouseup', eventOpts));
    el.dispatchEvent(new MouseEvent('click', eventOpts));

    // Falls es ein normaler Button/Link ist, ggf. nativen Klick nachreichen
    if (el instanceof HTMLAnchorElement || el instanceof HTMLButtonElement) {
      el.click();
    }

    // Kurz warten auf asynchrone DOM-Reaktion
    await this.wait(400);

    const targetDesc = (el.innerText || el.getAttribute('aria-label') || el.tagName).substring(0, 50);
    return {
      success: true,
      observation: `Erfolgreich auf "${targetDesc}" (${action.selector}) geklickt.`,
    };
  }

  // ------------------ TYPE ACTION ------------------

  public async typeText(action: TypeAction): Promise<ActionResult> {
    const el = await this.findElement(action.selector);
    if (!el) {
      throw new Error(`Eingabefeld mit Selektor "${action.selector}" nicht gefunden.`);
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this.wait(150);

    this.highlightElement(el, 'Tippen ⌨️');

    if (typeof el.focus === 'function') {
      el.focus();
    }

    const isInputOrTextArea = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

    if (isInputOrTextArea && action.clearFirst !== false) {
      this.setNativeValue(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Menschliche Eingabe mit leichtem Delay simulieren
    const textToType = action.text;
    let currentVal = isInputOrTextArea && action.clearFirst === false ? el.value : '';

    for (let i = 0; i < textToType.length; i++) {
      const char = textToType[i];
      currentVal += char;

      const keyEventOpts: KeyboardEventInit = {
        key: char,
        code: `Key${char.toUpperCase()}`,
        bubbles: true,
        cancelable: true,
      };

      el.dispatchEvent(new KeyboardEvent('keydown', keyEventOpts));
      el.dispatchEvent(new KeyboardEvent('keypress', keyEventOpts));

      if (isInputOrTextArea) {
        this.setNativeValue(el, currentVal);
      } else if (el.isContentEditable) {
        el.textContent = currentVal;
      }

      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: char, inputType: 'insertText' }));
      el.dispatchEvent(new KeyboardEvent('keyup', keyEventOpts));

      // 20-30ms Delay für realistische UI-Aktualisierung
      await this.wait(25);
    }

    if (isInputOrTextArea) {
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Optional Enter drücken
    if (action.pressEnter) {
      await this.wait(100);
      const enterOpts: KeyboardEventInit = { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true };
      el.dispatchEvent(new KeyboardEvent('keydown', enterOpts));
      el.dispatchEvent(new KeyboardEvent('keypress', enterOpts));
      el.dispatchEvent(new KeyboardEvent('keyup', enterOpts));

      if (el instanceof HTMLInputElement && el.form) {
        // Formular absenden falls vorhanden
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        el.form.dispatchEvent(submitEvent);
      }
    }

    await this.wait(300);

    return {
      success: true,
      observation: `Text "${action.text}" in Feld (${action.selector}) eingegeben${action.pressEnter ? ' und Enter gedrückt' : ''}.`,
    };
  }

  // ------------------ SCROLL ACTION ------------------

  public async scrollTo(action: ScrollAction): Promise<ActionResult> {
    if (action.selector) {
      const el = await this.findElement(action.selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.wait(400);
        return {
          success: true,
          observation: `Zu Element ${action.selector} gescrollt.`,
        };
      }
    }

    if (action.coordinates) {
      window.scrollTo({ left: action.coordinates.x, top: action.coordinates.y, behavior: 'smooth' });
      await this.wait(400);
      return {
        success: true,
        observation: `Zu Position (${action.coordinates.x}, ${action.coordinates.y}) gescrollt.`,
      };
    }

    const distance = action.distance ?? 500;
    const direction = action.direction ?? 'down';

    switch (direction) {
      case 'down':
        window.scrollBy({ top: distance, behavior: 'smooth' });
        break;
      case 'up':
        window.scrollBy({ top: -distance, behavior: 'smooth' });
        break;
      case 'top':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'bottom':
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        break;
    }

    await this.wait(400);

    return {
      success: true,
      observation: `Seite um ${distance}px nach ${direction} gescrollt (Neuer ScrollY: ${Math.round(window.scrollY)}px).`,
    };
  }

  // ------------------ NAVIGATION ------------------

  public async navigate(url: string): Promise<ActionResult> {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error(`Ungültiges URL-Protokoll: ${url}`);
    }

    window.location.href = url;
    return {
      success: true,
      observation: `Navigation zu ${url} eingeleitet.`,
    };
  }

  // ------------------ DOM ELEMENT RESOLVER & UTILS ------------------

  private async findElement(selector: string): Promise<HTMLElement | null> {
    // 1. Direkter CSS-Selektor
    try {
      const direct = document.querySelector<HTMLElement>(selector);
      if (direct) return direct;
    } catch {
      // Ignoriere Syntax-Fehler in generierten Selektoren
    }

    // 2. Data-Agent-ID Suche (falls nur agent-elem-X übergeben wurde)
    if (selector.startsWith('agent-elem-') || !selector.startsWith('[')) {
      const byAgentId = document.querySelector<HTMLElement>(`[data-agent-id="${selector}"]`);
      if (byAgentId) return byAgentId;
    }

    // 3. Fallback: Suche nach ID
    const cleanId = selector.replace(/^[#]/, '');
    const byId = document.getElementById(cleanId);
    if (byId) return byId;

    return null;
  }

  /**
   * Setzt den Wert eines Input/Textarea Elements so, dass React / Angular State-Hooks greifen
   */
  private setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    const prototype = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    if (descriptor && descriptor.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

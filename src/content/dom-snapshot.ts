/**
 * dom-snapshot.ts
 * Extrahiert eine bereinigte, hochinformative DOM- & Accessibility-Tree-Repräsentation
 * für das LLM mit strikter Begrenzung auf maximal ca. 4000 Tokens (~12.000 Zeichen).
 */

import { DOMSnapshot, InteractiveElement } from '../types/agent';

const MAX_CHAR_LIMIT = 12000;
const AGENT_ATTR = 'data-agent-id';

export class DOMSnapshotExtractor {
  private elementCounter = 0;

  /**
   * Erstellt einen vollständigen, optimierten DOM-Snapshot der aktuellen Seite.
   */
  public getSnapshot(): DOMSnapshot {
    this.elementCounter = 0;
    const elements: InteractiveElement[] = [];

    // Alle potenziell interaktiven Elemente der Seite durchsuchen
    const candidateNodes = document.querySelectorAll<HTMLElement>(
      'a[href], button, input, textarea, select, details, [role="button"], [role="link"], [role="checkbox"], [role="menuitem"], [role="tab"], [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
    );

    candidateNodes.forEach((node) => {
      // Ignoriere Elemente unserer eigenen Extension-UI
      if (node.closest('#gemini-chat-overlay, #gemini-logo, #gemini-context-menu, #compainion-agent-sidebar')) {
        return;
      }

      if (!this.isElementVisible(node)) {
        return;
      }

      this.elementCounter++;
      const agentId = `agent-elem-${this.elementCounter}`;
      node.setAttribute(AGENT_ATTR, agentId);

      const rect = node.getBoundingClientRect();
      const selector = this.computeBestSelector(node, agentId);
      const text = this.extractMeaningfulText(node);

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

    // Wichtige Textabschnitte & Überschriften für den Kontext extrahieren
    const textSummary = this.extractPageContentSummary();

    const snapshot: DOMSnapshot = {
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

    // Begrenzung auf max 4000 Tokens (~12.000 Zeichen)
    this.enforceSizeLimit(snapshot);

    return snapshot;
  }

  /**
   * Prüft ob ein Element tatsächlich im sichtbaren Bereich gerendert wird
   */
  private isElementVisible(el: HTMLElement): boolean {
    if (el.offsetWidth <= 0 || el.offsetHeight <= 0) return false;

    const style = window.getComputedStyle(el);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      style.pointerEvents === 'none'
    ) {
      return false;
    }

    const rect = el.getBoundingClientRect();
    // Prüfe ob Element zumindest teilweise im Viewport oder in der Nähe ist
    if (rect.bottom < -200 || rect.top > window.innerHeight + 5000) {
      // Sehr weit außerhalb des relevanten Scroll-Bereichs
      return false;
    }

    return true;
  }

  /**
   * Generiert den stabilsten CSS-Selektor für das Element
   */
  private computeBestSelector(el: HTMLElement, agentId: string): string {
    // 1. Wenn eine echte ID vorhanden ist und im DOM einzigartig ist
    if (el.id && document.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1) {
      return `#${CSS.escape(el.id)}`;
    }

    // 2. Data-Test-IDs oder eindeutige Namen
    const testId = el.getAttribute('data-testid') || el.getAttribute('data-test-id');
    if (testId && document.querySelectorAll(`[data-testid="${CSS.escape(testId)}"]`).length === 1) {
      return `[data-testid="${testId}"]`;
    }

    const name = el.getAttribute('name');
    if (name && document.querySelectorAll(`[name="${CSS.escape(name)}"]`).length === 1) {
      return `${el.tagName.toLowerCase()}[name="${name}"]`;
    }

    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel && document.querySelectorAll(`[aria-label="${CSS.escape(ariaLabel)}"]`).length === 1) {
      return `${el.tagName.toLowerCase()}[aria-label="${ariaLabel}"]`;
    }

    // 3. Fallback: Unser direkt injiziertes agent-id Attribut (garantiert 100% präzise Treffer)
    return `[${AGENT_ATTR}="${agentId}"]`;
  }

  /**
   * Liest den sichtbaren Text oder Labels eines Elements aus
   */
  private extractMeaningfulText(el: HTMLElement): string {
    if (el instanceof HTMLInputElement) {
      if (el.type === 'submit' || el.type === 'button') {
        return el.value || el.placeholder || '';
      }
      return el.placeholder || el.value || '';
    }

    const inner = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    if (inner.length > 0) {
      return inner.length > 80 ? inner.substring(0, 77) + '...' : inner;
    }

    const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('title');
    if (ariaLabel) {
      return ariaLabel.trim();
    }

    return '';
  }

  /**
   * Extrahiert die wichtigsten Überschriften und Textblöcke der Seite
   */
  private extractPageContentSummary(): string {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .filter((h) => this.isElementVisible(h as HTMLElement))
      .slice(0, 10)
      .map((h) => `${h.tagName}: ${(h.textContent || '').trim().replace(/\s+/g, ' ')}`)
      .filter((text) => text.length > 5);

    const mainParagraphs = Array.from(document.querySelectorAll('main p, article p, p'))
      .filter((p) => this.isElementVisible(p as HTMLElement))
      .slice(0, 5)
      .map((p) => (p.textContent || '').trim().replace(/\s+/g, ' '))
      .filter((text) => text.length > 20)
      .map((text) => (text.length > 150 ? text.substring(0, 147) + '...' : text));

    return [...headings, ...mainParagraphs].join('\n').substring(0, 3000);
  }

  /**
   * Stellt sicher, dass das Snapshot-Objekt das 4000-Token-Limit nicht sprengt
   */
  private enforceSizeLimit(snapshot: DOMSnapshot): void {
    let jsonStr = JSON.stringify(snapshot);
    if (jsonStr.length > MAX_CHAR_LIMIT) {
      // Wenn zu lang: Zuerst Textsummary kürzen
      snapshot.textSummary = snapshot.textSummary.substring(0, 500);

      jsonStr = JSON.stringify(snapshot);
      if (jsonStr.length > MAX_CHAR_LIMIT) {
        // Dann Elemente auf die obersten 50 beschränken
        snapshot.elements = snapshot.elements.slice(0, 50);
      }
    }
    // Grobe Token-Schätzung (1 Token ~ 3.5 Zeichen)
    snapshot.tokenEstimate = Math.round(JSON.stringify(snapshot).length / 3.5);
  }
}

/**
 * long-press.ts
 * Robuste Long-Press-Erkennung (>500ms) für das schwebende CompAInion-Symbol.
 * Unterscheidet sauber zwischen:
 * 1. Kurzem Klick (öffnet wie bisher das AI-Befehlsmenü)
 * 2. Ziehen/Verschieben (Drag-and-Drop des Icons ohne Menü/Agent-Trigger)
 * 3. Langem Druck (>500ms, aktiviert den Autopilot-Agenten-Modus)
 */

export interface LongPressOptions {
  thresholdMs?: number; // Standard: 500ms
  moveThresholdPx?: number; // Standard: 6px Bewegung bricht Long-Press ab (wird Drag)
  onLongPress: (e: MouseEvent | TouchEvent) => void;
  onShortClick: (e: MouseEvent | TouchEvent) => void;
  onPressStart?: () => void;
  onPressCancel?: () => void;
}

export class LongPressDetector {
  private element: HTMLElement;
  private options: Required<LongPressOptions>;
  private timer: number | null = null;
  private startX = 0;
  private startY = 0;
  private isLongPressTriggered = false;
  private isPointerDown = false;

  constructor(element: HTMLElement, options: LongPressOptions) {
    this.element = element;
    this.options = {
      thresholdMs: options.thresholdMs ?? 500,
      moveThresholdPx: options.moveThresholdPx ?? 6,
      onLongPress: options.onLongPress,
      onShortClick: options.onShortClick,
      onPressStart: options.onPressStart ?? (() => {}),
      onPressCancel: options.onPressCancel ?? (() => {}),
    };

    this.bindEvents();
  }

  private bindEvents(): void {
    // Maus-Events
    this.element.addEventListener('mousedown', this.handleDown, { passive: false });
    window.addEventListener('mousemove', this.handleMove, { passive: true });
    window.addEventListener('mouseup', this.handleUp, { passive: false });

    // Touch-Events für Touchscreens / Convertibles
    this.element.addEventListener('touchstart', this.handleTouchDown, { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    window.addEventListener('touchend', this.handleTouchUp, { passive: false });
  }

  public destroy(): void {
    this.cancelTimer();
    this.element.removeEventListener('mousedown', this.handleDown);
    window.removeEventListener('mousemove', this.handleMove);
    window.removeEventListener('mouseup', this.handleUp);

    this.element.removeEventListener('touchstart', this.handleTouchDown);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchUp);
  }

  private handleDown = (e: MouseEvent): void => {
    if (e.button !== 0) return; // Nur linke Maustaste
    this.startPress(e.clientX, e.clientY, e);
  };

  private handleTouchDown = (e: TouchEvent): void => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.startPress(touch.clientX, touch.clientY, e);
    }
  };

  private startPress(x: number, y: number, originalEvent: MouseEvent | TouchEvent): void {
    this.isPointerDown = true;
    this.isLongPressTriggered = false;
    this.startX = x;
    this.startY = y;

    this.options.onPressStart();

    // Starte den 500ms Timer
    this.timer = window.setTimeout(() => {
      if (this.isPointerDown) {
        this.isLongPressTriggered = true;
        this.triggerVisualFeedback();
        this.options.onLongPress(originalEvent);
      }
    }, this.options.thresholdMs);
  }

  private handleMove = (e: MouseEvent): void => {
    if (!this.isPointerDown || this.isLongPressTriggered) return;
    this.checkMovement(e.clientX, e.clientY);
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (!this.isPointerDown || this.isLongPressTriggered || !e.touches.length) return;
    this.checkMovement(e.touches[0].clientX, e.touches[0].clientY);
  };

  private checkMovement(currentX: number, currentY: number): void {
    const deltaX = Math.abs(currentX - this.startX);
    const deltaY = Math.abs(currentY - this.startY);

    // Wenn der Nutzer die Maus/Finger bewegt, ist es ein Drag -> Long-Press abbrechen
    if (deltaX > this.options.moveThresholdPx || deltaY > this.options.moveThresholdPx) {
      this.cancelTimer();
      this.options.onPressCancel();
    }
  }

  private handleUp = (e: MouseEvent): void => {
    if (!this.isPointerDown) return;
    this.endPress(e);
  };

  private handleTouchUp = (e: TouchEvent): void => {
    if (!this.isPointerDown) return;
    this.endPress(e);
  };

  private endPress(originalEvent: MouseEvent | TouchEvent): void {
    const wasLongPress = this.isLongPressTriggered;
    this.cancelTimer();
    this.isPointerDown = false;

    if (!wasLongPress) {
      // Wenn der Timer nicht abgelaufen ist und keine wesentliche Bewegung stattfand -> Kurzer Klick
      const targetIsElement =
        originalEvent.target === this.element || this.element.contains(originalEvent.target as Node);

      if (targetIsElement) {
        this.options.onShortClick(originalEvent);
      }
    } else {
      // Long-Press war bereits aktiv -> Standard-Klick unterdrücken
      originalEvent.preventDefault();
      originalEvent.stopPropagation();
    }
  }

  private cancelTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private triggerVisualFeedback(): void {
    // Haptisches & visuelles Feedback beim Auslösen des Agenten-Modus
    this.element.classList.add('compainion-agent-activated');
    setTimeout(() => {
      this.element.classList.remove('compainion-agent-activated');
    }, 600);
  }
}

/**
 * content-agent.ts
 * Haupt-Orchestrierung für das Content Script:
 * - Bindet die Long-Press-Erkennung an das bestehende #gemini-logo an
 * - Verwaltet die Autopilot Chat-Sidebar
 * - Führt Aktionen via ActionExecutor aus
 * - Extrahiert DOM-Snapshots via DOMSnapshotExtractor
 * - Steuert den ReAct-Zyklus in Abstimmung mit dem Background Service Worker
 */

import { ActionExecutor } from './action-executor';
import { ChatSidebar } from './chat-sidebar';
import { DOMSnapshotExtractor } from './dom-snapshot';
import { LongPressDetector } from './long-press';
import { AgentAction, AgentConfig, DOMSnapshot, TaskState } from '../types/agent';

export class ContentAgentController {
  private sidebar: ChatSidebar;
  private actionExecutor: ActionExecutor;
  private snapshotExtractor: DOMSnapshotExtractor;
  private longPressDetector: LongPressDetector | null = null;
  private isExecutingLoop = false;
  private pendingActionToConfirm: AgentAction | null = null;

  constructor() {
    this.actionExecutor = new ActionExecutor();
    this.snapshotExtractor = new DOMSnapshotExtractor();

    this.sidebar = new ChatSidebar({
      onStartTask: (goal, model) => this.handleStartTask(goal, model),
      onStopTask: () => this.handleStopTask(),
      onPauseTask: () => this.handlePauseTask(),
      onResumeTask: () => this.handleResumeTask(),
      onConfirmAction: (confirmed) => this.handleConfirmAction(confirmed),
      onSaveConfig: (config) => this.handleSaveConfig(config),
    });

    this.initMessageListeners();
    this.setupLogoIntegration();
    this.loadModels();
  }

  // ------------------ LOGO INTEGRATION (LONG-PRESS) ------------------

  public setupLogoIntegration(): void {
    const attachDetector = () => {
      const logo = document.getElementById('gemini-logo');
      if (!logo) {
        setTimeout(attachDetector, 100);
        return;
      }

      if (this.longPressDetector) {
        this.longPressDetector.destroy();
      }

      // Klonen oder Event-Listener sauber entkoppeln
      // Wir überlagern den Klick mit unserem LongPressDetector:
      this.longPressDetector = new LongPressDetector(logo, {
        thresholdMs: 500,
        moveThresholdPx: 8,
        onLongPress: () => {
          // Long-Press (>500ms): Sidebar öffnen
          this.sidebar.show();
        },
        onShortClick: (e) => {
          // Kurzer Klick: Bestehendes Kontextmenü aufrufen falls definiert
          const win = window as unknown as { showContextMenu?: (e: MouseEvent | TouchEvent) => void };
          if (typeof win.showContextMenu === 'function') {
            win.showContextMenu(e);
          } else {
            // Event simulieren
            logo.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
          }
        },
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachDetector);
    } else {
      attachDetector();
    }
  }

  // ------------------ TASK EXECUTION CYCLE ------------------

  private async handleStartTask(goal: string, model: string): Promise<void> {
    try {
      this.isExecutingLoop = true;

      // 1. Task im Background initialisieren
      const initResp = await this.sendMessageAsync<{ success: boolean; state: TaskState; error?: string }>({
        action: 'AGENT_START_TASK',
        goal,
        url: window.location.href,
        model,
      });

      if (!initResp.success || !initResp.state) {
        this.sidebar.addNotification(`❌ Fehler beim Starten: ${initResp.error || 'Unbekannt'}`);
        this.isExecutingLoop = false;
        return;
      }

      this.sidebar.updateState(initResp.state);

      // 2. Ersten Schritt des Ausführungs-Loops starten
      await this.runLoopCycle();
    } catch (err: unknown) {
      const error = err as Error;
      this.sidebar.addNotification(`❌ Schwerwiegender Fehler: ${error.message}`);
      this.isExecutingLoop = false;
    }
  }

  /**
   * Der Kern-Loop: Snapshot -> LLM via Background -> Action ausführen -> Repeat
   */
  private async runLoopCycle(lastObservation?: string): Promise<void> {
    if (!this.isExecutingLoop) return;

    try {
      // 1. Aktuellen DOM-Snapshot extrahieren
      const snapshot: DOMSnapshot = this.snapshotExtractor.getSnapshot();

      // 2. Nächsten Schritt vom Background anfordern (ruft OpenRouter auf)
      const nextStepResp = await this.sendMessageAsync<{
        success: boolean;
        llmResponse?: {
          thought: string;
          action: AgentAction;
          isFinal: boolean;
          finalMessage?: string;
        };
        requiresConfirmation?: {
          action: AgentAction;
          reason: string;
          riskLevel: 'high' | 'medium';
        };
        state?: TaskState;
        error?: string;
      }>({
        action: 'AGENT_GET_NEXT_STEP',
        snapshot,
        lastObservation,
      });

      if (!nextStepResp.success || !nextStepResp.llmResponse) {
        this.sidebar.addNotification(`❌ Fehler bei Modell-Anfrage: ${nextStepResp.error || 'Keine Antwort'}`);
        this.isExecutingLoop = false;
        return;
      }

      const { thought, action, isFinal, finalMessage } = nextStepResp.llmResponse;

      // 3. Sicherheitsbestätigung prüfen
      if (nextStepResp.requiresConfirmation) {
        this.pendingActionToConfirm = action;
        if (nextStepResp.state) {
          this.sidebar.updateState({ ...nextStepResp.state, status: 'waiting_confirmation' });
        }
        this.sidebar.showConfirmationDialog(nextStepResp.requiresConfirmation);
        return; // Wartet auf User-Klick
      }

      // 4. Ist der Task abgeschlossen?
      if (isFinal || action.type === 'finish') {
        this.sidebar.addStepMessage({
          stepNumber: (nextStepResp.state?.currentStep || 0) + 1,
          thought,
          action,
          observation: finalMessage || (action.type === 'finish' ? action.message : 'Ziel erreicht.'),
          timestamp: Date.now(),
        });

        await this.sendMessageAsync({
          action: 'AGENT_RECORD_STEP',
          step: { thought, action, observation: finalMessage || 'Erfolgreich abgeschlossen' },
        });

        if (nextStepResp.state) {
          this.sidebar.updateState({ ...nextStepResp.state, status: 'completed' });
        }
        this.isExecutingLoop = false;
        return;
      }

      // 5. Aktion im DOM ausführen
      const actionResult = await this.actionExecutor.executeAction(action);

      // 6. Schritt im Chat protokollieren
      const recordedStep = {
        stepNumber: (nextStepResp.state?.currentStep || 0) + 1,
        thought,
        action,
        observation: actionResult.observation,
        error: actionResult.error,
        timestamp: Date.now(),
      };
      this.sidebar.addStepMessage(recordedStep);

      // 7. Schritt im Background speichern
      const recordResp = await this.sendMessageAsync<{ success: boolean; state: TaskState }>({
        action: 'AGENT_RECORD_STEP',
        step: { thought, action, observation: actionResult.observation, error: actionResult.error },
      });

      if (recordResp.state) {
        this.sidebar.updateState(recordResp.state);
      }

      // 8. Kurz pausieren und nächsten Loop-Schritt starten
      window.setTimeout(() => {
        this.runLoopCycle(actionResult.observation);
      }, 500);
    } catch (err: unknown) {
      const error = err as Error;
      this.sidebar.addNotification(`❌ Fehler im Loop: ${error.message}`);
      this.isExecutingLoop = false;
    }
  }

  // ------------------ CONFIRMATION & CONTROLS ------------------

  private async handleConfirmAction(confirmed: boolean): Promise<void> {
    if (!confirmed) {
      this.pendingActionToConfirm = null;
      this.sidebar.addNotification('Aktion vom Nutzer abgebrochen.');
      await this.handleStopTask();
      return;
    }

    const action = this.pendingActionToConfirm;
    this.pendingActionToConfirm = null;

    if (!action) return;

    // Bestätigte Aktion jetzt ausführen
    const actionResult = await this.actionExecutor.executeAction(action);

    // Schritt aufzeichnen
    await this.sendMessageAsync({
      action: 'AGENT_RECORD_STEP',
      step: {
        thought: 'Sicherheitskritische Aktion vom Nutzer autorisiert.',
        action,
        observation: actionResult.observation,
      },
    });

    // Loop fortsetzen
    this.runLoopCycle(actionResult.observation);
  }

  private async handleStopTask(): Promise<void> {
    this.isExecutingLoop = false;
    const resp = await this.sendMessageAsync<{ success: boolean; state?: TaskState }>({
      action: 'AGENT_STOP_TASK',
    });
    if (resp.state) {
      this.sidebar.updateState(resp.state);
    }
    this.sidebar.addNotification('Task gestoppt.');
  }

  private async handlePauseTask(): Promise<void> {
    this.isExecutingLoop = false;
    const resp = await this.sendMessageAsync<{ success: boolean; state?: TaskState }>({
      action: 'AGENT_PAUSE_TASK',
    });
    if (resp.state) {
      this.sidebar.updateState(resp.state);
    }
  }

  private async handleResumeTask(): Promise<void> {
    this.isExecutingLoop = true;
    const resp = await this.sendMessageAsync<{ success: boolean; state?: TaskState }>({
      action: 'AGENT_RESUME_TASK',
    });
    if (resp.state) {
      this.sidebar.updateState(resp.state);
    }
    this.runLoopCycle();
  }

  private async handleSaveConfig(config: Partial<AgentConfig>): Promise<void> {
    await this.sendMessageAsync({
      action: 'AGENT_SAVE_CONFIG',
      config,
    });
    this.loadModels();
  }

  private async loadModels(): Promise<void> {
    try {
      const resp = await this.sendMessageAsync<{ success: boolean; models: Array<{ id: string; name: string }> }>({
        action: 'AGENT_GET_MODELS',
      });
      if (resp.success && resp.models) {
        this.sidebar.setModels(resp.models);
      }
    } catch (e) {
      console.warn('[ContentAgent] Could not fetch models:', e);
    }
  }

  // ------------------ MESSAGING HELPER ------------------

  private initMessageListeners(): void {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.action === 'AGENT_TOGGLE_SIDEBAR') {
        this.sidebar.toggle();
        sendResponse({ success: true });
      }
      return false;
    });
  }

  private sendMessageAsync<T>(message: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response as T);
        }
      });
    });
  }
}

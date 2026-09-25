/**
 * agent.ts
 * TypeScript-Interfaces & Type Guards für den CompAInion Autopilot-Agenten
 */

export type AgentActionType =
  | 'click'
  | 'type'
  | 'scroll'
  | 'navigate'
  | 'wait'
  | 'finish'
  | 'ask_user';

export interface BaseAction {
  type: AgentActionType;
  description?: string;
}

export interface ClickAction extends BaseAction {
  type: 'click';
  selector: string;
  waitForNavigation?: boolean;
}

export interface TypeAction extends BaseAction {
  type: 'type';
  selector: string;
  text: string;
  pressEnter?: boolean;
  clearFirst?: boolean;
}

export interface ScrollAction extends BaseAction {
  type: 'scroll';
  direction?: 'up' | 'down' | 'top' | 'bottom';
  selector?: string;
  coordinates?: { x: number; y: number };
  distance?: number;
}

export interface NavigateAction extends BaseAction {
  type: 'navigate';
  url: string;
}

export interface WaitAction extends BaseAction {
  type: 'wait';
  durationMs?: number;
}

export interface FinishAction extends BaseAction {
  type: 'finish';
  message: string;
  success: boolean;
}

export interface AskUserAction extends BaseAction {
  type: 'ask_user';
  question: string;
}

export type AgentAction =
  | ClickAction
  | TypeAction
  | ScrollAction
  | NavigateAction
  | WaitAction
  | FinishAction
  | AskUserAction;

export interface LLMResponse {
  thought: string;
  action: AgentAction;
  isFinal: boolean;
  finalMessage?: string;
}

export interface InteractiveElement {
  id: string; // e.g. "elem-1", "elem-2"
  selector: string;
  tagName: string;
  role?: string;
  type?: string;
  text: string;
  name?: string;
  placeholder?: string;
  value?: string;
  href?: string;
  ariaLabel?: string;
  isVisible: boolean;
  isInteractive: boolean;
  bounds: { top: number; left: number; width: number; height: number };
}

export interface DOMSnapshot {
  title: string;
  url: string;
  elements: InteractiveElement[];
  textSummary: string;
  viewport: { width: number; height: number; scrollY: number };
  tokenEstimate: number;
}

export type TaskStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'waiting_confirmation'
  | 'completed'
  | 'error';

export interface TaskStep {
  stepNumber: number;
  thought: string;
  action: AgentAction;
  observation?: string;
  timestamp: number;
  screenshotUrl?: string;
  error?: string;
}

export interface PendingConfirmation {
  action: AgentAction;
  reason: string;
  riskLevel: 'high' | 'medium';
}

export interface TaskState {
  taskId: string;
  status: TaskStatus;
  goal: string;
  model: string;
  currentStep: number;
  maxSteps: number;
  currentUrl: string;
  steps: TaskStep[];
  pendingConfirmation?: PendingConfirmation;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AgentConfig {
  openRouterApiKey: string;
  selectedModel: string;
  maxSteps: number;
  autoConfirmSafeActions: boolean;
  highlightActions: boolean;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

// ----------------- TYPE GUARDS -----------------

export function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export function isAgentAction(val: unknown): val is AgentAction {
  if (!isRecord(val)) return false;
  if (typeof val.type !== 'string') return false;

  switch (val.type) {
    case 'click':
      return typeof val.selector === 'string' && val.selector.trim().length > 0;
    case 'type':
      return (
        typeof val.selector === 'string' &&
        val.selector.trim().length > 0 &&
        typeof val.text === 'string'
      );
    case 'scroll':
      return (
        val.direction === undefined ||
        ['up', 'down', 'top', 'bottom'].includes(val.direction as string) ||
        typeof val.selector === 'string' ||
        isRecord(val.coordinates)
      );
    case 'navigate':
      return typeof val.url === 'string' && val.url.trim().length > 0;
    case 'wait':
      return val.durationMs === undefined || typeof val.durationMs === 'number';
    case 'finish':
      return typeof val.message === 'string' && typeof val.success === 'boolean';
    case 'ask_user':
      return typeof val.question === 'string' && val.question.trim().length > 0;
    default:
      return false;
  }
}

export function isLLMResponse(val: unknown): val is LLMResponse {
  if (!isRecord(val)) return false;
  if (typeof val.thought !== 'string') return false;
  if (typeof val.isFinal !== 'boolean') return false;
  if (!isAgentAction(val.action)) return false;
  if (val.finalMessage !== undefined && typeof val.finalMessage !== 'string') return false;
  return true;
}

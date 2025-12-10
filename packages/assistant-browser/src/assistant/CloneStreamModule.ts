/**
 * CloneStreamModule - Clones media streams and handles user action mimicking.
 * Provides keyboard-driven interaction and action logging.
 */
export interface ActionLog {
  timestamp: string;
  action: string;
  target?: string;
  context?: Record<string, any>;
}

export class CloneStreamModule {
  private static instance: CloneStreamModule;
  private actionLogs: ActionLog[] = [];

  private constructor() {}

  static getInstance(): CloneStreamModule {
    if (!CloneStreamModule.instance) {
      CloneStreamModule.instance = new CloneStreamModule();
    }
    return CloneStreamModule.instance;
  }

  /**
   * Clones a media stream and sets up keyboard event listeners for action mimicking.
   * Supports Enter and Space for triggering element clicks.
   */
  async cloneAndMimic(stream: MediaStream): Promise<MediaStream> {
    const clonedStream = stream.clone();

    // Setup keyboard event listener for mimicking user actions
    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const activeElement = document.activeElement as HTMLElement | null;
        if (activeElement) {
          console.log(`Mimic: Triggered click on ${activeElement.tagName}#${activeElement.id}`);
          this.logAction('keyboard_click', activeElement.id || activeElement.tagName, {
            key: e.key,
            element: activeElement.tagName,
          });
          activeElement.click();
        }
      }
    };

    document.addEventListener('keydown', keydownHandler);
    return clonedStream;
  }

  /**
   * Mimics a keyboard key press programmatically.
   */
  async mimicKeyPress(key: string, targetSelector?: string): Promise<void> {
    const target = targetSelector
      ? (document.querySelector(targetSelector) as HTMLElement | null)
      : document.activeElement;

    if (!target) {
      console.warn(`No target element found for key press: ${key}`);
      return;
    }

    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });

    target.dispatchEvent(event);
    this.logAction('mimic_keypress', target.id || target.tagName, { key });
  }

  /**
   * Logs a user action with context metadata.
   */
  logAction(action: string, target?: string, context?: Record<string, any>): void {
    const log: ActionLog = {
      timestamp: new Date().toISOString(),
      action,
      target,
      context,
    };
    this.actionLogs.push(log);
    console.log('[ActionLog]', log);
  }

  /**
   * Retrieves all logged actions.
   */
  getActionLogs(): ActionLog[] {
    return [...this.actionLogs];
  }

  /**
   * Clears action log.
   */
  clearLogs(): void {
    this.actionLogs = [];
  }
}

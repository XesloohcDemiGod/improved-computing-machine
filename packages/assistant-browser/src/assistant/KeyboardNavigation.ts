/**
 * KeyboardNavigation - Handles SAP-specific keyboard shortcuts and custom navigation.
 * Supports F3, F8, /nXXXX transaction codes, and custom tab ordering.
 */
export class KeyboardNavigation {
  private sapShortcuts: Map<string, () => void> = new Map();
  private isAccessibilityMode = false;

  constructor() {
    this.initializeSapShortcuts();
  }

  /**
   * Initialize SAP standard shortcuts.
   */
  private initializeSapShortcuts(): void {
    // F3 = Back/Exit
    this.sapShortcuts.set('F3', () => this.handleSapBack());

    // F8 = Execute/Enter
    this.sapShortcuts.set('F8', () => this.handleSapExecute());

    // F5 = Refresh
    this.sapShortcuts.set('F5', () => this.handleSapRefresh());

    // F1 = Help
    this.sapShortcuts.set('F1', () => this.handleSapHelp());

    // Ctrl+S = Save
    this.sapShortcuts.set('ctrl+s', () => this.handleSapSave());
  }

  /**
   * Handle SAP Back (F3).
   */
  private handleSapBack(): void {
    console.log('[SAP] Back (F3) pressed');
    const backButton = document.querySelector('[data-testid="back"], button[aria-label*="Back"], [title*="Back"]');
    if (backButton instanceof HTMLElement) {
      backButton.click();
    } else {
      console.warn('[SAP] Back button not found');
    }
  }

  /**
   * Handle SAP Execute (F8).
   */
  private handleSapExecute(): void {
    console.log('[SAP] Execute (F8) pressed');
    const executeButton = document.querySelector(
      '[data-testid="execute"], button:has-text("Execute"), button[aria-label*="Execute"]'
    );
    if (executeButton instanceof HTMLElement) {
      executeButton.click();
    } else {
      console.warn('[SAP] Execute button not found');
    }
  }

  /**
   * Handle SAP Refresh (F5).
   */
  private handleSapRefresh(): void {
    console.log('[SAP] Refresh (F5) pressed');
    window.location.reload();
  }

  /**
   * Handle SAP Help (F1).
   */
  private handleSapHelp(): void {
    console.log('[SAP] Help (F1) pressed');
    const helpButton = document.querySelector('[aria-label*="Help"], button:has-text("Help")');
    if (helpButton instanceof HTMLElement) {
      helpButton.click();
    } else {
      console.warn('[SAP] Help button not found');
    }
  }

  /**
   * Handle SAP Save (Ctrl+S).
   */
  private handleSapSave(): void {
    console.log('[SAP] Save (Ctrl+S) pressed');
    const saveButton = document.querySelector(
      '[data-testid="save"], button:has-text("Save"), button[aria-label*="Save"]'
    );
    if (saveButton instanceof HTMLElement) {
      saveButton.click();
    } else {
      console.warn('[SAP] Save button not found');
    }
  }

  /**
   * Handle /nXXXX transaction code entry.
   */
  handleTransactionCodeEntry(code: string): void {
    console.log(`[SAP] Transaction code entered: /n${code}`);
    const commandInput = document.querySelector(
      '[id*="cmd"], [placeholder*="Command"], [aria-label*="Command"]'
    ) as HTMLInputElement | null;

    if (commandInput) {
      commandInput.focus();
      commandInput.value = `/n${code}`;
      commandInput.dispatchEvent(new Event('change', { bubbles: true }));
      commandInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    } else {
      console.warn('[SAP] Command input not found');
    }
  }

  /**
   * Override default tab order for accessibility.
   */
  overrideTabOrder(elementList: HTMLElement[]): void {
    elementList.forEach((el, index) => {
      el.setAttribute('tabindex', String(index));
    });
    console.log(`[A11y] Tab order overridden for ${elementList.length} elements`);
  }

  /**
   * Enable accessibility support (screen reader friendly).
   */
  enableAccessibilityMode(): void {
    this.isAccessibilityMode = true;
    document.documentElement.setAttribute('role', 'application');
    document.body.setAttribute('aria-live', 'polite');
    console.log('[A11y] Accessibility mode enabled');
  }

  /**
   * Get SAP shortcut.
   */
  getSapShortcut(key: string): (() => void) | undefined {
    return this.sapShortcuts.get(key);
  }

  /**
   * Register custom shortcut.
   */
  registerShortcut(key: string, handler: () => void): void {
    this.sapShortcuts.set(key, handler);
    console.log(`[Shortcut] Registered: ${key}`);
  }

  /**
   * Attach keyboard listener.
   */
  attachKeyboardListener(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      let shortcutKey = e.key;
      if (e.ctrlKey) shortcutKey = `ctrl+${e.key.toLowerCase()}`;
      if (e.shiftKey) shortcutKey = `shift+${shortcutKey}`;

      const handler = this.sapShortcuts.get(shortcutKey);
      if (handler) {
        e.preventDefault();
        handler();
      }
    });
  }
}

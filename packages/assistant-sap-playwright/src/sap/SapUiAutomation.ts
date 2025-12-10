import { Page } from '@playwright/test';

/**
 * SAP UI5 Control Types commonly found in SAP Fiori / WebGUI
 */
export type SapControlType =
  | 'sap.m.Button'
  | 'sap.m.Input'
  | 'sap.m.Table'
  | 'sap.ui.table.Table'
  | 'sap.m.Select'
  | 'sap.m.DatePicker'
  | 'unknown';

/**
 * SapUiAutomation - Provides Playwright-based selectors and actions for SAP UI5.
 * Handles SAP-specific navigation, field input, and control interaction.
 */
export class SapUiAutomation {
  constructor(private page: Page) {}

  /**
   * Navigate to a SAP transaction using the transaction code.
   * Assumes the SAP command field is visible.
   */
  async navigateToTransaction(transactionCode: string): Promise<void> {
    console.log(`SAP: Navigating to transaction ${transactionCode}`);

    // Try to find the command input field
    const commandInput = this.page.locator('[id*="cmd"], [placeholder*="Command"], [aria-label*="Command"]').first();

    if (await commandInput.isVisible()) {
      await commandInput.click();
      await commandInput.clear();
      await commandInput.fill(transactionCode);
      await this.page.keyboard.press('Enter');
    } else {
      throw new Error(`Command input not found for transaction ${transactionCode}`);
    }

    // Wait for navigation
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Input a value into a SAP field by field ID or label.
   */
  async inputField(fieldId: string, value: string): Promise<void> {
    console.log(`SAP: Inputting "${value}" into field ${fieldId}`);

    const field = this.page.locator(`[id*="${fieldId}"]`).first();

    if (await field.isVisible()) {
      await field.click();
      await field.clear();
      await field.fill(value);
    } else {
      throw new Error(`Field ${fieldId} not found`);
    }
  }

  /**
   * Click a SAP button by ID or label.
   */
  async clickButton(buttonId: string): Promise<void> {
    console.log(`SAP: Clicking button ${buttonId}`);

    const button = this.page
      .locator(`button[id*="${buttonId}"], button:has-text("${buttonId}")`).
      first();

    if (await button.isVisible()) {
      await button.click();
      await this.page.waitForLoadState('networkidle');
    } else {
      throw new Error(`Button ${buttonId} not found`);
    }
  }

  /**
   * Wait for a SAP UI element to appear.
   */
  async waitForElement(selector: string, timeout: number = 5000): Promise<void> {
    console.log(`SAP: Waiting for element ${selector}`);
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Detect the SAP UI5 control type of an element.
   * This is a simple heuristic based on CSS classes.
   */
  async getSapControlType(selector: string): Promise<SapControlType> {
    const element = this.page.locator(selector).first();
    const classAttr = await element.getAttribute('class');

    if (!classAttr) {
      return 'unknown';
    }

    // Heuristic detection based on SAP UI5 CSS classes
    if (classAttr.includes('sapMBtn')) return 'sap.m.Button';
    if (classAttr.includes('sapMInput')) return 'sap.m.Input';
    if (classAttr.includes('sapMTable')) return 'sap.m.Table';
    if (classAttr.includes('sapUiTable')) return 'sap.ui.table.Table';
    if (classAttr.includes('sapMSelect')) return 'sap.m.Select';
    if (classAttr.includes('sapMDatePicker')) return 'sap.m.DatePicker';

    return 'unknown';
  }

  /**
   * Get the current page title (useful for verification).
   */
  async getPageTitle(): Promise<string> {
    return this.page.title();
  }
}

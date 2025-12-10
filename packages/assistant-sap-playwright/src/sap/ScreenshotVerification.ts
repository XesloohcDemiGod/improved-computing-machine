import { Page } from '@playwright/test';

export interface VerificationResult {
  isValid: boolean;
  checks: {
    titleMatch: boolean;
    elementPresent: boolean;
    contentPresent: boolean;
  };
  details: string[];
}

/**
 * ScreenshotVerification - Verifies SAP screenshots through DOM checks and content validation.
 */
export class ScreenshotVerification {
  constructor(private page: Page) {}

  /**
   * Verify page title matches expected value.
   */
  async verifyPageTitle(expectedTitle: string): Promise<boolean> {
    const title = await this.page.title();
    const matches = title.includes(expectedTitle);
    console.log(`[Verify] Title check: "${title}" ${matches ? 'matches' : 'does not match'} "${expectedTitle}"`);
    return matches;
  }

  /**
   * Verify element presence by selector.
   */
  async verifyElementPresent(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      const isVisible = await element.isVisible();
      console.log(`[Verify] Element ${selector} ${isVisible ? 'is visible' : 'is not visible'}`);
      return isVisible;
    } catch (error) {
      console.warn(`[Verify] Element check failed for ${selector}:`, error);
      return false;
    }
  }

  /**
   * Verify content presence by text.
   */
  async verifyContentPresent(text: string): Promise<boolean> {
    try {
      const element = this.page.locator(`text=${text}`).first();
      const isVisible = await element.isVisible();
      console.log(`[Verify] Content "${text}" ${isVisible ? 'found' : 'not found'}`);
      return isVisible;
    } catch (error) {
      console.warn(`[Verify] Content check failed for "${text}":`, error);
      return false;
    }
  }

  /**
   * Comprehensive screen verification with multiple checks.
   */
  async verifyScreen(options: {
    expectedTitle?: string;
    requiredElements?: string[];
    requiredContent?: string[];
  }): Promise<VerificationResult> {
    const details: string[] = [];
    const checks = {
      titleMatch: true,
      elementPresent: true,
      contentPresent: true,
    };

    // Title check
    if (options.expectedTitle) {
      const titleMatch = await this.verifyPageTitle(options.expectedTitle);
      checks.titleMatch = titleMatch;
      details.push(`Title: ${titleMatch ? 'PASS' : 'FAIL'} (expected: "${options.expectedTitle}")`);
    }

    // Element checks
    if (options.requiredElements && options.requiredElements.length > 0) {
      for (const selector of options.requiredElements) {
        const elementPresent = await this.verifyElementPresent(selector);
        if (!elementPresent) {
          checks.elementPresent = false;
          details.push(`Element "${selector}": FAIL`);
        } else {
          details.push(`Element "${selector}": PASS`);
        }
      }
    }

    // Content checks
    if (options.requiredContent && options.requiredContent.length > 0) {
      for (const text of options.requiredContent) {
        const contentPresent = await this.verifyContentPresent(text);
        if (!contentPresent) {
          checks.contentPresent = false;
          details.push(`Content "${text}": FAIL`);
        } else {
          details.push(`Content "${text}": PASS`);
        }
      }
    }

    const isValid = checks.titleMatch && checks.elementPresent && checks.contentPresent;

    return { isValid, checks, details };
  }

  /**
   * Detect SAP transaction screen type.
   */
  async detectScreenType(): Promise<string> {
    const url = this.page.url();
    const title = await this.page.title();

    if (url.includes('/sap/') || url.includes('sap.com')) {
      if (title.includes('List')) return 'list';
      if (title.includes('Form') || title.includes('Detail')) return 'form';
      if (title.includes('Dialog')) return 'dialog';
      return 'sap-page';
    }

    return 'unknown';
  }

  /**
   * Capture screenshot metadata.
   */
  async captureScreenMetadata() {
    let userAgent = 'unknown';
    try {
      userAgent = await this.page.evaluate(() => (globalThis as any).navigator?.userAgent || 'unknown');
    } catch (e) {
      console.warn('Failed to capture user agent');
    }

    return {
      url: this.page.url(),
      title: await this.page.title(),
      screenType: await this.detectScreenType(),
      timestamp: new Date().toISOString(),
      userAgent,
    };
  }
}

import { ScreenshotModule } from './ScreenshotModule';
import { CloneStreamModule, ActionLog } from './CloneStreamModule';

export interface OrchestratorContext {
  attempt: number;
  timestamp: string;
  steps: string[];
  cacheKey: string;
  success: boolean;
}

/**
 * Orchestrator - Manages the flow of screenshot capture, stream cloning, and action mimicking.
 * Integrates with Workbox for caching and implements retry logic.
 */
export class Orchestrator {
  private static instance: Orchestrator;
  private context: OrchestratorContext[] = [];
  private maxRetries: number = 3;

  private constructor() {}

  static getInstance(): Orchestrator {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator();
    }
    return Orchestrator.instance;
  }

  setMaxRetries(retries: number): void {
    this.maxRetries = retries;
  }

  /**
   * Main orchestration flow: capture, verify, cache, and mimic actions.
   */
  async runFlow(): Promise<void> {
    const screenshotModule = ScreenshotModule.getInstance();
    const cloneModule = CloneStreamModule.getInstance();

    let retries = 0;
    let success = false;

    while (!success && retries < this.maxRetries) {
      retries++;
      console.log(`Orchestrator: Attempt ${retries}/${this.maxRetries}`);

      const timestamp = new Date().toISOString();
      const cacheKey = `/screenshot-${Date.now()}`;

      try {
        // Step 1: Capture screenshot
        const { blob, steps } = await screenshotModule.captureWithSteps();

        if (blob) {
          // Step 2: Cache the blob using Workbox/Cache API
          await this.cacheScreenshot(cacheKey, blob);

          // Step 3: Clone and setup stream for action mimicking
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          const cloned = await cloneModule.cloneAndMimic(stream);

          console.log('Orchestrator: Verification stream ready');

          this.context.push({
            attempt: retries,
            timestamp,
            steps,
            cacheKey,
            success: true,
          });

          success = true;
        } else {
          throw new Error('Failed to capture screenshot');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`Orchestrator: Attempt ${retries} failed - ${errorMsg}`);

        this.context.push({
          attempt: retries,
          timestamp,
          steps: [`Error: ${errorMsg}`],
          cacheKey,
          success: false,
        });

        if (retries < this.maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }

    if (!success) {
      console.error(`Orchestrator: Failed after ${this.maxRetries} attempts`);
    }
  }

  /**
   * Caches a screenshot blob using the Cache API (via Workbox).
   */
  private async cacheScreenshot(key: string, blob: Blob): Promise<void> {
    if (!('caches' in globalThis)) {
      console.warn('Cache API not available');
      return;
    }

    try {
      const cache = await caches.open('assistant-cache');
      const response = new Response(blob, {
        headers: {
          'Content-Type': 'image/png',
          'X-Cached-At': new Date().toISOString(),
        },
      });
      await cache.put(key, response);
      console.log(`Orchestrator: Cached screenshot at ${key}`);
    } catch (error) {
      console.error('Orchestrator: Failed to cache screenshot', error);
    }
  }

  /**
   * Retrieves the execution context/history.
   */
  getContext(): OrchestratorContext[] {
    return [...this.context];
  }

  /**
   * Clears execution context.
   */
  clearContext(): void {
    this.context = [];
  }

  /**
   * Gets the last successful cache key.
   */
  getLastCacheKey(): string | null {
    const successful = this.context.filter(c => c.success);
    return successful.length > 0 ? successful[successful.length - 1].cacheKey : null;
  }
}

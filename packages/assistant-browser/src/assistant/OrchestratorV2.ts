import { ScreenshotModule } from './ScreenshotModule';
import { CloneStreamModule, ActionLog } from './CloneStreamModule';

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface OrchestratorContextV2 {
  attempt: number;
  timestamp: string;
  steps: string[];
  cacheKey: string;
  success: boolean;
  durationMs: number;
  error?: string;
}

/**
 * OrchestratorV2 - Enhanced orchestration with exponential backoff, metrics, and error recovery.
 * Handles edge cases like network timeouts, permission denials, and stream failures.
 */
export class OrchestratorV2 {
  private static instance: OrchestratorV2;
  private context: OrchestratorContextV2[] = [];
  private retryPolicy: RetryPolicy = {
    maxRetries: 3,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
  };
  private operationTimeout = 30000; // 30 seconds default
  private metrics = {
    totalAttempts: 0,
    successfulAttempts: 0,
    totalTimeMs: 0,
  };

  private constructor() {}

  static getInstance(): OrchestratorV2 {
    if (!OrchestratorV2.instance) {
      OrchestratorV2.instance = new OrchestratorV2();
    }
    return OrchestratorV2.instance;
  }

  setRetryPolicy(policy: Partial<RetryPolicy>): void {
    this.retryPolicy = { ...this.retryPolicy, ...policy };
  }

  setOperationTimeout(ms: number): void {
    this.operationTimeout = ms;
  }

  /**
   * Calculate delay with exponential backoff and jitter.
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.retryPolicy.initialDelayMs * Math.pow(this.retryPolicy.backoffMultiplier, attempt - 1),
      this.retryPolicy.maxDelayMs
    );
    // Add jitter (±20%)
    const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
    return exponentialDelay + jitter;
  }

  /**
   * Wrap async operation with timeout.
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timeout after ${ms}ms`)), ms)
      ),
    ]);
  }

  /**
   * Main orchestration flow with comprehensive error handling.
   */
  async runFlow(): Promise<boolean> {
    const screenshotModule = ScreenshotModule.getInstance();
    const cloneModule = CloneStreamModule.getInstance();
    const startTime = Date.now();

    let retries = 0;
    let success = false;

    while (!success && retries < this.retryPolicy.maxRetries) {
      retries++;
      this.metrics.totalAttempts++;
      const attemptStartTime = Date.now();
      const timestamp = new Date().toISOString();
      const cacheKey = `/screenshot-${Date.now()}`;

      try {
        console.log(`Orchestrator: Attempt ${retries}/${this.retryPolicy.maxRetries}`);

        // Step 1: Capture screenshot with timeout
        let { blob, steps } = await this.withTimeout(
          screenshotModule.captureWithSteps(),
          this.operationTimeout
        );

        if (!blob) {
          throw new Error('Screenshot blob is null - capture failed');
        }

        // Step 2: Cache the blob
        await this.cacheScreenshot(cacheKey, blob);
        steps.push('Step 6: Screenshot cached successfully');

        // Step 3: Clone and setup stream
        const stream = await this.withTimeout(
          navigator.mediaDevices.getDisplayMedia({ video: true }),
          this.operationTimeout
        );

        if (!stream) {
          throw new Error('Failed to get media stream');
        }

        const cloned = await cloneModule.cloneAndMimic(stream);
        steps.push('Step 7: Stream cloned and action listeners attached');

        const durationMs = Date.now() - attemptStartTime;

        this.context.push({
          attempt: retries,
          timestamp,
          steps,
          cacheKey,
          success: true,
          durationMs,
        });

        this.metrics.successfulAttempts++;
        console.log(`Orchestrator: Success on attempt ${retries} (${durationMs}ms)`);
        success = true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const durationMs = Date.now() - attemptStartTime;

        console.warn(`Orchestrator: Attempt ${retries} failed - ${errorMsg} (${durationMs}ms)`);

        this.context.push({
          attempt: retries,
          timestamp,
          steps: [`Error: ${errorMsg}`],
          cacheKey,
          success: false,
          durationMs,
          error: errorMsg,
        });

        // Determine if error is retryable
        if (this.isRetryableError(errorMsg) && retries < this.retryPolicy.maxRetries) {
          const delayMs = this.calculateDelay(retries);
          console.log(`Orchestrator: Waiting ${delayMs.toFixed(0)}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else if (!this.isRetryableError(errorMsg)) {
          console.error(`Orchestrator: Non-retryable error - giving up: ${errorMsg}`);
          break;
        }
      }
    }

    this.metrics.totalTimeMs = Date.now() - startTime;

    if (!success) {
      console.error(
        `Orchestrator: Failed after ${retries}/${this.retryPolicy.maxRetries} attempts (${this.metrics.totalTimeMs}ms)`
      );
    }

    return success;
  }

  /**
   * Determine if an error is retryable.
   */
  private isRetryableError(errorMsg: string): boolean {
    const retryablePatterns = [
      'timeout',
      'network',
      'FAILED_TO_START_DEVICE',
      'NotFoundError',
      'temporary',
    ];
    return retryablePatterns.some(pattern => errorMsg.toLowerCase().includes(pattern.toLowerCase()));
  }

  /**
   * Caches screenshot with error handling.
   */
  private async cacheScreenshot(key: string, blob: Blob): Promise<void> {
    if (!('caches' in globalThis)) {
      console.warn('Cache API not available - skipping cache');
      return;
    }

    try {
      const cache = await caches.open('assistant-cache');
      const response = new Response(blob, {
        headers: {
          'Content-Type': 'image/png',
          'X-Cached-At': new Date().toISOString(),
          'Cache-Control': 'public, max-age=86400',
        },
      });
      await cache.put(key, response);
      console.log(`Orchestrator: Cached screenshot at ${key}`);
    } catch (error) {
      console.error('Orchestrator: Cache error (non-fatal):', error);
      // Don't throw - caching is non-critical
    }
  }

  /**
   * Get execution metrics.
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: (this.metrics.successfulAttempts / this.metrics.totalAttempts) * 100,
      avgTimePerAttemptMs: this.metrics.totalTimeMs / this.metrics.totalAttempts,
    };
  }

  /**
   * Get execution context.
   */
  getContext(): OrchestratorContextV2[] {
    return [...this.context];
  }

  /**
   * Clear context.
   */
  clearContext(): void {
    this.context = [];
    this.metrics = { totalAttempts: 0, successfulAttempts: 0, totalTimeMs: 0 };
  }

  /**
   * Get last cache key.
   */
  getLastCacheKey(): string | null {
    const successful = this.context.filter(c => c.success);
    return successful.length > 0 ? successful[successful.length - 1].cacheKey : null;
  }
}

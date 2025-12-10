/**
 * ScreenshotModule - Captures screenshots from browser display and verifies capture integrity.
 * Uses MediaDevices.getDisplayMedia API and ImageCapture for frame grabbing.
 */

interface ImageCaptureLike {
  grabFrame(): Promise<ImageBitmap>;
}

export class ScreenshotModule {
  private static instance: ScreenshotModule;

  private constructor() {}

  static getInstance(): ScreenshotModule {
    if (!ScreenshotModule.instance) {
      ScreenshotModule.instance = new ScreenshotModule();
    }
    return ScreenshotModule.instance;
  }

  /**
   * Captures a screenshot with step-by-step documentation and verification.
   * @returns Promise containing blob and array of steps taken
   */
  async captureWithSteps(): Promise<{ blob: Blob | null; steps: string[] }> {
    const steps: string[] = [];
    try {
      steps.push('Step 1: Request screen capture permission');
      const stream = (await (navigator as any).mediaDevices.getDisplayMedia({ video: true })) as MediaStream;

      steps.push('Step 2: Capture video track from stream');
      const track = stream.getVideoTracks()[0];
      if (!track) {
        throw new Error('No video track found in stream');
      }

      const imageCapture = new (window as any).ImageCapture(track) as ImageCaptureLike;

      steps.push('Step 3: Grab frame from video track');
      const bitmap = await imageCapture.grabFrame();

      steps.push('Step 4: Draw frame onto canvas with verification marker');
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Unable to get 2D context from canvas');
      }

      ctx.drawImage(bitmap, 0, 0);
      // Add verification marker rectangle
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 100, 50);

      // Add timestamp
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '12px monospace';
      ctx.fillText(`Captured: ${new Date().toISOString()}`, 15, 30);

      // Stop the stream
      stream.getTracks().forEach(t => t.stop());

      steps.push('Step 5: Convert canvas to Blob for storage');
      return new Promise(resolve => {
        canvas.toBlob(blob => {
          resolve({ blob, steps });
        }, 'image/png');
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      steps.push(`Error occurred: ${errorMsg}`);
      return { blob: null, steps };
    }
  }

  /**
   * Captures a simple screenshot without steps documentation.
   * Useful for quick captures during automation.
   */
  async captureSimple(): Promise<Blob | null> {
    try {
      const { blob } = await this.captureWithSteps();
      return blob;
    } catch {
      return null;
    }
  }
}

/**
 * AI Orchestrator - Main coordination engine
 * Combines Playwright automation with AI-driven decision making
 */

import { OpenAIAdapter, WorkflowContext, AIDecision, WorkflowStep } from './openai-adapter';
import { ConfigManager } from './config';

export interface AutomationTask {
  id: string;
  description: string;
  objectives: string[];
  maxSteps: number;
  timeout: number;
}

export interface ExecutionResult {
  taskId: string;
  status: 'success' | 'failed' | 'timeout';
  steps: ExecutionStep[];
  finalDecision: AIDecision | null;
  error?: string;
}

export interface ExecutionStep {
  stepNumber: number;
  action: string;
  decision: AIDecision;
  result: any;
  timestamp: Date;
}

export class AIOrchestrator {
  private aiAdapter: OpenAIAdapter;
  private config = ConfigManager.getInstance().getAIConfig();
  private executionHistory: ExecutionStep[] = [];

  constructor() {
    this.aiAdapter = new OpenAIAdapter();
  }

  /**
   * Execute an automation task with AI assistance
   */
  async executeTask(task: AutomationTask): Promise<ExecutionResult> {
    const startTime = Date.now();
    const steps: ExecutionStep[] = [];
    let currentDecision: AIDecision | null = null;

    try {
      console.log(`[AI-Orchestrator] Starting task: ${task.id}`);
      console.log(`[AI-Orchestrator] Objectives: ${task.objectives.join(', ')}`);

      // Step 1: Parse workflow description using AI
      console.log('[AI-Orchestrator] Parsing workflow with AI...');
      const workflowSteps = await this.aiAdapter.parseWorkflowDescription(
        task.description
      );
      console.log(`[AI-Orchestrator] Generated ${workflowSteps.length} automation steps`);

      // Step 2: Execute each step with AI monitoring
      for (let i = 0; i < Math.min(workflowSteps.length, task.maxSteps); i++) {
        // Check timeout
        if (Date.now() - startTime > task.timeout) {
          return this.createFailureResult(task.id, steps, 'timeout', 'Task execution timeout');
        }

        const step = workflowSteps[i];
        console.log(`[AI-Orchestrator] Executing step ${i + 1}: ${step.action}`);

        try {
          // Build execution context
          const context: WorkflowContext = {
            currentTransaction: 'current-context',
            screenState: 'step-' + i,
            recentActions: steps.map((s) => s.action),
            errorMessages: [],
            objectives: task.objectives,
          };

          // Get AI decision for this step
          currentDecision = await this.aiAdapter.analyzeContext(context);
          console.log(
            `[AI-Orchestrator] AI Decision (confidence: ${currentDecision.confidence}): ${currentDecision.action}`
          );

          // Execute the step (placeholder for actual automation)
          const result = await this.executeAutomationStep(step, currentDecision);

          steps.push({
            stepNumber: i + 1,
            action: step.action,
            decision: currentDecision,
            result,
            timestamp: new Date(),
          });
        } catch (stepError) {
          console.error(`[AI-Orchestrator] Step ${i + 1} failed: ${stepError}`);
          // Try to recover with AI suggestion
          const context: WorkflowContext = {
            currentTransaction: 'current-context',
            screenState: 'error-state',
            recentActions: steps.map((s) => s.action),
            errorMessages: [String(stepError)],
            objectives: task.objectives,
          };

          const suggestions = await this.aiAdapter.suggestErrorResolution(
            String(stepError),
            context
          );
          console.log('[AI-Orchestrator] Error recovery suggestions:', suggestions);

          // For demo purposes, continue. In production, you might retry here
          if (i === workflowSteps.length - 1) {
            // Last step failed
            return this.createFailureResult(task.id, steps, 'failed', String(stepError));
          }
        }
      }

      console.log(`[AI-Orchestrator] Task completed successfully in ${Date.now() - startTime}ms`);
      return {
        taskId: task.id,
        status: 'success',
        steps,
        finalDecision: currentDecision,
      };
    } catch (error) {
      console.error(`[AI-Orchestrator] Task failed: ${error}`);
      return this.createFailureResult(task.id, steps, 'failed', String(error));
    } finally {
      this.aiAdapter.clearHistory();
    }
  }

  /**
   * Execute individual automation step
   * This is a placeholder - integrate with actual Playwright/UIA executor
   */
  private async executeAutomationStep(
    step: WorkflowStep,
    decision: AIDecision
  ): Promise<any> {
    // Placeholder: In production, route to appropriate executor
    // if (step.target === 'web') {
    //   return await playwrightExecutor.execute(step);
    // } else if (step.target === 'desktop') {
    //   return await uiaExecutor.execute(step);
    // }

    return {
      success: true,
      message: `Executed ${step.action} with AI confidence ${decision.confidence}`,
    };
  }

  private createFailureResult(
    taskId: string,
    steps: ExecutionStep[],
    status: 'failed' | 'timeout',
    error: string
  ): ExecutionResult {
    return {
      taskId,
      status,
      steps,
      finalDecision: null,
      error,
    };
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): ExecutionStep[] {
    return this.executionHistory;
  }

  /**
   * Clear execution history
   */
  clearExecutionHistory(): void {
    this.executionHistory = [];
  }
}

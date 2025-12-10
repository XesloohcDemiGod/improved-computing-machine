/**
 * AI Orchestrator Package
 * Export main classes and interfaces
 */

export { AIOrchestrator, AutomationTask, ExecutionResult, ExecutionStep } from './ai-orchestrator';
export {
  OpenAIAdapter,
  WorkflowContext,
  AIDecision,
  WorkflowStep,
} from './openai-adapter';
export { ConfigManager } from './config';

// Example usage for demonstration
if (require.main === module) {
  const { AIOrchestrator } = require('./ai-orchestrator');

  const task = {
    id: 'demo-task-001',
    description: 'Create a purchase order in Fiori with vendor VENDOR-001 for 100 units',
    objectives: ['Create PO', 'Set vendor', 'Set quantity'],
    maxSteps: 10,
    timeout: 60000,
  };

  const orchestrator = new AIOrchestrator();
  console.log('🤖 AI Orchestrator Initialized');
  console.log('📋 Task:', task.id);
  console.log('🎯 Objectives:', task.objectives);
  console.log('\nNote: Full automation execution requires Playwright executor integration.');
}

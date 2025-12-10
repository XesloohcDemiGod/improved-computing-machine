# AI Orchestrator Module
## Intelligent SAP Automation with OpenAI Integration

### Overview

This module provides AI-driven orchestration for SAP automation workflows. It integrates OpenAI's GPT-4 with Playwright-based browser automation to create intelligent, context-aware SAP automation sequences.

### Key Features

✅ **AI-Powered Decision Making**: Uses GPT-4 to analyze SAP contexts and determine optimal actions
✅ **Secure Configuration**: Environment-based API key management (never in code)
✅ **Workflow Generation**: Converts natural language descriptions into automation steps
✅ **Error Recovery**: AI-suggested recovery strategies for automation failures
✅ **Conversation Context**: Maintains conversation history for intelligent decision making

### Architecture

```
Automation Task
      ↓
[AIOrchestrator]
      ↓
[OpenAIAdapter] ← GPT-4 API
      ↓
[Playwright/UIA Executor]
      ↓
SAP System
```

### Security-First Design

**CRITICAL**: Your API key should NEVER be in code!

#### Setup Instructions:

1. **Create `.env.local` file** (in root directory, NOT in git):
   ```bash
   cp packages/ai-orchestrator/.env.example .env.local
   ```

2. **Add your OpenAI API key** to `.env.local`:
   ```
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   OPENAI_MODEL=gpt-4
   ```

3. **IMPORTANT**: Add `.env.local` to `.gitignore`:
   ```bash
   echo ".env.local" >> .gitignore
   ```

### Installation

```bash
cd packages/ai-orchestrator
npm install
npm run build
```

### Usage

#### Basic Example:

```typescript
import { AIOrchestrator, AutomationTask } from '@improved-computing/ai-orchestrator';

const task: AutomationTask = {
  id: 'po-creation-001',
  description: 'Create a purchase order in Fiori for vendor ACME Corp',
  objectives: ['Navigate to PO app', 'Create new PO', 'Set vendor', 'Save'],
  maxSteps: 20,
  timeout: 120000,
};

const orchestrator = new AIOrchestrator();
const result = await orchestrator.executeTask(task);

console.log('Status:', result.status);
console.log('Steps executed:', result.steps.length);
result.steps.forEach((step) => {
  console.log(`Step ${step.stepNumber}: ${step.action}`);
  console.log(`  Decision: ${step.decision.action} (confidence: ${step.decision.confidence})`);
});
```

### Module Components

#### 1. ConfigManager
Handles secure environment variable management:
- Validates API key existence
- Masks sensitive keys in logs
- Provides typed configuration access

#### 2. OpenAIAdapter
Manages all LLM interactions:
- `analyzeContext()`: Determines next action based on current state
- `parseWorkflowDescription()`: Converts natural language to automation steps
- `suggestErrorResolution()`: Generates error recovery strategies
- Maintains conversation history for context continuity

#### 3. AIOrchestrator
Coordinates the complete automation flow:
- Parses workflow descriptions via AI
- Executes automation steps with AI monitoring
- Handles errors with AI-suggested recovery
- Tracks execution history

### Complete Automation Flow

```
1. Task Definition
   ↓ (Natural language description)
2. AI Workflow Parsing (GPT-4)
   ↓ (Generates structured steps)
3. For Each Step:
   a. Build Execution Context
   b. Get AI Decision (analyzeContext)
   c. Execute Automation Step
   d. Log Result
4. Error Handling:
   a. Detect Error
   b. Get Recovery Suggestions (GPT-4)
   c. Retry or Skip
5. Return Execution Results
```

### Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...          # Your OpenAI API key
OPENAI_MODEL=gpt-4                   # Model to use
OPENAI_MAX_TOKENS=2000               # Max response tokens
OPENAI_TEMPERATURE=0.7               # Creativity (0.0-1.0)
OPENAI_RETRY_ATTEMPTS=3              # API retry count
OPENAI_TIMEOUT=30000                 # Timeout in ms

# SAP Configuration (Optional)
SAP_SYSTEM=DEV                        # SAP system ID
SAP_USER=developer                    # Username
SAP_LANGUAGE=EN                       # Language
```

### API Reference

#### AIOrchestrator

```typescript
class AIOrchestrator {
  executeTask(task: AutomationTask): Promise<ExecutionResult>
  getExecutionHistory(): ExecutionStep[]
  clearExecutionHistory(): void
}
```

#### OpenAIAdapter

```typescript
class OpenAIAdapter {
  analyzeContext(context: WorkflowContext): Promise<AIDecision>
  parseWorkflowDescription(description: string): Promise<WorkflowStep[]>
  suggestErrorResolution(error: string, context: WorkflowContext): Promise<string[]>
  clearHistory(): void
}
```

### Integration with Playwright

To enable full automation, connect to Playwright executor:

```typescript
// In ai-orchestrator.ts, update executeAutomationStep:

private async executeAutomationStep(
  step: WorkflowStep,
  decision: AIDecision
): Promise<any> {
  if (step.target === 'web') {
    return await this.playwrightExecutor.execute(step);
  }
  // ... other executors
}
```

### Production Deployment

#### Pre-Deployment Checklist:

- [ ] API key stored in `.env.local` (not in git)
- [ ] `.env.local` in `.gitignore`
- [ ] Timeout settings appropriate for your workloads
- [ ] Error handling configured
- [ ] Logging enabled for audit trail
- [ ] Rate limits respected (OpenAI quotas)
- [ ] Monitoring/alerting in place

#### Cost Optimization:

- Use `gpt-3.5-turbo` for simple tasks (cheaper)
- Adjust `temperature` based on needs
- Set appropriate `max_tokens` limits
- Monitor API usage regularly

### Troubleshooting

#### "OPENAI_API_KEY environment variable is required"
- Ensure `.env.local` exists in root directory
- Verify `OPENAI_API_KEY` is set
- Check file permissions

#### "Could not parse JSON from response"
- AI response format issue
- Try again (may be transient)
- Check API model availability

#### "Task execution timeout"
- Increase timeout in task definition
- Check Playwright executor performance
- Verify SAP system responsiveness

### Next Steps

1. **Build**: `npm run build`
2. **Test**: Create test scenarios
3. **Integrate**: Connect to Playwright executor
4. **Deploy**: Follow production checklist

### License

MIT - See LICENSE file

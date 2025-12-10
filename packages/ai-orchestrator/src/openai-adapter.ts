/**
 * OpenAI Adapter - Handles all LLM interactions
 * Provides abstraction layer for AI decision making
 */

import OpenAI from 'openai';
import { ConfigManager } from './config';

export interface WorkflowContext {
  currentTransaction: string;
  screenState: string;
  recentActions: string[];
  errorMessages: string[];
  objectives: string[];
}

export interface AIDecision {
  action: string;
  reasoning: string;
  parameters: Record<string, any>;
  confidence: number;
}

export class OpenAIAdapter {
  private client: OpenAI;
  private config = ConfigManager.getInstance().getAIConfig();
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor() {
    this.client = new OpenAI({
      apiKey: this.config.openaiApiKey,
      timeout: this.config.timeout,
    });
  }

  /**
   * Analyze SAP automation context and determine next action
   */
  async analyzeContext(context: WorkflowContext): Promise<AIDecision> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(context);

      // Add to conversation history for context continuity
      this.conversationHistory.push({
        role: 'user',
        content: userPrompt,
      });

      const response = await this.callOpenAI(systemPrompt);

      this.conversationHistory.push({
        role: 'assistant',
        content: response,
      });

      return this.parseAIResponse(response);
    } catch (error) {
      throw new Error(`OpenAI analysis failed: ${error}`);
    }
  }

  /**
   * Extract workflow steps from natural language description
   */
  async parseWorkflowDescription(description: string): Promise<WorkflowStep[]> {
    const prompt = `
You are an SAP automation expert. Convert this natural language description into structured automation steps.
Return a JSON array of steps.

Description: "${description}"

Return format:
[
  { "target": "web", "action": "navigate", "url": "...", "description": "..." },
  { "target": "web", "action": "fill", "selector": "...", "value": "...", "description": "..." },
  { "target": "web", "action": "click", "selector": "...", "description": "..." }
]
`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.openaiModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, // Lower temperature for structured output
        max_tokens: this.config.maxTokens,
      });

      const content = response.choices[0].message.content || '';
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (!jsonMatch) throw new Error('Could not parse JSON from response');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Failed to parse workflow description: ${error}`);
    }
  }

  /**
   * Generate error resolution suggestions
   */
  async suggestErrorResolution(error: string, context: WorkflowContext): Promise<string[]> {
    const prompt = `
SAP Automation Error Context:
Error: ${error}
Current Transaction: ${context.currentTransaction}
Screen State: ${context.screenState}
Recent Actions: ${context.recentActions.join(', ')}

Provide 3 specific resolution steps.
`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.openaiModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content || '';
      return content.split('\n').filter((line) => line.trim().length > 0);
    } catch (error) {
      throw new Error(`Failed to suggest resolution: ${error}`);
    }
  }

  /**
   * Clear conversation history for new workflow
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  private buildSystemPrompt(): string {
    return `You are an expert SAP automation orchestrator. Your role is to:
1. Analyze SAP system states and determine optimal automation actions
2. Provide step-by-step guidance for SAP workflows
3. Suggest error recovery strategies
4. Generate efficient automation sequences

You have deep knowledge of:
- SAP Fiori applications
- Web Dynpro interfaces
- ABAP transactions
- SAP best practices

Always provide JSON-structured responses with clear reasoning.`;
  }

  private buildUserPrompt(context: WorkflowContext): string {
    return `
Current SAP Automation Context:
- Active Transaction: ${context.currentTransaction}
- Screen State: ${context.screenState}
- Objectives: ${context.objectives.join('; ')}
- Recent Actions: ${context.recentActions.join(', ')}
${context.errorMessages.length > 0 ? `- Errors: ${context.errorMessages.join(', ')}` : ''}

What should be the next action?
Respond with: { "action": "...", "reasoning": "...", "parameters": {...}, "confidence": 0.0-1.0 }
`;
  }

  private async callOpenAI(systemPrompt: string): Promise<string> {
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...this.conversationHistory,
    ];

    const response = await this.client.chat.completions.create({
      model: this.config.openaiModel,
      messages: messages,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    });

    return response.choices[0].message.content || '';
  }

  private parseAIResponse(response: string): AIDecision {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }
}

export interface WorkflowStep {
  target: 'web' | 'desktop' | 'auto';
  action: string;
  [key: string]: any;
}

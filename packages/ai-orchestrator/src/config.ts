/**
 * Secure Configuration Management
 * Handles OpenAI API key and environment variables safely
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

export interface AIConfig {
  openaiApiKey: string;
  openaiModel: string;
  maxTokens: number;
  temperature: number;
  retryAttempts: number;
  timeout: number;
}

export interface SAPConfig {
  sapSystem: string;
  sapUser: string;
  sapPassword: string;
  sapLanguage: string;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private aiConfig: AIConfig;
  private sapConfig: SAPConfig;

  private constructor() {
    this.validateEnvironment();
    this.aiConfig = this.loadAIConfig();
    this.sapConfig = this.loadSAPConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private validateEnvironment(): void {
    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        'OPENAI_API_KEY environment variable is required. ' +
        'Please set it in your .env.local file (NOT in code!)'
      );
    }

    // Validate API key format
    if (!process.env.OPENAI_API_KEY.startsWith('sk-proj-')) {
      console.warn(
        'Warning: OPENAI_API_KEY does not match expected format. ' +
        'Ensure it starts with sk-proj-'
      );
    }
  }

  private loadAIConfig(): AIConfig {
    return {
      openaiApiKey: process.env.OPENAI_API_KEY!,
      openaiModel: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      retryAttempts: parseInt(process.env.OPENAI_RETRY_ATTEMPTS || '3', 10),
      timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000', 10),
    };
  }

  private loadSAPConfig(): SAPConfig {
    return {
      sapSystem: process.env.SAP_SYSTEM || '',
      sapUser: process.env.SAP_USER || '',
      sapPassword: process.env.SAP_PASSWORD || '',
      sapLanguage: process.env.SAP_LANGUAGE || 'EN',
    };
  }

  getAIConfig(): AIConfig {
    return this.aiConfig;
  }

  getSAPConfig(): SAPConfig {
    return this.sapConfig;
  }

  /**
   * Safe API key accessor - returns masked key for logging
   */
  getMaskedApiKey(): string {
    const key = this.aiConfig.openaiApiKey;
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  }
}


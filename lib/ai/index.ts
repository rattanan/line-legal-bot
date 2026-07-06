/**
 * AI Module - Centralized AI Provider Interface
 * 
 * This module provides a unified interface for all AI operations.
 * Business logic should only call `ai.chat(messages)` and never
 * directly call Qwen or Gemini.
 * 
 * Architecture:
 * - provider.ts: Interface and error types
 * - qwen.ts: Primary AI provider (OpenAI-compatible API)
 * - gemini.ts: Fallback AI provider (Google GenAI)
 * - failover.ts: Automatic failover logic
 * - index.ts: Main entry point
 */

export { type AIProvider, type AIProviderType } from "./provider";
export { AIProviderError, AIProviderTimeoutError, AIProviderConnectionError, AIProviderHTTPError, AIProviderInvalidResponseError } from "./provider";
export { QwenProvider } from "./qwen";
export { GeminiProvider } from "./gemini";
export { FailoverManager } from "./failover";
export { getFailoverManager } from "./failover";

// Import the function to use it in this file
import { getFailoverManager as getManager } from "./failover";

/**
 * AI Chat Interface
 * This is the only interface that business logic should use.
 */
export interface AIChat {
  /**
   * Send a chat request to the AI provider with automatic failover
   * @param messages Array of message objects
   * @returns The AI response text
   */
  chat(messages: Array<{ role: "user" | "assistant" | "system"; content: string }>): Promise<string>;
}

/**
 * Get the AI chat instance
 * This is the only way business logic should interact with AI
 */
export function getAIChat(): AIChat {
  return getManager();
}

// Export singleton instance
export const ai = getAIChat();
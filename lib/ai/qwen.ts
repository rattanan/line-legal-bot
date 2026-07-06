import { AIProvider, AIProviderError, AIProviderTimeoutError, AIProviderConnectionError, AIProviderHTTPError, AIProviderInvalidResponseError } from "./provider";

/**
 * Qwen Provider - Uses OpenAI-compatible API
 * Primary AI provider for the application
 */
export class QwenProvider implements AIProvider {
  readonly name: "qwen" = "qwen";
  readonly model: string;

  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number = 30000; // 30 seconds

  constructor() {
    this.apiUrl = process.env.QWEN_API_URL || "http://1.179.140.78:8001/v1";
    this.apiKey = process.env.QWEN_API_KEY || "";
    this.model = process.env.QWEN_MODEL || "Qwen/Qwen3.6-27B";

    if (!this.apiKey) {
      console.warn("QWEN_API_KEY is not set. Qwen provider may fail.");
    }
  }

  getConfig(): { name: "qwen"; model: string } {
    return {
      name: this.name,
      model: this.model,
    };
  }

  async chat(messages: Array<{ role: "user" | "assistant" | "system"; content: string }>): Promise<string> {
    const startTime = Date.now();

    try {
      const response = await this.fetchWithTimeout(
        `${this.apiUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 512,
          }),
        },
        this.timeoutMs
      );

      const responseTime = Date.now() - startTime;
      console.log(`[AI Provider] Qwen - Response Time: ${responseTime} ms`);

      const data = await response.json();

      // Validate response structure
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        throw new AIProviderInvalidResponseError(this.name, "Missing choices in response");
      }

      const message = data.choices[0].message;
      if (!message || !message.content) {
        throw new AIProviderInvalidResponseError(this.name, "Missing message.content in response");
      }

      // Log token usage if available
      if (data.usage) {
        console.log(`[AI Provider] Qwen - Token Usage: ${JSON.stringify(data.usage)}`);
      }

      return message.content.trim();

    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error instanceof AIProviderTimeoutError) {
        console.error(`[AI Provider] Qwen FAILED - Reason: Timeout (${responseTime} ms)`);
        throw error;
      }

      if (error instanceof AIProviderConnectionError) {
        console.error(`[AI Provider] Qwen FAILED - Reason: Connection Error (${responseTime} ms)`);
        throw error;
      }

      if (error instanceof AIProviderHTTPError) {
        console.error(`[AI Provider] Qwen FAILED - Reason: HTTP ${error.statusCode} (${responseTime} ms)`);
        throw error;
      }

      if (error instanceof AIProviderInvalidResponseError) {
        console.error(`[AI Provider] Qwen FAILED - Reason: Invalid Response (${responseTime} ms)`);
        throw error;
      }

      if (error instanceof Error) {
        console.error(`[AI Provider] Qwen FAILED - Reason: ${error.message} (${responseTime} ms)`);
        throw new AIProviderConnectionError(this.name);
      }

      console.error(`[AI Provider] Qwen FAILED - Unknown error (${responseTime} ms)`);
      throw new AIProviderConnectionError(this.name);
    }
  }

  private fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new AIProviderTimeoutError(this.name));
      }, timeoutMs);

      fetch(url, options)
        .then((response) => {
          clearTimeout(timeoutId);
          
          // Check for HTTP errors
          if (!response.ok) {
            reject(new AIProviderHTTPError(this.name, response.status));
            return;
          }
          
          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          
          // Check for network errors
          if (error.name === "TypeError" && error.message.includes("fetch")) {
            reject(new AIProviderConnectionError(this.name));
          } else if (error.name === "AbortError") {
            reject(new AIProviderTimeoutError(this.name));
          } else {
            reject(error);
          }
        });
    });
  }
}
import type { Message } from "../../../../core/messages/message";
import type { RateLimitingProvider } from "./rateLimitingProvider";
import { getAnthropicTestModel } from "../getAnthropicTestModel";
import { getTestModel as getOpenAITestModel } from "../getTestModel";
import { getGoogleTestModel } from "../getGoogleTestModel";
import { getXaiTestModel } from "../getXaiTestModel";
import { createTestMessages } from "../createTestMessages";

/**
 * Creates a minimal test request for the specified provider to reduce API costs
 *
 * @param provider - Provider to create request for
 * @returns Minimal valid request configuration
 *
 * @example
 * ```typescript
 * const request = createMinimalTestRequest("openai");
 * const response = await client.chat(request);
 * ```
 */
export function createMinimalTestRequest(provider: RateLimitingProvider): {
  model: string;
  messages: Message[];
  maxTokens?: number;
} {
  let model: string;

  switch (provider) {
    case "openai":
      model = getOpenAITestModel();
      break;
    case "anthropic":
      model = getAnthropicTestModel();
      break;
    case "google":
      model = getGoogleTestModel();
      break;
    case "xai":
      model = getXaiTestModel();
      break;
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unsupported provider: ${String(exhaustiveCheck)}`);
    }
  }

  return {
    model,
    messages: createTestMessages("Hi"), // Minimal test message
    maxTokens: 10, // Minimize response length
  };
}

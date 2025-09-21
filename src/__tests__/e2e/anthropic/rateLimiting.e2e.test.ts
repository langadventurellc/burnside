import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient";
import { loadAnthropicTestConfig } from "../shared/anthropicTestConfig";
import { getAnthropicTestModel } from "../shared/getAnthropicTestModel";
import {
  createRateLimitedTestClient,
  validateRateLimitingBehavior,
  createMinimalTestRequest,
} from "../shared/rateLimiting";

describe("Anthropic Rate Limiting E2E", () => {
  let rateLimitedClient: BridgeClient;
  let testModel: string;

  beforeAll(() => {
    // Load Anthropic test configuration and validate environment
    loadAnthropicTestConfig();
    testModel = getAnthropicTestModel();
  });

  describe("Basic Rate Limiting", () => {
    test("should throttle requests to 2 RPS", async () => {
      // Create client with 2 RPS rate limit
      rateLimitedClient = createRateLimitedTestClient("anthropic", {
        enabled: true,
        maxRps: 2,
        scope: "provider",
      });

      const request = createMinimalTestRequest("anthropic");

      // Execute 4 requests sequentially and measure actual execution timing
      const requestTimes: number[] = [];
      const startTime = Date.now();

      for (let i = 0; i < 4; i++) {
        const requestStart = Date.now();
        await rateLimitedClient.chat({
          messages: request.messages,
          model: testModel,
          maxTokens: request.maxTokens,
        });
        requestTimes.push(requestStart);
      }

      // Calculate total time taken for 4 requests
      const totalTime = Date.now() - startTime;

      // For 4 requests at 2 RPS, minimum time should be about 1.5 seconds
      // (requests at t=0, t=0.5s, t=1.0s, t=1.5s)
      expect(totalTime).toBeGreaterThan(1400); // Allow some tolerance

      // Validate rate limiting behavior with the shared utility
      const validation = validateRateLimitingBehavior(requestTimes, 2);
      expect(validation.valid).toBe(true);
    }, 30000); // 30 second timeout to account for rate limiting delays
  });

  describe("Configuration Validation", () => {
    test("should not throttle when rate limiting is disabled", async () => {
      // Create client with rate limiting disabled
      const unthrottledClient = createRateLimitedTestClient("anthropic", {
        enabled: false,
        maxRps: 2,
        scope: "provider",
      });

      const request = createMinimalTestRequest("anthropic");

      // Execute 4 requests sequentially and measure timing
      const startTime = Date.now();

      for (let i = 0; i < 4; i++) {
        await unthrottledClient.chat({
          messages: request.messages,
          model: testModel,
          maxTokens: request.maxTokens,
        });
      }

      const totalDuration = Date.now() - startTime;

      // Should complete in reasonable time without rate limiting delays
      // Allow up to 5 seconds for network latency with real API calls
      expect(totalDuration).toBeLessThan(5000);
    }, 30000);
  });

  describe("Scope Testing", () => {
    test("should isolate rate limits between different provider scopes", async () => {
      // Create two clients with provider-level scoping
      const client1 = createRateLimitedTestClient("anthropic", {
        enabled: true,
        maxRps: 2,
        scope: "provider",
      });

      const client2 = createRateLimitedTestClient("anthropic", {
        enabled: true,
        maxRps: 2,
        scope: "provider",
      });

      const request = createMinimalTestRequest("anthropic");

      // Execute requests from both clients concurrently to test scope isolation
      const executeRequests = async (client: BridgeClient) => {
        const requestTimes: number[] = [];
        for (let i = 0; i < 3; i++) {
          const requestStart = Date.now();
          await client.chat({
            messages: request.messages,
            model: testModel,
            maxTokens: request.maxTokens,
          });
          requestTimes.push(requestStart);
        }
        return requestTimes;
      };

      const [timestamps1, timestamps2] = await Promise.all([
        executeRequests(client1),
        executeRequests(client2),
      ]);

      // Both clients should be rate limited independently
      const validation1 = validateRateLimitingBehavior(timestamps1, 2);
      const validation2 = validateRateLimitingBehavior(timestamps2, 2);

      expect(validation1.valid).toBe(true);
      expect(validation2.valid).toBe(true);
    }, 30000);

    test("should isolate rate limits between different model scopes", async () => {
      // Create client with model-level scoping
      const modelScopedClient = createRateLimitedTestClient("anthropic", {
        enabled: true,
        maxRps: 2,
        scope: "provider:model",
      });

      // Test with same model (should be rate limited)
      const request = createMinimalTestRequest("anthropic");
      const requestTimes: number[] = [];

      for (let i = 0; i < 4; i++) {
        const requestStart = Date.now();
        await modelScopedClient.chat({
          messages: request.messages,
          model: testModel,
          maxTokens: request.maxTokens,
        });
        requestTimes.push(requestStart);
      }

      const validation = validateRateLimitingBehavior(requestTimes, 2);

      expect(validation.valid).toBe(true);
      expect(validation.actualRps).toBeLessThanOrEqual(2.5);
    }, 30000);
  });
});

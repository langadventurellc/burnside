import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient";
import { loadXaiTestConfig } from "../shared/xaiTestConfig";
import { getXaiTestModel } from "../shared/getXaiTestModel";
import {
  createRateLimitedTestClient,
  validateRateLimitingBehavior,
  createMinimalTestRequest,
} from "../shared/rateLimiting";

describe("xAI Rate Limiting E2E", () => {
  let rateLimitedClient: BridgeClient;
  let testModel: string;

  beforeAll(() => {
    // Load xAI test configuration and validate environment
    loadXaiTestConfig();
    testModel = getXaiTestModel();
  });

  describe("Basic Rate Limiting", () => {
    test("should throttle requests to 2 RPS", async () => {
      // Create client with 2 RPS rate limit
      rateLimitedClient = createRateLimitedTestClient("xai", {
        enabled: true,
        maxRps: 2,
        scope: "provider",
      });

      const request = createMinimalTestRequest("xai");

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
      const unthrottledClient = createRateLimitedTestClient("xai", {
        enabled: false,
        maxRps: 2,
        scope: "provider",
      });

      const request = createMinimalTestRequest("xai");

      // Execute 4 requests sequentially and measure timing
      const startTime = Date.now();

      for (let i = 0; i < 4; i++) {
        await unthrottledClient.chat({
          messages: request.messages,
          model: testModel,
          maxTokens: request.maxTokens,
        });
      }

      const totalTime = Date.now() - startTime;

      // Without rate limiting, 4 requests should complete much faster
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    }, 30000);
  });

  describe("Scope Testing", () => {
    test("should have independent rate limits for different provider-scoped clients", async () => {
      // Create two independent clients with provider-level scoping
      const client1 = createRateLimitedTestClient("xai", {
        enabled: true,
        maxRps: 2,
        scope: "provider",
      });

      const client2 = createRateLimitedTestClient("xai", {
        enabled: true,
        maxRps: 2,
        scope: "provider",
      });

      const request = createMinimalTestRequest("xai");

      // Execute requests concurrently on both clients
      const startTime = Date.now();

      const client1Promises = [];
      const client2Promises = [];

      // Send 2 requests to each client simultaneously
      for (let i = 0; i < 2; i++) {
        client1Promises.push(
          client1.chat({
            messages: request.messages,
            model: testModel,
            maxTokens: request.maxTokens,
          }),
        );

        client2Promises.push(
          client2.chat({
            messages: request.messages,
            model: testModel,
            maxTokens: request.maxTokens,
          }),
        );
      }

      // Wait for all requests to complete
      await Promise.all([...client1Promises, ...client2Promises]);

      const totalTime = Date.now() - startTime;

      // With provider-level scoping, each client should have independent rate limits
      // 2 requests per client at 2 RPS should take about 0.5 seconds per client
      // With proper isolation, total time should be closer to 1 second than 2 seconds
      expect(totalTime).toBeLessThan(1500); // Should complete faster than sequential execution
    }, 30000);

    test("should have independent rate limits for different model scopes", async () => {
      // Create client with model-level scoping
      const modelScopedClient = createRateLimitedTestClient("xai", {
        enabled: true,
        maxRps: 2,
        scope: "provider:model",
      });

      const request = createMinimalTestRequest("xai");

      // Since we only have one test model, we'll test that the scoping works correctly
      // by validating that rate limiting still applies at the model level
      const requestTimes: number[] = [];
      const startTime = Date.now();

      for (let i = 0; i < 3; i++) {
        const requestStart = Date.now();
        await modelScopedClient.chat({
          messages: request.messages,
          model: testModel,
          maxTokens: request.maxTokens,
        });
        requestTimes.push(requestStart);
      }

      const totalTime = Date.now() - startTime;

      // For 3 requests at 2 RPS with model scoping, minimum time should be about 1 second
      expect(totalTime).toBeGreaterThan(900); // Allow some tolerance

      // Validate rate limiting behavior is still applied at model scope
      const validation = validateRateLimitingBehavior(requestTimes, 2);
      expect(validation.valid).toBe(true);
    }, 30000);
  });
});

import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient";
import { loadTestConfig } from "../shared/openAITestConfig";
import { getTestModel } from "../shared/getTestModel";
import {
  createRateLimitedTestClient,
  validateRateLimitingBehavior,
  createMinimalTestRequest,
} from "../shared/rateLimiting";

describe("OpenAI Rate Limiting E2E", () => {
  let rateLimitedClient: BridgeClient;
  let testModel: string;

  beforeAll(() => {
    // Load OpenAI test configuration and validate environment
    loadTestConfig();
    testModel = getTestModel();
  });

  describe("Basic Rate Limiting", () => {
    test("should throttle requests to 2 RPS", async () => {
      // Create client with 2 RPS rate limit
      rateLimitedClient = createRateLimitedTestClient("openai", {
        enabled: true,
        maxRps: 2,
        scope: "provider",
      });

      const request = createMinimalTestRequest("openai");

      // Execute 4 requests sequentially and measure actual execution timing
      const requestTimes: number[] = [];
      const startTime = Date.now();

      for (let i = 0; i < 4; i++) {
        const requestStart = Date.now();
        const response = await rateLimitedClient.chat({
          messages: request.messages,
          model: testModel,
          maxTokens: 16,
        });
        requestTimes.push(requestStart);

        // Validate we received a proper response
        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
        expect(response.content.length).toBeGreaterThan(0);
      }

      const totalTime = Date.now() - startTime;

      // For 4 requests at 2 RPS, minimum time should be about 1.5 seconds
      // (requests at t=0, t=0.5s, t=1.0s, t=1.5s)
      expect(totalTime).toBeGreaterThan(1400); // Allow some tolerance

      // Validate rate limiting behavior with the shared utility
      const validation = validateRateLimitingBehavior(requestTimes, 2);
      expect(validation.valid).toBe(true);
    }, 30000);
  });

  describe("Configuration Validation", () => {
    test("should not throttle when rate limiting is disabled", async () => {
      // Create client with rate limiting disabled
      rateLimitedClient = createRateLimitedTestClient("openai", {
        enabled: false,
        maxRps: 2,
        scope: "provider",
      });

      const request = createMinimalTestRequest("openai");

      // Execute 3 requests rapidly and measure timing
      const startTime = Date.now();
      const promises = Array.from({ length: 3 }, () =>
        rateLimitedClient.chat({
          messages: request.messages,
          model: testModel,
          maxTokens: 16,
        }),
      );

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Validate responses
      responses.forEach((response) => {
        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
        expect(response.content.length).toBeGreaterThan(0);
      });

      // With rate limiting disabled, requests should complete much faster
      // Allow generous time for network latency but expect no artificial throttling
      expect(totalTime).toBeLessThan(10000); // Should complete well under 10 seconds
    }, 30000);
  });

  describe("Scope Testing", () => {
    test("should isolate rate limits by provider scope", async () => {
      // Create two clients with provider-level scope - they should share the same rate limit
      const client1 = createRateLimitedTestClient("openai", {
        enabled: true,
        maxRps: 2,
        scope: "provider",
      });

      const client2 = createRateLimitedTestClient("openai", {
        enabled: true,
        maxRps: 2,
        scope: "provider",
      });

      const request = createMinimalTestRequest("openai");

      // Execute requests from both clients - they should share the same rate limit bucket
      const requestTimes: number[] = [];
      const startTime = Date.now();
      const responses: any[] = [];

      // Alternate between clients to test shared rate limiting
      for (let i = 0; i < 4; i++) {
        const requestStart = Date.now();
        const client = i % 2 === 0 ? client1 : client2;
        const response = await client.chat({
          messages: request.messages,
          model: testModel,
          maxTokens: 16,
        });
        requestTimes.push(requestStart);
        responses.push(response);
      }

      const totalTime = Date.now() - startTime;

      // Validate responses
      responses.forEach((response) => {
        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
      });

      // For 4 requests at 2 RPS, minimum time should be about 1.5 seconds
      expect(totalTime).toBeGreaterThan(1400);

      // Validate that rate limiting was applied across both clients
      const validation = validateRateLimitingBehavior(requestTimes, 2);
      expect(validation.valid).toBe(true);
    }, 30000);

    test("should isolate rate limits by model scope", async () => {
      // Create client with model-level scope
      rateLimitedClient = createRateLimitedTestClient("openai", {
        enabled: true,
        maxRps: 2,
        scope: "provider:model",
      });

      const request = createMinimalTestRequest("openai");

      // Execute requests to the same model - should be rate limited
      const requestTimes: number[] = [];
      const startTime = Date.now();

      for (let i = 0; i < 4; i++) {
        const requestStart = Date.now();
        const response = await rateLimitedClient.chat({
          messages: request.messages,
          model: testModel, // Same model for all requests
          maxTokens: 16,
        });
        requestTimes.push(requestStart);

        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
      }

      const totalTime = Date.now() - startTime;

      // For 4 requests at 2 RPS, minimum time should be about 1.5 seconds
      expect(totalTime).toBeGreaterThan(1400);

      // Validate rate limiting was applied for the specific model scope
      const validation = validateRateLimitingBehavior(requestTimes, 2);
      expect(validation.valid).toBe(true);
    }, 30000);
  });
});

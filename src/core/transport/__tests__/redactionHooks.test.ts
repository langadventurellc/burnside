/**
 * Tests for Request/Response Redaction System
 *
 * Comprehensive test suite validating all redaction functionality and edge cases.
 */

import {
  RedactionProcessor,
  DEFAULT_REDACTION_CONFIG,
} from "../redactionHooks.js";
import type { ProviderHttpRequest } from "../providerHttpRequest.js";
import type { ProviderHttpResponse } from "../providerHttpResponse.js";

describe("RedactionProcessor", () => {
  describe("Configuration Validation", () => {
    test("should accept valid configuration", () => {
      const config = {
        enabled: true,
        defaultReplacement: "[REDACTED]",
        rules: [
          { type: "header" as const, pattern: /^authorization$/i },
          { type: "field" as const, field: "password" },
        ],
      };

      expect(() => new RedactionProcessor(config)).not.toThrow();
    });

    test("should reject configuration with empty default replacement", () => {
      const config = {
        enabled: true,
        defaultReplacement: "",
        rules: [],
      };

      expect(() => new RedactionProcessor(config)).toThrow(
        "Invalid redaction configuration",
      );
    });

    test("should reject field rules without field names", () => {
      const config = {
        enabled: true,
        defaultReplacement: "[REDACTED]",
        rules: [{ type: "field" as const }],
      };

      expect(() => new RedactionProcessor(config)).toThrow(
        "Field-type rules must specify a field name",
      );
    });

    test("should reject pattern-based rules without patterns", () => {
      const config = {
        enabled: true,
        defaultReplacement: "[REDACTED]",
        rules: [{ type: "body" as const }],
      };

      expect(() => new RedactionProcessor(config)).toThrow(
        "Pattern-based rules must specify a regex pattern",
      );
    });
  });

  describe("Request Redaction", () => {
    let processor: RedactionProcessor;

    beforeEach(() => {
      processor = new RedactionProcessor(DEFAULT_REDACTION_CONFIG);
    });

    test("should return original request when redaction is disabled", () => {
      const disabledProcessor = new RedactionProcessor({
        enabled: false,
        defaultReplacement: "[REDACTED]",
        rules: [],
      });

      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        headers: { authorization: "Bearer secret-token" },
        body: "sensitive data",
      };

      const result = disabledProcessor.redactRequest(request);
      expect(result).toBe(request); // Should return exact same object
    });

    test("should redact Authorization Bearer tokens", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        headers: { Authorization: "Bearer sk-1234567890abcdef" },
      };

      const result = processor.redactRequest(request);

      expect(result.headers?.Authorization).toBe("[AUTH_TOKEN]");
      expect(result).not.toBe(request); // Should be a copy
    });

    test("should redact API key headers case-insensitively", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "GET",
        headers: {
          "X-API-Key": "ak_live_1234567890",
          "x-auth-token": "token123",
          ApiKey: "key456",
        },
      };

      const result = processor.redactRequest(request);

      expect(result.headers?.["X-API-Key"]).toBe("[API_KEY]");
      expect(result.headers?.["x-auth-token"]).toBe("[AUTH_TOKEN]");
      expect(result.headers?.ApiKey).toBe("[API_KEY]");
    });

    test("should redact Cookie headers", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "GET",
        headers: {
          Cookie: "session_id=abc123; auth_token=xyz789",
        },
      };

      const result = processor.redactRequest(request);

      expect(result.headers?.Cookie).toBe("[COOKIE]");
    });

    test("should preserve non-sensitive headers", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "TestClient/1.0",
          Authorization: "Bearer secret",
        },
      };

      const result = processor.redactRequest(request);

      expect(result.headers?.["Content-Type"]).toBe("application/json");
      expect(result.headers?.["User-Agent"]).toBe("TestClient/1.0");
      expect(result.headers?.Authorization).toBe("[AUTH_TOKEN]");
    });

    test("should handle requests without headers", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "GET",
      };

      const result = processor.redactRequest(request);

      expect(result.headers).toBeUndefined();
    });

    test("should redact sensitive fields in JSON request bodies", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: JSON.stringify({
          username: "john",
          password: "secret123",
          api_key: "ak_1234567890",
          data: "normal content",
        }),
      };

      const result = processor.redactRequest(request);
      const parsedBody = JSON.parse(result.body as string);

      expect(parsedBody.username).toBe("john");
      expect(parsedBody.password).toBe("[REDACTED]");
      expect(parsedBody.api_key).toBe("[REDACTED]");
      expect(parsedBody.data).toBe("normal content");
    });

    test("should redact nested JSON fields", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: JSON.stringify({
          user: {
            name: "John",
            credentials: {
              password: "secret",
              token: "abc123",
            },
          },
          config: {
            apiKey: "key789",
          },
        }),
      };

      const result = processor.redactRequest(request);
      const parsedBody = JSON.parse(result.body as string);

      expect(parsedBody.user.name).toBe("John");
      expect(parsedBody.user.credentials.password).toBe("[REDACTED]");
      expect(parsedBody.user.credentials.token).toBe("[REDACTED]");
      expect(parsedBody.config.apiKey).toBe("[REDACTED]");
    });

    test("should redact fields in arrays", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: JSON.stringify({
          users: [
            { name: "Alice", password: "pass1" },
            { name: "Bob", password: "pass2" },
          ],
        }),
      };

      const result = processor.redactRequest(request);
      const parsedBody = JSON.parse(result.body as string);

      expect(parsedBody.users[0].name).toBe("Alice");
      expect(parsedBody.users[0].password).toBe("[REDACTED]");
      expect(parsedBody.users[1].name).toBe("Bob");
      expect(parsedBody.users[1].password).toBe("[REDACTED]");
    });

    test("should apply pattern-based redaction to string bodies", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: "Contact john.doe@example.com or call 555-123-4567 for support",
      };

      const result = processor.redactRequest(request);

      expect(result.body).toContain("[EMAIL]");
      expect(result.body).toContain("[PHONE]");
      expect(result.body).not.toContain("john.doe@example.com");
      expect(result.body).not.toContain("555-123-4567");
    });

    test("should handle binary request bodies", () => {
      const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/upload",
        method: "POST",
        body: binaryData,
      };

      const result = processor.redactRequest(request);

      expect(result.body).toBeInstanceOf(Uint8Array);
    });

    test("should preserve request metadata", () => {
      const abortController = new AbortController();
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "PUT",
        signal: abortController.signal,
      };

      const result = processor.redactRequest(request);

      expect(result.url).toBe(request.url);
      expect(result.method).toBe(request.method);
      expect(result.signal).toBe(request.signal);
    });
  });

  describe("Response Redaction", () => {
    let processor: RedactionProcessor;

    beforeEach(() => {
      processor = new RedactionProcessor(DEFAULT_REDACTION_CONFIG);
    });

    test("should return original response when redaction is disabled", () => {
      const disabledProcessor = new RedactionProcessor({
        enabled: false,
        defaultReplacement: "[REDACTED]",
        rules: [],
      });

      const response: ProviderHttpResponse = {
        status: 200,
        statusText: "OK",
        headers: { "set-cookie": "session=secret" },
        body: null,
      };

      const result = disabledProcessor.redactResponse(response);
      expect(result).toBe(response); // Should return exact same object
    });

    test("should redact sensitive response headers", () => {
      const response: ProviderHttpResponse = {
        status: 200,
        statusText: "OK",
        headers: {
          "content-type": "application/json",
          "x-api-key": "secret-key",
          Authorization: "Bearer token",
        },
        body: null,
      };

      const result = processor.redactResponse(response);

      expect(result.headers["content-type"]).toBe("application/json");
      expect(result.headers["x-api-key"]).toBe("[API_KEY]");
      expect(result.headers.Authorization).toBe("[AUTH_TOKEN]");
    });

    test("should preserve response body stream", () => {
      const mockStream = new ReadableStream<Uint8Array>();
      const response: ProviderHttpResponse = {
        status: 200,
        statusText: "OK",
        headers: {},
        body: mockStream,
      };

      const result = processor.redactResponse(response);

      expect(result.body).toBe(mockStream); // Should preserve exact stream
    });

    test("should preserve response metadata", () => {
      const response: ProviderHttpResponse = {
        status: 404,
        statusText: "Not Found",
        headers: { "retry-after": "60" },
        body: null,
      };

      const result = processor.redactResponse(response);

      expect(result.status).toBe(404);
      expect(result.statusText).toBe("Not Found");
      expect(result.body).toBeNull();
    });
  });

  describe("Custom Configuration", () => {
    test("should use custom replacement strings", () => {
      const processor = new RedactionProcessor({
        enabled: true,
        defaultReplacement: "[HIDDEN]",
        rules: [
          {
            type: "header",
            pattern: /^x-custom-key$/i,
            replacement: "[CUSTOM_KEY]",
          },
          { type: "field", field: "secret", replacement: "[SECRET_DATA]" },
        ],
      });

      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        headers: { "X-Custom-Key": "value123" },
        body: JSON.stringify({ secret: "hidden", other: "visible" }),
      };

      const result = processor.redactRequest(request);
      const parsedBody = JSON.parse(result.body as string);

      expect(result.headers?.["X-Custom-Key"]).toBe("[CUSTOM_KEY]");
      expect(parsedBody.secret).toBe("[SECRET_DATA]");
      expect(parsedBody.other).toBe("visible");
    });

    test("should handle multiple overlapping patterns", () => {
      const processor = new RedactionProcessor({
        enabled: true,
        defaultReplacement: "[REDACTED]",
        rules: [
          { type: "body", pattern: /password/gi, replacement: "[PWD]" },
          { type: "body", pattern: /secret/gi, replacement: "[SEC]" },
        ],
      });

      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: "My password is secret123 and my secret password is hidden",
      };

      const result = processor.redactRequest(request);

      expect(result.body).toContain("[PWD]");
      expect(result.body).toContain("[SEC]");
    });
  });

  describe("Pattern Redaction", () => {
    let processor: RedactionProcessor;

    beforeEach(() => {
      processor = new RedactionProcessor(DEFAULT_REDACTION_CONFIG);
    });

    test("should redact email addresses", () => {
      const content = "Contact support@example.com or admin@test.org";
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: content,
      };

      const result = processor.redactRequest(request);

      expect(result.body).not.toContain("support@example.com");
      expect(result.body).not.toContain("admin@test.org");
      expect(result.body).toContain("[EMAIL]");
    });

    test("should redact phone numbers", () => {
      const content = "Call 555-123-4567 or 555.987.6543 for help";
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: content,
      };

      const result = processor.redactRequest(request);

      expect(result.body).not.toContain("555-123-4567");
      expect(result.body).not.toContain("555.987.6543");
      expect(result.body).toContain("[PHONE]");
    });

    test("should redact Social Security Numbers", () => {
      const content = "SSN: 123-45-6789";
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: content,
      };

      const result = processor.redactRequest(request);

      expect(result.body).not.toContain("123-45-6789");
      expect(result.body).toContain("[SSN]");
    });

    test("should redact credit card numbers", () => {
      const content = "Card: 4532 1234 5678 9012 or 4532-1234-5678-9012";
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: content,
      };

      const result = processor.redactRequest(request);

      expect(result.body).not.toContain("4532 1234 5678 9012");
      expect(result.body).not.toContain("4532-1234-5678-9012");
      expect(result.body).toContain("[CARD]");
    });
  });

  describe("Edge Cases", () => {
    let processor: RedactionProcessor;

    beforeEach(() => {
      processor = new RedactionProcessor(DEFAULT_REDACTION_CONFIG);
    });

    test("should handle malformed JSON gracefully", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: "{ invalid json: missing quotes }",
      };

      const result = processor.redactRequest(request);

      expect(typeof result.body).toBe("string");
      expect(result.body).toBe("{ invalid json: missing quotes }");
    });

    test("should handle empty request bodies", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "GET",
        body: "",
      };

      const result = processor.redactRequest(request);

      expect(result.body).toBe("");
    });

    test("should handle null and undefined values in JSON", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: JSON.stringify({
          normalField: null,
          token: undefined,
          secret: "actual-secret",
        }),
      };

      const result = processor.redactRequest(request);
      const parsedBody = JSON.parse(result.body as string);

      expect(parsedBody.normalField).toBeNull();
      expect(parsedBody.secret).toBe("[REDACTED]");
    });

    test("should handle very large binary data efficiently", () => {
      const largeData = new Uint8Array(10000).fill(42);
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/upload",
        method: "POST",
        body: largeData,
      };

      const start = Date.now();
      const result = processor.redactRequest(request);
      const duration = Date.now() - start;

      expect(result.body).toBeInstanceOf(Uint8Array);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    test("should handle deeply nested objects without stack overflow", () => {
      // Create deeply nested object
      let nested: Record<string, unknown> = { password: "secret" };
      for (let i = 0; i < 100; i++) {
        nested = { level: i, child: nested };
      }

      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: JSON.stringify(nested),
      };

      expect(() => processor.redactRequest(request)).not.toThrow();
    });

    test("should preserve JSON structure with special characters", () => {
      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: JSON.stringify({
          "field-with-dashes": "value",
          "field.with.dots": "value",
          "field with spaces": "value",
          password: "secret", // This should be redacted
        }),
      };

      const result = processor.redactRequest(request);
      const parsedBody = JSON.parse(result.body as string);

      expect(parsedBody["field-with-dashes"]).toBe("value");
      expect(parsedBody["field.with.dots"]).toBe("value");
      expect(parsedBody["field with spaces"]).toBe("value");
      expect(parsedBody.password).toBe("[REDACTED]");
    });
  });

  describe("Performance", () => {
    let processor: RedactionProcessor;

    beforeEach(() => {
      processor = new RedactionProcessor(DEFAULT_REDACTION_CONFIG);
    });

    test("should have minimal overhead when disabled", () => {
      const disabledProcessor = new RedactionProcessor({
        enabled: false,
        defaultReplacement: "[REDACTED]",
        rules: [],
      });

      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        headers: { Authorization: "Bearer token" },
        body: "large body content".repeat(1000),
      };

      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        disabledProcessor.redactRequest(request);
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50); // Should be very fast when disabled
    });

    test("should handle large JSON objects efficiently", () => {
      const largeObject: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`field${i}`] = `value${i}`;
      }
      largeObject.password = "secret"; // One field to redact

      const request: ProviderHttpRequest = {
        url: "https://api.example.com/test",
        method: "POST",
        body: JSON.stringify(largeObject),
      };

      const start = Date.now();
      const result = processor.redactRequest(request);
      const duration = Date.now() - start;

      const parsedResult = JSON.parse(result.body as string);
      expect(parsedResult.password).toBe("[REDACTED]");
      expect(duration).toBeLessThan(500); // Should complete reasonably fast
    });
  });

  describe("Default Configuration", () => {
    test("should export a valid default configuration", () => {
      expect(
        () => new RedactionProcessor(DEFAULT_REDACTION_CONFIG),
      ).not.toThrow();
    });

    test("should have sensible default rules", () => {
      expect(DEFAULT_REDACTION_CONFIG.enabled).toBe(true);
      expect(DEFAULT_REDACTION_CONFIG.defaultReplacement).toBe("[REDACTED]");
      expect(DEFAULT_REDACTION_CONFIG.rules.length).toBeGreaterThan(0);
    });

    test("should include common header patterns", () => {
      const headerRules = DEFAULT_REDACTION_CONFIG.rules.filter(
        (rule) => rule.type === "header",
      );
      expect(headerRules.length).toBeGreaterThan(0);
    });

    test("should include common field patterns", () => {
      const fieldRules = DEFAULT_REDACTION_CONFIG.rules.filter(
        (rule) => rule.type === "field",
      );
      expect(fieldRules.length).toBeGreaterThan(0);
    });

    test("should include common body patterns", () => {
      const bodyRules = DEFAULT_REDACTION_CONFIG.rules.filter(
        (rule) => rule.type === "body",
      );
      expect(bodyRules.length).toBeGreaterThan(0);
    });
  });
});

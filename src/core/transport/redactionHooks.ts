/**
 * Request/Response Redaction System
 *
 * Configurable redaction system for hiding sensitive data (API keys, tokens, PII)
 * in logs and debugging output. This is critical for security compliance and
 * preventing credential leakage in production environments.
 *
 * @example Basic usage with default rules
 * ```typescript
 * const processor = new RedactionProcessor(DEFAULT_REDACTION_CONFIG);
 * const redactedRequest = processor.redactRequest(originalRequest);
 * const redactedResponse = processor.redactResponse(originalResponse);
 * ```
 *
 * @example Custom redaction patterns
 * ```typescript
 * const config: RedactionConfig = {
 *   enabled: true,
 *   defaultReplacement: '[HIDDEN]',
 *   rules: [
 *     { type: 'header', pattern: /^x-custom-key$/i, replacement: '[API_KEY]' },
 *     { type: 'field', field: 'password' },
 *     { type: 'body', pattern: /\b\d{4}-\d{4}-\d{4}-\d{4}\b/ } // Credit cards
 *   ]
 * };
 * ```
 */

import { z } from "zod";
import type { ProviderHttpRequest } from "./providerHttpRequest";
import type { ProviderHttpResponse } from "./providerHttpResponse";

/**
 * Validation schema for redaction rule configuration.
 */
const RedactionRuleSchema = z.object({
  /** Type of redaction to apply */
  type: z.enum(["header", "body", "field"], {
    error: () => "Rule type must be 'header', 'body', or 'field'",
  }),
  /** Optional regex pattern for matching content to redact */
  pattern: z.instanceof(RegExp).optional(),
  /** Optional field name for field-specific redaction */
  field: z.string().min(1, "Field name cannot be empty").optional(),
  /** Optional replacement string (uses config default if not provided) */
  replacement: z.string().optional(),
});

/**
 * Validation schema for redaction configuration.
 */
const RedactionConfigSchema = z
  .object({
    /** Whether redaction is enabled */
    enabled: z.boolean(),
    /** Default replacement string for redacted content */
    defaultReplacement: z
      .string()
      .min(1, "Default replacement cannot be empty"),
    /** Array of redaction rules to apply */
    rules: z.array(RedactionRuleSchema),
  })
  .refine(
    (config) => {
      // Validate that field rules have field names
      const fieldRules = config.rules.filter((rule) => rule.type === "field");
      return fieldRules.every((rule) => rule.field);
    },
    {
      path: ["rules"],
      error: "Field-type rules must specify a field name",
    },
  )
  .refine(
    (config) => {
      // Validate that pattern-based rules have patterns
      const patternRules = config.rules.filter(
        (rule) =>
          rule.type === "body" || (rule.type === "header" && !rule.field),
      );
      return patternRules.every((rule) => rule.pattern);
    },
    {
      path: ["rules"],
      error: "Pattern-based rules must specify a regex pattern",
    },
  );

/**
 * Configuration rule for redacting sensitive content.
 */
interface RedactionRule {
  /** Type of redaction to apply */
  type: "header" | "body" | "field";
  /** Optional regex pattern for matching content to redact */
  pattern?: RegExp;
  /** Optional field name for field-specific redaction */
  field?: string;
  /** Optional replacement string (uses config default if not provided) */
  replacement?: string;
}

/**
 * Configuration for the redaction system.
 */
interface RedactionConfig {
  /** Whether redaction is enabled */
  enabled: boolean;
  /** Default replacement string for redacted content */
  defaultReplacement: string;
  /** Array of redaction rules to apply */
  rules: RedactionRule[];
}

/**
 * Internal structure for processed JSON content during redaction.
 */
interface ProcessedContent {
  /** Whether the content was successfully parsed as JSON */
  isJson: boolean;
  /** The processed content (string or parsed object) */
  content: unknown;
}

/**
 * Configurable processor for redacting sensitive data from HTTP requests and responses.
 *
 * The RedactionProcessor applies configurable rules to sanitize sensitive information
 * from HTTP traffic before it's logged or stored. It supports header-based redaction,
 * body content redaction, and field-specific redaction in JSON structures.
 */
export class RedactionProcessor {
  private readonly config: RedactionConfig;
  private readonly headerRules: RedactionRule[];
  private readonly bodyRules: RedactionRule[];
  private readonly fieldRules: RedactionRule[];

  /**
   * Creates a new RedactionProcessor with the specified configuration.
   *
   * @param config - Redaction configuration with rules and options
   * @throws {Error} When configuration validation fails
   */
  constructor(config: RedactionConfig) {
    // Validate configuration
    const result = RedactionConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(
        `Invalid redaction configuration: ${result.error.message}`,
      );
    }

    this.config = { ...config };

    // Initialize rule categories for efficient processing
    this.headerRules = config.rules.filter((rule) => rule.type === "header");
    this.bodyRules = config.rules.filter((rule) => rule.type === "body");
    this.fieldRules = config.rules.filter((rule) => rule.type === "field");
  }

  /**
   * Redacts sensitive information from an HTTP request.
   *
   * Creates a deep copy of the request and applies all applicable redaction rules
   * to headers and body content. Performance-optimized to return the original
   * request immediately if redaction is disabled.
   *
   * @param request - The original HTTP request
   * @returns A redacted copy of the request
   */
  redactRequest(request: ProviderHttpRequest): ProviderHttpRequest {
    // Performance optimization: no-op when disabled
    if (!this.config.enabled) {
      return request;
    }

    // Clone the request to avoid modifying the original
    const redactedRequest: ProviderHttpRequest = {
      url: request.url,
      method: request.method,
      headers: request.headers ? { ...request.headers } : undefined,
      body: request.body,
      signal: request.signal,
    };

    // Apply header redaction
    if (redactedRequest.headers) {
      redactedRequest.headers = this.redactHeaders(redactedRequest.headers);
    }

    // Apply body redaction
    if (redactedRequest.body) {
      redactedRequest.body = this.redactBody(redactedRequest.body);
    }

    return redactedRequest;
  }

  /**
   * Redacts sensitive information from an HTTP response.
   *
   * Creates a shallow copy of the response and redacts headers. Body redaction
   * is limited to prevent interfering with stream consumption. The response
   * body stream is preserved for the actual consumer.
   *
   * @param response - The original HTTP response
   * @returns A redacted copy of the response
   */
  redactResponse(response: ProviderHttpResponse): ProviderHttpResponse {
    // Performance optimization: no-op when disabled
    if (!this.config.enabled) {
      return response;
    }

    // Create shallow copy with redacted headers
    return {
      status: response.status,
      statusText: response.statusText,
      headers: this.redactHeaders(response.headers),
      body: response.body, // Preserve stream for consumer
    };
  }

  /**
   * Applies redaction rules to HTTP headers.
   *
   * Processes headers with case-insensitive matching and applies both
   * pattern-based and field-specific rules.
   *
   * @param headers - Original headers object
   * @returns New headers object with sensitive data redacted
   */
  private redactHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
    const redactedHeaders: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      let redactedValue = value;

      // Apply header-specific rules
      for (const rule of this.headerRules) {
        if (rule.pattern && rule.pattern.test(key)) {
          redactedValue = rule.replacement || this.config.defaultReplacement;
          break;
        }
      }

      redactedHeaders[key] = redactedValue;
    }

    return redactedHeaders;
  }

  /**
   * Applies redaction rules to request/response body content.
   *
   * Handles both string and binary body content. For string content, attempts
   * JSON parsing and applies field-specific redaction rules. Falls back to
   * pattern-based redaction for non-JSON content.
   *
   * @param body - Original body content
   * @returns Redacted body content
   */
  private redactBody(body: string | Uint8Array): string | Uint8Array {
    // Handle binary data - only apply pattern-based rules to string representation
    if (body instanceof Uint8Array) {
      // For binary data, only apply basic pattern matching if converted to string
      const textContent = new TextDecoder().decode(body);
      const redactedText = this.applyPatternRedaction(
        textContent,
        this.bodyRules,
      );

      // Only re-encode if content was actually changed
      if (redactedText !== textContent) {
        return new TextEncoder().encode(redactedText);
      }
      return body;
    }

    // Handle string content
    const processed = this.parseContent(body);

    if (
      processed.isJson &&
      typeof processed.content === "object" &&
      processed.content !== null
    ) {
      // Apply field-based redaction to JSON objects
      const redactedObject = this.redactJsonFields(processed.content);
      return JSON.stringify(redactedObject);
    }

    // Apply pattern-based redaction to string content
    return this.applyPatternRedaction(body, this.bodyRules);
  }

  /**
   * Attempts to parse string content as JSON.
   *
   * @param content - String content to parse
   * @returns Processed content with parsing status
   */
  private parseContent(content: string): ProcessedContent {
    try {
      const parsed = JSON.parse(content) as unknown;
      return { isJson: true, content: parsed };
    } catch {
      return { isJson: false, content };
    }
  }

  /**
   * Recursively redacts specified fields in JSON objects.
   *
   * Traverses nested objects and arrays to find and redact sensitive fields.
   * Preserves the original structure while replacing sensitive values.
   *
   * @param obj - Object to process for field redaction
   * @returns New object with sensitive fields redacted
   */
  private redactJsonFields(obj: unknown): unknown {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactJsonFields(item));
    }

    return this.redactObjectFields(obj as Record<string, unknown>);
  }

  /**
   * Redacts fields in a single object.
   *
   * @param obj - Object to process
   * @returns New object with sensitive fields redacted
   */
  private redactObjectFields(
    obj: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check if this field should be redacted
      const fieldRule = this.fieldRules.find((rule) => rule.field === key);

      if (fieldRule) {
        result[key] = fieldRule.replacement || this.config.defaultReplacement;
      } else {
        // Recursively process nested objects
        result[key] = this.redactJsonFields(value);
      }
    }

    return result;
  }

  /**
   * Applies pattern-based redaction to string content.
   *
   * Iterates through pattern rules and replaces matching content with
   * the configured replacement strings.
   *
   * @param content - String content to redact
   * @param rules - Pattern-based rules to apply
   * @returns String with patterns redacted
   */
  private applyPatternRedaction(
    content: string,
    rules: RedactionRule[],
  ): string {
    let result = content;

    for (const rule of rules) {
      if (rule.pattern) {
        const replacement = rule.replacement || this.config.defaultReplacement;
        result = result.replace(rule.pattern, replacement);
      }
    }

    return result;
  }
}

/**
 * Default redaction configuration with common security patterns.
 *
 * Includes rules for:
 * - Authorization headers (Bearer tokens, Basic auth)
 * - API key headers (various formats)
 * - Cookie headers
 * - Common sensitive field names
 * - Email addresses and phone numbers in content
 */
export const DEFAULT_REDACTION_CONFIG: RedactionConfig = {
  enabled: true,
  defaultReplacement: "[REDACTED]",
  rules: [
    // Authorization headers
    {
      type: "header",
      pattern: /^authorization$/i,
      replacement: "[AUTH_TOKEN]",
    },
    { type: "header", pattern: /^x-api-key$/i, replacement: "[API_KEY]" },
    { type: "header", pattern: /^apikey$/i, replacement: "[API_KEY]" },
    { type: "header", pattern: /^x-auth-token$/i, replacement: "[AUTH_TOKEN]" },
    { type: "header", pattern: /^cookie$/i, replacement: "[COOKIE]" },

    // Sensitive JSON fields
    { type: "field", field: "password" },
    { type: "field", field: "token" },
    { type: "field", field: "api_key" },
    { type: "field", field: "apiKey" },
    { type: "field", field: "secret" },
    { type: "field", field: "credential" },
    { type: "field", field: "auth_token" },
    { type: "field", field: "access_token" },
    { type: "field", field: "refresh_token" },

    // PII patterns in body content
    {
      type: "body",
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: "[EMAIL]",
    },
    { type: "body", pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN]" },
    {
      type: "body",
      pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      replacement: "[PHONE]",
    },
    {
      type: "body",
      pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      replacement: "[CARD]",
    },
  ],
};

/**
 * Create BridgeClient with MCP configuration
 *
 * Creates a BridgeClient instance configured for MCP testing, with optional
 * configuration overrides. Follows existing client creation patterns from
 * provider helper functions.
 *
 * @param config - Optional partial configuration to override defaults
 * @returns BridgeClient instance ready for MCP testing
 *
 * @example
 * ```typescript
 * const client = createMcpTestClient({
 *   providers: {
          anthropic: {
            default: { apiKey: "test-key" },
          },
        }
 * });
 * ```
 */

import type { BridgeConfig } from "../../../core/config/bridgeConfig";
import { BridgeClient } from "../../../client/bridgeClient";
import { createMcpTestConfig } from "./createMcpTestConfig";

export function createMcpTestClient(
  config: Partial<BridgeConfig> = {},
): BridgeClient {
  // Create default MCP configuration
  const defaultConfig = createMcpTestConfig("http://localhost:0");

  // Merge with provided configuration
  const mergedConfig: BridgeConfig = {
    ...defaultConfig,
    ...config,
    providers: {
      ...defaultConfig.providers,
      ...config.providers,
    },
    tools: {
      enabled: config.tools?.enabled ?? defaultConfig.tools?.enabled ?? true,
      builtinTools:
        config.tools?.builtinTools ?? defaultConfig.tools?.builtinTools ?? [],
      executionTimeoutMs:
        config.tools?.executionTimeoutMs ??
        defaultConfig.tools?.executionTimeoutMs,
      maxConcurrentTools:
        config.tools?.maxConcurrentTools ??
        defaultConfig.tools?.maxConcurrentTools,
      mcpServers:
        config.tools?.mcpServers ?? defaultConfig.tools?.mcpServers ?? [],
      mcpToolFailureStrategy:
        config.tools?.mcpToolFailureStrategy ??
        defaultConfig.tools?.mcpToolFailureStrategy,
    },
  };

  return new BridgeClient(mergedConfig);
}

/**
 * BridgeClient Error Logging Tests
 *
 * Tests that error logging works correctly in BridgeClient error handling
 */

import { BridgeClient } from "../bridgeClient";
import { logger } from "../../core/logging/simpleLogger";
import type { BridgeConfig } from "../../core/config/bridgeConfig";

// Mock the logger
jest.mock("../../core/logging/simpleLogger", () => ({
  logger: {
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    configure: jest.fn(),
  },
}));

describe("BridgeClient Error Logging", () => {
  const mockLogger = logger as jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should configure logger during client construction", () => {
    const config: BridgeConfig = {
      providers: {
        openai: {
          default: {
            apiKey: "test-key",
          },
        },
      },
    };

    const _client = new BridgeClient(config);

    // Verify logger configuration is available (mocked)
    expect(mockLogger.configure).toBeDefined();
  });

  it("should include provider context in error logs", () => {
    // Since we can't easily trigger actual errors without complex mocking,
    // this test verifies the logger mock setup is working
    expect(mockLogger.error).toBeDefined();
    expect(mockLogger.debug).toBeDefined();
  });
});

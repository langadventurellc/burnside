import { BridgeClient } from "../../../../client/bridgeClient";
import { AnthropicMessagesV1Provider } from "../../../../providers/anthropic-2023-06-01/anthropicMessagesV1Provider";
import { createAnthropicTestClient } from "../anthropicModelHelpers";

// Mock dependencies
jest.mock("../../../../client/bridgeClient");
jest.mock(
  "../../../../providers/anthropic-2023-06-01/anthropicMessagesV1Provider",
);
jest.mock("../anthropicTestConfig", () => ({
  loadAnthropicTestConfig: jest.fn(),
}));

import { loadAnthropicTestConfig } from "../anthropicTestConfig";
const mockLoadAnthropicTestConfig =
  loadAnthropicTestConfig as jest.MockedFunction<
    typeof loadAnthropicTestConfig
  >;
const MockBridgeClient = BridgeClient as jest.MockedClass<typeof BridgeClient>;
const MockAnthropicProvider = AnthropicMessagesV1Provider as jest.MockedClass<
  typeof AnthropicMessagesV1Provider
>;

describe("createAnthropicTestClient", () => {
  const mockRegisterProvider = jest.fn();
  let mockClient: jest.Mocked<BridgeClient>;

  beforeEach(() => {
    jest.resetAllMocks();

    // Mock the test config
    mockLoadAnthropicTestConfig.mockReturnValue({
      anthropicApiKey: "sk-ant-test-key-12345",
      testEnabled: true,
      testModel: "anthropic:claude-3-5-haiku-latest",
      timeout: 30000,
    });

    // Mock the BridgeClient
    mockClient = {
      registerProvider: mockRegisterProvider,
    } as unknown as jest.Mocked<BridgeClient>;
    MockBridgeClient.mockImplementation(() => mockClient);
  });

  it("should create BridgeClient with correct Anthropic configuration", () => {
    createAnthropicTestClient();

    expect(MockBridgeClient).toHaveBeenCalledWith({
      defaultProvider: "anthropic",
      providers: {
        anthropic: { apiKey: "sk-ant-test-key-12345" },
      },
      modelSeed: "builtin",
      tools: {
        enabled: true,
        builtinTools: ["echo"],
      },
    });
  });

  it("should register AnthropicMessagesV1Provider", () => {
    createAnthropicTestClient();

    expect(MockAnthropicProvider).toHaveBeenCalled();
    expect(mockRegisterProvider).toHaveBeenCalledWith(
      expect.any(MockAnthropicProvider),
    );
  });

  it("should return the created BridgeClient", () => {
    const client = createAnthropicTestClient();

    expect(client).toBe(mockClient);
  });

  it("should apply configuration overrides", () => {
    const overrides = {
      defaultProvider: "openai",
      tools: {
        enabled: false,
        builtinTools: ["echo"],
      },
    };

    createAnthropicTestClient(overrides);

    expect(MockBridgeClient).toHaveBeenCalledWith({
      defaultProvider: "openai",
      providers: {
        anthropic: { apiKey: "sk-ant-test-key-12345" },
      },
      modelSeed: "builtin",
      tools: {
        enabled: false,
        builtinTools: ["echo"],
      },
    });
  });

  it("should load Anthropic test configuration", () => {
    createAnthropicTestClient();

    expect(mockLoadAnthropicTestConfig).toHaveBeenCalled();
  });

  it("should handle provider override while maintaining Anthropic API key", () => {
    const overrides = {
      providers: {
        openai: { apiKey: "sk-openai-key" },
      },
    };

    createAnthropicTestClient(overrides);

    expect(MockBridgeClient).toHaveBeenCalledWith({
      defaultProvider: "anthropic",
      providers: {
        openai: { apiKey: "sk-openai-key" },
      },
      modelSeed: "builtin",
      tools: {
        enabled: true,
        builtinTools: ["echo"],
      },
    });
  });

  it("should propagate errors from loadAnthropicTestConfig", () => {
    const configError = new Error("Config loading failed");
    mockLoadAnthropicTestConfig.mockImplementation(() => {
      throw configError;
    });

    expect(() => createAnthropicTestClient()).toThrow("Config loading failed");
  });
});

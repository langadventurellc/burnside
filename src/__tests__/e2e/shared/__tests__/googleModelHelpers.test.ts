import { BridgeClient } from "../../../../client/bridgeClient";
import { GoogleGeminiV1Provider } from "../../../../providers/google-gemini-v1/index";
import { createGoogleTestClient } from "../googleModelHelpers";

// Mock dependencies
jest.mock("../../../../client/bridgeClient");
jest.mock("../../../../providers/google-gemini-v1/index");
jest.mock("../googleTestConfig", () => ({
  loadGoogleTestConfig: jest.fn(),
}));

import { loadGoogleTestConfig } from "../googleTestConfig";
const mockLoadGoogleTestConfig = loadGoogleTestConfig as jest.MockedFunction<
  typeof loadGoogleTestConfig
>;
const MockBridgeClient = BridgeClient as jest.MockedClass<typeof BridgeClient>;
const MockGoogleProvider = GoogleGeminiV1Provider as jest.MockedClass<
  typeof GoogleGeminiV1Provider
>;

describe("createGoogleTestClient", () => {
  const mockRegisterProvider = jest.fn();
  let mockClient: jest.Mocked<BridgeClient>;

  beforeEach(() => {
    jest.resetAllMocks();

    // Setup mock config
    mockLoadGoogleTestConfig.mockReturnValue({
      googleApiKey: "test-google-api-key",
      testEnabled: true,
      testModel: "google:gemini-2.5-flash",
      timeout: 30000,
    });

    // Setup mock client
    mockClient = {
      registerProvider: mockRegisterProvider,
    } as unknown as jest.Mocked<BridgeClient>;

    MockBridgeClient.mockImplementation(() => mockClient);
  });

  it("should create BridgeClient with correct Google configuration", () => {
    createGoogleTestClient();

    expect(MockBridgeClient).toHaveBeenCalledWith({
      defaultProvider: "google",
      providers: {
        google: { apiKey: "test-google-api-key" },
      },
      modelSeed: "builtin",
      tools: {
        enabled: true,
        builtinTools: ["echo"],
      },
    });
  });

  it("should register GoogleGeminiV1Provider", () => {
    createGoogleTestClient();

    expect(MockGoogleProvider).toHaveBeenCalledWith();
    expect(mockRegisterProvider).toHaveBeenCalledWith(
      expect.any(MockGoogleProvider),
    );
  });

  it("should return the created BridgeClient", () => {
    const result = createGoogleTestClient();

    expect(result).toBe(mockClient);
  });

  it("should apply configuration overrides", () => {
    const overrides = {
      defaultProvider: "custom",
      tools: { enabled: false, builtinTools: [] },
    };

    createGoogleTestClient(overrides);

    expect(MockBridgeClient).toHaveBeenCalledWith({
      defaultProvider: "custom",
      providers: {
        google: { apiKey: "test-google-api-key" },
      },
      modelSeed: "builtin",
      tools: { enabled: false, builtinTools: [] },
    });
  });

  it("should load Google test configuration", () => {
    createGoogleTestClient();

    expect(mockLoadGoogleTestConfig).toHaveBeenCalledWith();
  });

  it("should handle provider override", () => {
    const overrides = {
      providers: {
        openai: { apiKey: "openai-key" },
      },
    };

    createGoogleTestClient(overrides);

    expect(MockBridgeClient).toHaveBeenCalledWith({
      defaultProvider: "google",
      providers: {
        openai: { apiKey: "openai-key" },
      },
      modelSeed: "builtin",
      tools: {
        enabled: true,
        builtinTools: ["echo"],
      },
    });
  });

  it("should propagate errors from loadGoogleTestConfig", () => {
    const error = new Error("Google config loading failed");
    mockLoadGoogleTestConfig.mockImplementation(() => {
      throw error;
    });

    expect(() => createGoogleTestClient()).toThrow(
      "Google config loading failed",
    );
  });
});

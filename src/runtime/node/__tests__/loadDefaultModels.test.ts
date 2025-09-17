import { readFileSync } from "node:fs";
import { loadDefaultModels } from "../loadDefaultModels";
import { ValidationError } from "../../../core/errors/validationError";

// Mock fs module
jest.mock("node:fs");
const mockReadFileSync = readFileSync as jest.MockedFunction<
  typeof readFileSync
>;

describe("loadDefaultModels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validJsonData = {
    schemaVersion: "1.0.0",
    providers: [
      {
        id: "openai",
        name: "OpenAI",
        models: [
          {
            id: "gpt-4o-2024-08-06",
            name: "GPT-4o",
            contextLength: 128000,
          },
        ],
      },
    ],
  };

  it("should successfully load and parse valid JSON file", () => {
    const filePath = "./test-modelson";
    mockReadFileSync.mockReturnValue(JSON.stringify(validJsonData));

    const result = loadDefaultModels(filePath);

    expect(mockReadFileSync).toHaveBeenCalledWith(filePath, "utf8");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "gpt-4o-2024-08-06",
      name: "GPT-4o",
      provider: "openai",
      capabilities: {
        streaming: false,
        toolCalls: false,
        images: false,
        documents: false,
        maxTokens: 128000,
        supportedContentTypes: [],
      },
      metadata: expect.objectContaining({
        contextLength: 128000,
        originalProviderId: "openai",
      }),
    });
  });

  it("should handle multiple providers and models", () => {
    const multiProviderData = {
      schemaVersion: "1.0.0",
      providers: [
        {
          id: "openai",
          name: "OpenAI",
          models: [
            { id: "gpt-4o", name: "GPT-4o", contextLength: 128000 },
            { id: "gpt-3.5", name: "GPT-3.5", contextLength: 4000 },
          ],
        },
        {
          id: "anthropic",
          name: "Anthropic",
          models: [{ id: "claude-3", name: "Claude 3", contextLength: 200000 }],
        },
      ],
    };

    mockReadFileSync.mockReturnValue(JSON.stringify(multiProviderData));

    const result = loadDefaultModels("./teston");

    expect(result).toHaveLength(3);
    expect(result.map((m) => m.provider)).toEqual([
      "openai",
      "openai",
      "anthropic",
    ]);
    expect(result.map((m) => m.id)).toEqual(["gpt-4o", "gpt-3.5", "claude-3"]);
  });

  it("should throw ValidationError for invalid JSON syntax", () => {
    const filePath = "./invalidon";
    mockReadFileSync.mockReturnValue("{ invalid json");

    expect(() => loadDefaultModels(filePath)).toThrow(ValidationError);
    expect(() => loadDefaultModels(filePath)).toThrow(
      `Invalid JSON syntax in ${filePath}`,
    );
  });

  it("should throw ValidationError for invalid schema", () => {
    const invalidData = {
      schemaVersion: "1.0.0",
      providers: [
        {
          id: "openai",
          // Missing name field
          models: [
            {
              id: "gpt-4o",
              name: "GPT-4o",
              // Missing contextLength field
            },
          ],
        },
      ],
    };

    mockReadFileSync.mockReturnValue(JSON.stringify(invalidData));

    expect(() => loadDefaultModels("./invalid-schemaon")).toThrow(
      ValidationError,
    );
    expect(() => loadDefaultModels("./invalid-schemaon")).toThrow(
      "Invalid defaultLlmModelson structure in ./invalid-schemaon",
    );
  });

  it("should propagate file system errors", () => {
    const filePath = "./nonexistenton";
    const fsError = new Error("ENOENT: no such file or directory");
    mockReadFileSync.mockImplementation(() => {
      throw fsError;
    });

    expect(() => loadDefaultModels(filePath)).toThrow(fsError);
  });

  it("should handle empty providers array", () => {
    const emptyData = {
      schemaVersion: "1.0.0",
      providers: [],
    };

    mockReadFileSync.mockReturnValue(JSON.stringify(emptyData));

    const result = loadDefaultModels("./emptyon");

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should handle provider with empty models array", () => {
    const emptyModelsData = {
      schemaVersion: "1.0.0",
      providers: [
        {
          id: "openai",
          name: "OpenAI",
          models: [],
        },
      ],
    };

    mockReadFileSync.mockReturnValue(JSON.stringify(emptyModelsData));

    const result = loadDefaultModels("./empty-modelson");

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should validate contextLength as positive number", () => {
    const invalidContextLength = {
      schemaVersion: "1.0.0",
      providers: [
        {
          id: "openai",
          name: "OpenAI",
          models: [
            {
              id: "gpt-4o",
              name: "GPT-4o",
              contextLength: -1000, // Invalid: negative context length
            },
          ],
        },
      ],
    };

    mockReadFileSync.mockReturnValue(JSON.stringify(invalidContextLength));

    expect(() => loadDefaultModels("./invalid-contexton")).toThrow(
      ValidationError,
    );
  });

  it("should handle large context lengths", () => {
    const largeContextData = {
      schemaVersion: "1.0.0",
      providers: [
        {
          id: "test",
          name: "Test Provider",
          models: [
            {
              id: "large-model",
              name: "Large Model",
              contextLength: 1000000,
            },
          ],
        },
      ],
    };

    mockReadFileSync.mockReturnValue(JSON.stringify(largeContextData));

    const result = loadDefaultModels("./largeon");

    expect(result).toHaveLength(1);
    expect(result[0].capabilities.maxTokens).toBe(1000000);
    expect(result[0].metadata?.contextLength).toBe(1000000);
  });
});

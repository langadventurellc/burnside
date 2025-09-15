import { loadStandardDefaultModels } from "../loadStandardDefaultModels.js";
import { loadDefaultModels } from "../loadDefaultModels.js";

// Mock the loadDefaultModels function
jest.mock("../loadDefaultModels.js");
const mockLoadDefaultModels = loadDefaultModels as jest.MockedFunction<
  typeof loadDefaultModels
>;

describe("loadStandardDefaultModels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call loadDefaultModels with standard path", () => {
    const mockModels = [
      {
        id: "gpt-4o",
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
      },
    ];

    mockLoadDefaultModels.mockReturnValue(mockModels);

    const result = loadStandardDefaultModels();

    expect(mockLoadDefaultModels).toHaveBeenCalledWith(
      "./docs/defaultLlmModels.json",
    );
    expect(result).toBe(mockModels);
  });

  it("should propagate errors from loadDefaultModels", () => {
    const error = new Error("File not found");
    mockLoadDefaultModels.mockImplementation(() => {
      throw error;
    });

    expect(() => loadStandardDefaultModels()).toThrow(error);
    expect(mockLoadDefaultModels).toHaveBeenCalledWith(
      "./docs/defaultLlmModels.json",
    );
  });
});

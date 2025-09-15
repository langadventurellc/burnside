import { loadStandardDefaultModels } from "../loadStandardDefaultModels.js";
import { mapJsonToModelInfo } from "../../../core/models/modelLoader.js";
import { defaultLlmModels } from "../../../data/defaultLlmModels.js";

describe("loadStandardDefaultModels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return mapped models from packaged default seed", () => {
    const expected = mapJsonToModelInfo(defaultLlmModels);
    const result = loadStandardDefaultModels();
    expect(result).toEqual(expected);
  });
});

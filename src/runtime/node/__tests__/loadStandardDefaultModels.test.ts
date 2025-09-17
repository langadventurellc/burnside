import { loadStandardDefaultModels } from "../loadStandardDefaultModels";
import { mapJsonToModelInfo } from "../../../core/models/modelLoader";
import { defaultLlmModels } from "../../../data/defaultLlmModels";

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

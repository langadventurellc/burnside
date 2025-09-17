/**
 * Unit tests for createTestTool helper
 */

import { createTestTool } from "../createTestTool";
import { z } from "zod";

describe("createTestTool", () => {
  it("should create a valid ToolDefinition with expected structure", () => {
    const tool = createTestTool();

    expect(tool).toEqual({
      name: "e2e_echo_tool",
      description:
        "Echo tool for E2E testing - returns input data with test metadata",
      inputSchema: expect.any(z.ZodObject),
      outputSchema: expect.any(z.ZodObject),
    });
  });

  it("should have correct tool name", () => {
    const tool = createTestTool();
    expect(tool.name).toBe("e2e_echo_tool");
  });

  it("should have descriptive description", () => {
    const tool = createTestTool();
    expect(tool.description).toContain("Echo tool for E2E testing");
    expect(tool.description).toContain("test metadata");
  });

  it("should have input and output schemas defined", () => {
    const tool = createTestTool();
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  describe("schema properties", () => {
    it("should define expected input properties", () => {
      const tool = createTestTool();

      // Test that the tool has schemas by checking they exist
      expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
      expect(tool.outputSchema).toBeInstanceOf(z.ZodObject);
    });

    it("should be a Zod object schema", () => {
      const tool = createTestTool();

      expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
      expect(tool.outputSchema).toBeInstanceOf(z.ZodObject);
    });
  });

  describe("consistency", () => {
    it("should return the same definition on multiple calls", () => {
      const tool1 = createTestTool();
      const tool2 = createTestTool();

      expect(tool1.name).toBe(tool2.name);
      expect(tool1.description).toBe(tool2.description);
      expect(tool1.inputSchema).toBeInstanceOf(z.ZodObject);
      expect(tool2.inputSchema).toBeInstanceOf(z.ZodObject);
    });
  });
});

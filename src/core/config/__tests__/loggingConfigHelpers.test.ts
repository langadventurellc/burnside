/**
 * Tests for Logging Configuration Helper Utilities
 */

import { loggingConfigHelpers } from "../loggingConfigHelpers";

describe("loggingConfigHelpers", () => {
  describe("getLoggingConfig", () => {
    it("should return undefined for undefined options", () => {
      const result = loggingConfigHelpers.getLoggingConfig(undefined);
      expect(result).toBeUndefined();
    });

    it("should return undefined for null options", () => {
      const result = loggingConfigHelpers.getLoggingConfig(
        null as unknown as Record<string, unknown>,
      );
      expect(result).toBeUndefined();
    });

    it("should return undefined for non-object options", () => {
      const result = loggingConfigHelpers.getLoggingConfig(
        "not-an-object" as unknown as Record<string, unknown>,
      );
      expect(result).toBeUndefined();
    });

    it("should return undefined when no logging property exists", () => {
      const options = { other: "property" };
      const result = loggingConfigHelpers.getLoggingConfig(options);
      expect(result).toBeUndefined();
    });

    it("should return undefined when logging property is null", () => {
      const options = { logging: null };
      const result = loggingConfigHelpers.getLoggingConfig(options);
      expect(result).toBeUndefined();
    });

    it("should return undefined when logging property is not an object", () => {
      const options = { logging: "not-an-object" };
      const result = loggingConfigHelpers.getLoggingConfig(options);
      expect(result).toBeUndefined();
    });

    it("should return logging config when valid", () => {
      const loggingConfig = { enabled: true, level: "debug" };
      const options = { logging: loggingConfig };
      const result = loggingConfigHelpers.getLoggingConfig(options);
      expect(result).toEqual(loggingConfig);
    });
  });

  describe("validateLoggingConfig", () => {
    it("should return default config for undefined input", () => {
      const result = loggingConfigHelpers.validateLoggingConfig(undefined);
      expect(result).toEqual({ enabled: true, level: "warn" });
    });

    it("should return default config for null input", () => {
      const result = loggingConfigHelpers.validateLoggingConfig(null);
      expect(result).toEqual({ enabled: true, level: "warn" });
    });

    it("should return default config for non-object input", () => {
      const result =
        loggingConfigHelpers.validateLoggingConfig("not-an-object");
      expect(result).toEqual({ enabled: true, level: "warn" });
    });

    it("should validate and return correct enabled field", () => {
      const config = { enabled: false };
      const result = loggingConfigHelpers.validateLoggingConfig(config);
      expect(result.enabled).toBe(false);
    });

    it("should use default enabled when field is invalid", () => {
      const config = { enabled: "not-a-boolean" };
      const result = loggingConfigHelpers.validateLoggingConfig(config);
      expect(result.enabled).toBe(true);
    });

    it("should validate and return correct level field", () => {
      const config = { level: "error" };
      const result = loggingConfigHelpers.validateLoggingConfig(config);
      expect(result.level).toBe("error");
    });

    it("should use default level and warn for invalid level", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const config = { level: "invalid-level" };
      const result = loggingConfigHelpers.validateLoggingConfig(config);

      expect(result.level).toBe("warn");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Invalid log level provided. Using default level:",
        "warn",
      );

      consoleWarnSpy.mockRestore();
    });

    it("should not warn when level is undefined", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const config = { enabled: true };
      const result = loggingConfigHelpers.validateLoggingConfig(config);

      expect(result.level).toBe("warn");
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should validate complete valid configuration", () => {
      const config = { enabled: false, level: "info" };
      const result = loggingConfigHelpers.validateLoggingConfig(config);
      expect(result).toEqual({ enabled: false, level: "info" });
    });
  });

  describe("isValidLogLevel", () => {
    it("should return true for valid log levels", () => {
      const validLevels = ["error", "warn", "info", "debug"];

      validLevels.forEach((level) => {
        expect(loggingConfigHelpers.isValidLogLevel(level)).toBe(true);
      });
    });

    it("should return false for invalid log levels", () => {
      const invalidLevels = ["trace", "fatal", "verbose", "silly", "invalid"];

      invalidLevels.forEach((level) => {
        expect(loggingConfigHelpers.isValidLogLevel(level)).toBe(false);
      });
    });

    it("should return false for non-string values", () => {
      const nonStringValues = [undefined, null, 123, true, {}, []];

      nonStringValues.forEach((value) => {
        expect(loggingConfigHelpers.isValidLogLevel(value)).toBe(false);
      });
    });

    it("should be case sensitive", () => {
      expect(loggingConfigHelpers.isValidLogLevel("ERROR")).toBe(false);
      expect(loggingConfigHelpers.isValidLogLevel("Debug")).toBe(false);
      expect(loggingConfigHelpers.isValidLogLevel("WARN")).toBe(false);
    });
  });
});

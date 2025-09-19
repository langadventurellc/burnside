/**
 * SimpleLogger Tests
 *
 * Comprehensive test suite for the SimpleLogger class covering:
 * - Level filtering behavior
 * - Configuration changes
 * - Message formatting
 * - Data serialization
 * - Error safety
 * - Cross-platform compatibility
 */

import { SimpleLogger } from "../simpleLogger";

describe("SimpleLogger", () => {
  let logger: SimpleLogger;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new SimpleLogger();

    // Mock all console methods
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    // Restore all console methods
    jest.restoreAllMocks();
  });

  describe("Default Configuration", () => {
    it("should have warn level and enabled by default", () => {
      expect(logger.isLevelEnabled("error")).toBe(true);
      expect(logger.isLevelEnabled("warn")).toBe(true);
      expect(logger.isLevelEnabled("info")).toBe(false);
      expect(logger.isLevelEnabled("debug")).toBe(false);
    });

    it("should log error messages by default", () => {
      logger.error("Test error");
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[ERROR\] Test error/),
      );
    });

    it("should log warning messages by default", () => {
      logger.warn("Test warning");
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[WARN\] Test warning/),
      );
    });

    it("should not log info messages by default", () => {
      logger.info("Test info");
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it("should not log debug messages by default", () => {
      logger.debug("Test debug");
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe("Level Filtering", () => {
    it("should show all levels when set to debug", () => {
      logger.configure({ level: "debug" });

      expect(logger.isLevelEnabled("error")).toBe(true);
      expect(logger.isLevelEnabled("warn")).toBe(true);
      expect(logger.isLevelEnabled("info")).toBe(true);
      expect(logger.isLevelEnabled("debug")).toBe(true);
    });

    it("should show only errors when set to error level", () => {
      logger.configure({ level: "error" });

      expect(logger.isLevelEnabled("error")).toBe(true);
      expect(logger.isLevelEnabled("warn")).toBe(false);
      expect(logger.isLevelEnabled("info")).toBe(false);
      expect(logger.isLevelEnabled("debug")).toBe(false);
    });

    it("should show error, warn, and info when set to info level", () => {
      logger.configure({ level: "info" });

      expect(logger.isLevelEnabled("error")).toBe(true);
      expect(logger.isLevelEnabled("warn")).toBe(true);
      expect(logger.isLevelEnabled("info")).toBe(true);
      expect(logger.isLevelEnabled("debug")).toBe(false);
    });
  });

  describe("Configuration Changes", () => {
    it("should allow enabling and disabling logging", () => {
      logger.configure({ enabled: false });

      logger.error("Should not appear");
      logger.warn("Should not appear");

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should allow changing level at runtime", () => {
      logger.configure({ level: "debug" });

      logger.debug("Debug message");
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);

      logger.configure({ level: "error" });

      logger.debug("Should not appear");
      logger.warn("Should not appear");
      logger.error("Should appear");

      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // Still only one call
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it("should preserve existing config when partially updating", () => {
      logger.configure({ level: "debug" });
      logger.configure({ enabled: false });

      // Should still be at debug level but disabled
      expect(logger.isLevelEnabled("debug")).toBe(false);
      expect(logger.isLevelEnabled("error")).toBe(false);

      logger.configure({ enabled: true });

      // Should now be enabled at debug level
      expect(logger.isLevelEnabled("debug")).toBe(true);
      expect(logger.isLevelEnabled("error")).toBe(true);
    });
  });

  describe("Message Formatting", () => {
    it("should include timestamp in ISO format", () => {
      const beforeTime = new Date().toISOString();
      logger.error("Test message");
      const afterTime = new Date().toISOString();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\[20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[ERROR\] Test message$/,
        ),
      );

      const loggedMessage = consoleErrorSpy.mock.calls[0][0] as string;
      const timestampMatch = loggedMessage.match(/^\[(.*?)\]/);
      expect(timestampMatch).toBeTruthy();

      if (timestampMatch) {
        const timestamp = timestampMatch[1];
        expect(timestamp >= beforeTime).toBe(true);
        expect(timestamp <= afterTime).toBe(true);
      }
    });

    it("should include proper level tags", () => {
      logger.configure({ level: "debug" });

      logger.error("Error message");
      logger.warn("Warn message");
      logger.info("Info message");
      logger.debug("Debug message");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[ERROR\]/),
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\]/),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\]/),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[DEBUG\]/),
      );
    });
  });

  describe("Data Serialization", () => {
    beforeEach(() => {
      logger.configure({ level: "debug" });
    });

    it("should serialize objects with data", () => {
      const testData = { key: "value", number: 42 };
      logger.info("Test message", testData);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Test message: {"key":"value","number":42}/),
      );
    });

    it("should handle primitive data types", () => {
      logger.info("String data", "test string");
      logger.info("Number data", 123);
      logger.info("Boolean data", true);
      logger.info("Null data", null);
      logger.info("Undefined data", undefined);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/String data: test string/),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Number data: 123/),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Boolean data: true/),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Null data: null/),
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Undefined data: undefined/),
      );
    });

    it("should handle circular references safely", () => {
      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      logger.info("Circular object", circularObj);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /Circular object: {"name":"test","self":"\[Circular Reference\]"}/,
        ),
      );
    });

    it("should handle nested objects", () => {
      const nestedData = {
        level1: {
          level2: {
            level3: "deep value",
          },
          array: [1, 2, { nested: true }],
        },
      };

      logger.info("Nested data", nestedData);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Nested data: .*level3.*deep value/),
      );
    });

    it("should handle serialization errors gracefully", () => {
      const problematicData = {
        toJSON: () => {
          throw new Error("Serialization failed");
        },
      };

      logger.info("Problematic data", problematicData);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Problematic data: \[Serialization Error:/),
      );
    });
  });

  describe("Error Safety", () => {
    it("should not crash when console methods throw errors", () => {
      consoleErrorSpy.mockImplementation(() => {
        throw new Error("Console error");
      });

      // Should not throw
      expect(() => {
        logger.error("Test message");
      }).not.toThrow();

      // Should try to log the error
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // Once for original, once for fallback
    });

    it("should handle complete console failure gracefully", () => {
      consoleErrorSpy.mockImplementation(() => {
        throw new Error("Console completely broken");
      });

      // Should not throw even if fallback console.error fails
      expect(() => {
        logger.error("Test message");
      }).not.toThrow();
    });

    it("should continue logging after errors", () => {
      consoleErrorSpy.mockImplementationOnce(() => {
        throw new Error("Temporary console error");
      });

      logger.error("First message"); // Should fail
      logger.error("Second message"); // Should work

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3); // 1 failure + 1 fallback + 1 success
    });
  });

  describe("Console Method Mapping", () => {
    beforeEach(() => {
      logger.configure({ level: "debug" });
    });

    it("should use console.error for error level", () => {
      logger.error("Error message");
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should use console.warn for warn level", () => {
      logger.warn("Warn message");
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should use console.info for info level", () => {
      logger.info("Info message");
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should use console.log for debug level", () => {
      logger.debug("Debug message");
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });
  });

  describe("Performance Optimization", () => {
    it("should not serialize data when level is disabled", () => {
      const expensiveData = {
        get computed() {
          throw new Error("Should not be accessed");
        },
      };

      // Info is disabled by default (warn level)
      logger.info("Message", expensiveData);

      // Should not throw because data should not be accessed
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it("should provide isLevelEnabled for performance checks", () => {
      logger.configure({ level: "warn" });

      if (logger.isLevelEnabled("debug")) {
        // This expensive operation should not run
        throw new Error("Should not execute expensive debug operation");
      }

      // Should not throw
      expect(logger.isLevelEnabled("debug")).toBe(false);
      expect(logger.isLevelEnabled("warn")).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      logger.configure({ level: "debug" });
    });

    it("should handle empty messages", () => {
      logger.info("");
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\] $/),
      );
    });

    it("should handle very long messages", () => {
      const longMessage = "x".repeat(10000);
      logger.info(longMessage);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining(longMessage),
      );
    });

    it("should handle special characters in messages", () => {
      const specialMessage = "Special chars: \n\t\r\\\"'";
      logger.info(specialMessage);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining(specialMessage),
      );
    });

    it("should handle large data objects", () => {
      const largeArray = new Array(1000).fill({ key: "value" });
      logger.info("Large data", largeArray);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    });
  });
});

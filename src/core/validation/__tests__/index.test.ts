/**
 * Validation Module Index Tests
 *
 * Tests for the validation module's barrel exports and integration.
 */

import * as validationModule from "../index";

describe("validation module exports", () => {
  describe("type exports", () => {
    it("should export all expected types", () => {
      // We can't directly test type exports at runtime, but we can verify
      // they exist by checking if they can be imported without error
      expect(typeof validationModule).toBe("object");
    });
  });

  describe("function exports", () => {
    it("should export formatValidationError function", () => {
      expect(typeof validationModule.formatValidationError).toBe("function");
    });

    it("should export safeValidate function", () => {
      expect(typeof validationModule.safeValidate).toBe("function");
    });

    it("should export validateOrThrow function", () => {
      expect(typeof validationModule.validateOrThrow).toBe("function");
    });

    it("should export createTypeGuard function", () => {
      expect(typeof validationModule.createTypeGuard).toBe("function");
    });
  });

  describe("object exports", () => {
    it("should export commonSchemas object", () => {
      expect(typeof validationModule.commonSchemas).toBe("object");
      expect(validationModule.commonSchemas.email).toBeDefined();
      expect(validationModule.commonSchemas.url).toBeDefined();
      expect(validationModule.commonSchemas.timestamp).toBeDefined();
      expect(validationModule.commonSchemas.unixTimestamp).toBeDefined();
    });

    it("should export schemaComposition object", () => {
      expect(typeof validationModule.schemaComposition).toBe("object");
      expect(typeof validationModule.schemaComposition.merge).toBe("function");
      expect(typeof validationModule.schemaComposition.makeOptional).toBe(
        "function",
      );
      expect(typeof validationModule.schemaComposition.makeNullable).toBe(
        "function",
      );
    });
  });

  describe("integration", () => {
    it("should allow using exported utilities together", () => {
      const { commonSchemas, safeValidate, createTypeGuard } = validationModule;

      // Test integration of commonSchemas with safeValidate
      const emailResult = safeValidate(commonSchemas.email, "test@example.com");
      expect(emailResult.success).toBe(true);

      // Test integration of commonSchemas with createTypeGuard
      const isEmail = createTypeGuard(commonSchemas.email);
      expect(isEmail("test@example.com")).toBe(true);
      expect(isEmail("invalid-email")).toBe(false);
    });

    it("should provide consistent error handling across utilities", () => {
      const { commonSchemas, safeValidate, validateOrThrow } = validationModule;

      const invalidEmail = "invalid-email";

      // Both should handle the same validation consistently
      const safeResult = safeValidate(commonSchemas.email, invalidEmail);
      expect(safeResult.success).toBe(false);

      expect(() => {
        validateOrThrow(commonSchemas.email, invalidEmail);
      }).toThrow();
    });

    it("should allow schema composition with common schemas", () => {
      const { commonSchemas, schemaComposition, safeValidate } =
        validationModule;

      const optionalEmail = schemaComposition.makeOptional(commonSchemas.email);
      const nullableUrl = schemaComposition.makeNullable(commonSchemas.url);

      expect(safeValidate(optionalEmail, undefined).success).toBe(true);
      expect(safeValidate(optionalEmail, "test@example.com").success).toBe(
        true,
      );

      expect(safeValidate(nullableUrl, null).success).toBe(true);
      expect(safeValidate(nullableUrl, "https://example.com").success).toBe(
        true,
      );
    });
  });

  describe("module completeness", () => {
    it("should not expose internal implementation details", () => {
      const exportedKeys = Object.keys(validationModule);

      // Should only export the documented public API
      const expectedExports = [
        "commonSchemas",
        "providerSchemas",
        "providerValidation",
        "formatValidationError",
        "safeValidate",
        "validateOrThrow",
        "createTypeGuard",
        "schemaComposition",
      ];

      expectedExports.forEach((exportName) => {
        expect(exportedKeys).toContain(exportName);
      });

      // Should not export more than expected (no internal utilities leaked)
      expect(exportedKeys.length).toBe(expectedExports.length);
    });

    it("should maintain consistent API surface", () => {
      // All function exports should be actual functions
      const functionExports = [
        "formatValidationError",
        "safeValidate",
        "validateOrThrow",
        "createTypeGuard",
      ];

      functionExports.forEach((funcName) => {
        expect(
          typeof validationModule[funcName as keyof typeof validationModule],
        ).toBe("function");
      });

      // All object exports should be actual objects
      const objectExports = ["commonSchemas", "schemaComposition"];

      objectExports.forEach((objName) => {
        expect(
          typeof validationModule[objName as keyof typeof validationModule],
        ).toBe("object");
        expect(
          validationModule[objName as keyof typeof validationModule],
        ).not.toBeNull();
      });
    });
  });
});

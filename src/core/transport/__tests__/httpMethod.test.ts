/**
 * HTTP Method Type Tests
 *
 * Tests for the HttpMethod union type to ensure it only accepts
 * valid HTTP methods and provides proper TypeScript type checking.
 */
import type { HttpMethod } from "../httpMethod.js";

describe("HttpMethod", () => {
  it("should accept valid HTTP methods", () => {
    const validMethods: HttpMethod[] = ["GET", "POST", "PUT", "DELETE"];

    validMethods.forEach((method) => {
      expect(typeof method).toBe("string");
      expect(["GET", "POST", "PUT", "DELETE"]).toContain(method);
    });
  });

  it("should be assignable to string", () => {
    const method: HttpMethod = "GET";
    const str: string = method;

    expect(str).toBe("GET");
  });

  it("should work in switch statements", () => {
    const testMethod = (method: HttpMethod): string => {
      switch (method) {
        case "GET":
          return "getting";
        case "POST":
          return "posting";
        case "PUT":
          return "putting";
        case "DELETE":
          return "deleting";
      }
    };

    expect(testMethod("GET")).toBe("getting");
    expect(testMethod("POST")).toBe("posting");
    expect(testMethod("PUT")).toBe("putting");
    expect(testMethod("DELETE")).toBe("deleting");
  });
});

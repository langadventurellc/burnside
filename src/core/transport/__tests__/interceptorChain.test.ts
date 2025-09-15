/**
 * @jest-environment node
 */
import { InterceptorChain } from "../interceptorChain.js";
import { InterceptorError } from "../interceptorError.js";
import type { InterceptorContext } from "../interceptorContext.js";
import type { RequestInterceptor } from "../requestInterceptorChain.js";
import type { ResponseInterceptor } from "../responseInterceptorChain.js";
import type { ProviderHttpRequest } from "../providerHttpRequest.js";
import type { ProviderHttpResponse } from "../providerHttpResponse.js";

describe("InterceptorChain", () => {
  let chain: InterceptorChain;
  let mockRequest: ProviderHttpRequest;
  let mockResponse: ProviderHttpResponse;
  let baseContext: InterceptorContext;

  beforeEach(() => {
    chain = new InterceptorChain();
    mockRequest = {
      url: "https://api.example.com/test",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: "data" }),
    };
    mockResponse = {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      body: null,
    };
    baseContext = {
      request: mockRequest,
      response: mockResponse,
      metadata: {},
    };
  });

  describe("constructor", () => {
    it("should initialize with empty interceptor chains", () => {
      const counts = chain.getInterceptorCounts();
      expect(counts.request).toBe(0);
      expect(counts.response).toBe(0);
    });
  });

  describe("addRequestInterceptor", () => {
    it("should add request interceptor with default priority", () => {
      const interceptor: RequestInterceptor = (ctx) => ctx;
      chain.addRequestInterceptor(interceptor);

      const counts = chain.getInterceptorCounts();
      expect(counts.request).toBe(1);
    });

    it("should add multiple interceptors with priority ordering", () => {
      const interceptor1: RequestInterceptor = (ctx) => ctx;
      const interceptor2: RequestInterceptor = (ctx) => ctx;
      const interceptor3: RequestInterceptor = (ctx) => ctx;

      chain.addRequestInterceptor(interceptor1, 10);
      chain.addRequestInterceptor(interceptor2, 20);
      chain.addRequestInterceptor(interceptor3, 5);

      const counts = chain.getInterceptorCounts();
      expect(counts.request).toBe(3);
    });

    it("should validate interceptor function", () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        chain.addRequestInterceptor("not a function" as any);
      }).toThrow(InterceptorError);
    });
  });

  describe("addResponseInterceptor", () => {
    it("should add response interceptor with default priority", () => {
      const interceptor: ResponseInterceptor = (ctx) => ctx;
      chain.addResponseInterceptor(interceptor);

      const counts = chain.getInterceptorCounts();
      expect(counts.response).toBe(1);
    });

    it("should add multiple interceptors with reverse priority ordering", () => {
      const interceptor1: ResponseInterceptor = (ctx) => ctx;
      const interceptor2: ResponseInterceptor = (ctx) => ctx;
      const interceptor3: ResponseInterceptor = (ctx) => ctx;

      chain.addResponseInterceptor(interceptor1, 10);
      chain.addResponseInterceptor(interceptor2, 20);
      chain.addResponseInterceptor(interceptor3, 5);

      const counts = chain.getInterceptorCounts();
      expect(counts.response).toBe(3);
    });

    it("should validate interceptor function", () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        chain.addResponseInterceptor(null as any);
      }).toThrow(InterceptorError);
    });
  });

  describe("executeRequest", () => {
    it("should execute empty chain without error", async () => {
      const requestOnlyContext = {
        request: mockRequest,
        metadata: {},
      };
      const result = await chain.executeRequest(requestOnlyContext);
      expect(result).toEqual({
        request: mockRequest,
        metadata: {},
        response: undefined,
        abortSignal: undefined,
      });
    });

    it("should execute single request interceptor", async () => {
      const requestOnlyContext = {
        request: mockRequest,
        metadata: {},
      };
      const interceptor: RequestInterceptor = (ctx) => ({
        ...ctx,
        metadata: { ...ctx.metadata, processed: true },
      });

      chain.addRequestInterceptor(interceptor);
      const result = await chain.executeRequest(requestOnlyContext);

      expect(result.metadata.processed).toBe(true);
    });

    it("should execute multiple interceptors in priority order", async () => {
      const requestOnlyContext = {
        request: mockRequest,
        metadata: {},
      };
      const executionOrder: number[] = [];

      const interceptor1: RequestInterceptor = (ctx) => {
        executionOrder.push(1);
        return { ...ctx, metadata: { ...ctx.metadata, step1: true } };
      };

      const interceptor2: RequestInterceptor = (ctx) => {
        executionOrder.push(2);
        return { ...ctx, metadata: { ...ctx.metadata, step2: true } };
      };

      const interceptor3: RequestInterceptor = (ctx) => {
        executionOrder.push(3);
        return { ...ctx, metadata: { ...ctx.metadata, step3: true } };
      };

      chain.addRequestInterceptor(interceptor2, 10);
      chain.addRequestInterceptor(interceptor1, 20);
      chain.addRequestInterceptor(interceptor3, 5);

      const result = await chain.executeRequest(requestOnlyContext);

      expect(executionOrder).toEqual([1, 2, 3]);
      expect(result.metadata).toEqual({
        step1: true,
        step2: true,
        step3: true,
      });
    });

    it("should handle sync interceptors", async () => {
      const requestOnlyContext = {
        request: mockRequest,
        metadata: {},
      };
      const interceptor: RequestInterceptor = (ctx) => ({
        ...ctx,
        metadata: { ...ctx.metadata, sync: true },
      });

      chain.addRequestInterceptor(interceptor);
      const result = await chain.executeRequest(requestOnlyContext);

      expect(result.metadata.sync).toBe(true);
    });

    it("should validate context", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(chain.executeRequest(null as any)).rejects.toThrow(
        InterceptorError,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(chain.executeRequest({} as any)).rejects.toThrow(
        InterceptorError,
      );
    });

    it("should handle interceptor errors", async () => {
      const requestOnlyContext = {
        request: mockRequest,
        metadata: {},
      };
      const failingInterceptor: RequestInterceptor = () => {
        throw new Error("Interceptor failure");
      };

      chain.addRequestInterceptor(failingInterceptor);

      await expect(chain.executeRequest(requestOnlyContext)).rejects.toThrow(
        InterceptorError,
      );
    });

    it("should handle abort signal", async () => {
      const controller = new AbortController();
      controller.abort(); // Abort before execution
      const contextWithSignal = {
        request: mockRequest,
        metadata: {},
        abortSignal: controller.signal,
      };

      const interceptor: RequestInterceptor = (ctx) => ctx;

      chain.addRequestInterceptor(interceptor);

      await expect(chain.executeRequest(contextWithSignal)).rejects.toThrow(
        InterceptorError,
      );
    });

    it("should handle invalid interceptor return value", async () => {
      const requestOnlyContext = {
        request: mockRequest,
        metadata: {},
      };
      const invalidInterceptor: RequestInterceptor = () => null as any;

      chain.addRequestInterceptor(invalidInterceptor);

      await expect(chain.executeRequest(requestOnlyContext)).rejects.toThrow(
        InterceptorError,
      );
    });
  });

  describe("executeResponse", () => {
    it("should require response in context", async () => {
      const contextWithoutResponse = {
        ...baseContext,
        response: undefined,
      };

      await expect(
        chain.executeResponse(contextWithoutResponse),
      ).rejects.toThrow(InterceptorError);
    });

    it("should execute single response interceptor", async () => {
      const interceptor: ResponseInterceptor = (ctx) => ({
        ...ctx,
        metadata: { ...ctx.metadata, responseProcessed: true },
      });

      chain.addResponseInterceptor(interceptor);
      const result = await chain.executeResponse(baseContext);

      expect(result.metadata.responseProcessed).toBe(true);
    });

    it("should execute multiple interceptors in reverse priority order", async () => {
      const executionOrder: number[] = [];

      const interceptor1: ResponseInterceptor = (ctx) => {
        executionOrder.push(1);
        return { ...ctx, metadata: { ...ctx.metadata, resp1: true } };
      };

      const interceptor2: ResponseInterceptor = (ctx) => {
        executionOrder.push(2);
        return { ...ctx, metadata: { ...ctx.metadata, resp2: true } };
      };

      const interceptor3: ResponseInterceptor = (ctx) => {
        executionOrder.push(3);
        return { ...ctx, metadata: { ...ctx.metadata, resp3: true } };
      };

      chain.addResponseInterceptor(interceptor1, 20);
      chain.addResponseInterceptor(interceptor2, 10);
      chain.addResponseInterceptor(interceptor3, 5);

      const result = await chain.executeResponse(baseContext);

      expect(executionOrder).toEqual([3, 2, 1]);
      expect(result.metadata).toEqual({
        resp1: true,
        resp2: true,
        resp3: true,
      });
    });

    it("should handle response interceptor errors", async () => {
      const failingInterceptor: ResponseInterceptor = () => {
        throw new Error("Response interceptor failure");
      };

      chain.addResponseInterceptor(failingInterceptor);

      await expect(chain.executeResponse(baseContext)).rejects.toThrow(
        InterceptorError,
      );
    });
  });

  describe("context isolation", () => {
    it("should clone context between interceptors", async () => {
      const requestOnlyContext = {
        request: mockRequest,
        metadata: {},
      };

      const interceptor1: RequestInterceptor = (ctx) => {
        // This should modify the returned context, not mutate the input
        return {
          ...ctx,
          request: {
            ...ctx.request,
            headers: { ...ctx.request.headers, "X-Modified": "true" },
          },
        };
      };

      const interceptor2: RequestInterceptor = (ctx) => {
        // The second interceptor should see the modifications from the first
        expect(ctx.request.headers!["X-Modified"]).toBe("true");
        return ctx;
      };

      chain.addRequestInterceptor(interceptor1, 10);
      chain.addRequestInterceptor(interceptor2, 5);

      await chain.executeRequest(requestOnlyContext);
    });

    it("should preserve metadata changes across interceptors", async () => {
      const requestOnlyContext = {
        request: mockRequest,
        metadata: {},
      };

      const interceptor1: RequestInterceptor = (ctx) => ({
        ...ctx,
        metadata: { ...ctx.metadata, first: "value1" },
      });

      const interceptor2: RequestInterceptor = (ctx) => {
        expect(ctx.metadata.first).toBe("value1");
        return {
          ...ctx,
          metadata: { ...ctx.metadata, second: "value2" },
        };
      };

      chain.addRequestInterceptor(interceptor1, 10);
      chain.addRequestInterceptor(interceptor2, 5);

      const result = await chain.executeRequest(requestOnlyContext);

      expect(result.metadata).toEqual({
        first: "value1",
        second: "value2",
      });
    });
  });

  describe("clear", () => {
    it("should remove all interceptors", () => {
      const interceptor: RequestInterceptor = (ctx) => ctx;
      chain.addRequestInterceptor(interceptor);
      chain.addResponseInterceptor(interceptor);

      let counts = chain.getInterceptorCounts();
      expect(counts.request).toBe(1);
      expect(counts.response).toBe(1);

      chain.clear();

      counts = chain.getInterceptorCounts();
      expect(counts.request).toBe(0);
      expect(counts.response).toBe(0);
    });
  });

  describe("registration order with same priority", () => {
    it("should respect registration order for request interceptors with same priority", async () => {
      const requestOnlyContext = {
        request: mockRequest,
        metadata: {},
      };
      const executionOrder: number[] = [];

      const interceptor1: RequestInterceptor = (ctx) => {
        executionOrder.push(1);
        return ctx;
      };

      const interceptor2: RequestInterceptor = (ctx) => {
        executionOrder.push(2);
        return ctx;
      };

      const interceptor3: RequestInterceptor = (ctx) => {
        executionOrder.push(3);
        return ctx;
      };

      chain.addRequestInterceptor(interceptor1, 10);
      chain.addRequestInterceptor(interceptor2, 10);
      chain.addRequestInterceptor(interceptor3, 10);

      await chain.executeRequest(requestOnlyContext);

      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it("should respect reverse registration order for response interceptors with same priority", async () => {
      const executionOrder: number[] = [];

      const interceptor1: ResponseInterceptor = (ctx) => {
        executionOrder.push(1);
        return ctx;
      };

      const interceptor2: ResponseInterceptor = (ctx) => {
        executionOrder.push(2);
        return ctx;
      };

      const interceptor3: ResponseInterceptor = (ctx) => {
        executionOrder.push(3);
        return ctx;
      };

      chain.addResponseInterceptor(interceptor1, 10);
      chain.addResponseInterceptor(interceptor2, 10);
      chain.addResponseInterceptor(interceptor3, 10);

      await chain.executeResponse(baseContext);

      expect(executionOrder).toEqual([3, 2, 1]);
    });
  });
});

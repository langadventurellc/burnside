/**
 * Error Response Fixtures
 *
 * Realistic OpenAI Responses API v1 error response fixtures
 * for error handling testing and contract validation.
 */

/**
 * HTTP 401 Authentication Error
 */
export const error401Auth = {
  status: 401,
  statusText: "Unauthorized",
  headers: {
    "content-type": "application/json",
  },
  body: {
    error: {
      message:
        "Incorrect API key provided: sk-proj-***. You can find your API key at https://platform.openai.com/account/api-keys.",
      type: "invalid_request_error",
      param: null,
      code: "invalid_api_key",
    },
  },
} as const;

/**
 * HTTP 403 Forbidden Error
 */
export const error403Forbidden = {
  status: 403,
  statusText: "Forbidden",
  headers: {
    "content-type": "application/json",
  },
  body: {
    error: {
      message:
        "You don't have access to this model. Please check your plan and billing details.",
      type: "invalid_request_error",
      param: null,
      code: "model_not_found",
    },
  },
} as const;

/**
 * HTTP 429 Rate Limit Error
 */
export const error429RateLimit = {
  status: 429,
  statusText: "Too Many Requests",
  headers: {
    "content-type": "application/json",
    "retry-after": "60",
  },
  body: {
    error: {
      message:
        "Rate limit reached for requests. Limit: 3 / min. Please try again in 20s. Contact us through our help center at help.openai.com if you continue to have issues.",
      type: "requests",
      param: null,
      code: "rate_limit_exceeded",
    },
  },
} as const;

/**
 * HTTP 400 Validation Error - Invalid model
 */
export const error400InvalidModel = {
  status: 400,
  statusText: "Bad Request",
  headers: {
    "content-type": "application/json",
  },
  body: {
    error: {
      message: "The model `invalid-model` does not exist",
      type: "invalid_request_error",
      param: "model",
      code: "model_not_found",
    },
  },
} as const;

/**
 * HTTP 400 Validation Error - Missing required parameter
 */
export const error400MissingInput = {
  status: 400,
  statusText: "Bad Request",
  headers: {
    "content-type": "application/json",
  },
  body: {
    error: {
      message: "Missing required parameter: 'input'",
      type: "invalid_request_error",
      param: "input",
      code: "missing_required_parameter",
    },
  },
} as const;

/**
 * HTTP 400 Validation Error - Invalid parameter type
 */
export const error400InvalidParameter = {
  status: 400,
  statusText: "Bad Request",
  headers: {
    "content-type": "application/json",
  },
  body: {
    error: {
      message: "'temperature' must be a number between 0 and 2",
      type: "invalid_request_error",
      param: "temperature",
      code: "invalid_parameter_value",
    },
  },
} as const;

/**
 * HTTP 500 Server Error
 */
export const error500Server = {
  status: 500,
  statusText: "Internal Server Error",
  headers: {
    "content-type": "application/json",
  },
  body: {
    error: {
      message:
        "The server had an error while processing your request. Sorry about that!",
      type: "server_error",
      param: null,
      code: "server_error",
    },
  },
} as const;

/**
 * HTTP 503 Service Unavailable
 */
export const error503ServiceUnavailable = {
  status: 503,
  statusText: "Service Unavailable",
  headers: {
    "content-type": "application/json",
    "retry-after": "300",
  },
  body: {
    error: {
      message: "The engine is currently overloaded, please try again later",
      type: "server_error",
      param: null,
      code: "engine_overloaded",
    },
  },
} as const;

/**
 * Streaming error event
 */
export const streamingError = {
  data: JSON.stringify({
    type: "error",
    error: {
      type: "server_error",
      message:
        "Internal server error occurred during streaming response generation",
      code: "internal_error",
    },
  }),
} as const;

/**
 * Streaming rate limit error event
 */
export const streamingRateLimitError = {
  data: JSON.stringify({
    type: "error",
    error: {
      type: "rate_limit_error",
      message: "Rate limit exceeded during streaming",
      code: "rate_limit_exceeded",
    },
  }),
} as const;

/**
 * Malformed error response (missing error object)
 */
export const errorMalformedMissingError = {
  status: 400,
  statusText: "Bad Request",
  headers: {
    "content-type": "application/json",
  },
  body: {
    message: "Something went wrong",
  },
} as const;

/**
 * Malformed error response (non-JSON)
 */
export const errorMalformedNonJson = {
  status: 502,
  statusText: "Bad Gateway",
  headers: {
    "content-type": "text/html",
  },
  body: "<html><body><h1>502 Bad Gateway</h1></body></html>",
} as const;

/**
 * Network timeout simulation
 */
export const errorNetworkTimeout = {
  code: "ECONNABORTED",
  message: "timeout of 30000ms exceeded",
  name: "TimeoutError",
} as const;

/**
 * Network connection error simulation
 */
export const errorNetworkConnection = {
  code: "ECONNREFUSED",
  message: "connect ECONNREFUSED 127.0.0.1:443",
  name: "ConnectionError",
} as const;

/**
 * DNS resolution error simulation
 */
export const errorNetworkDns = {
  code: "ENOTFOUND",
  message: "getaddrinfo ENOTFOUND api.openai.com",
  name: "DNSError",
} as const;

/**
 * Collection of all error response fixtures
 */
export const errorResponses = {
  error401Auth,
  error403Forbidden,
  error429RateLimit,
  error400InvalidModel,
  error400MissingInput,
  error400InvalidParameter,
  error500Server,
  error503ServiceUnavailable,
  streamingError,
  streamingRateLimitError,
  errorMalformedMissingError,
  errorMalformedNonJson,
  errorNetworkTimeout,
  errorNetworkConnection,
  errorNetworkDns,
} as const;

/**
 * Validate if a JSON-RPC error code is recognized
 */
import { JSONRPC_ERROR_CODES } from "./mcpErrorCodes";

export function isValidJsonRpcErrorCode(code: number): boolean {
  const validCodes = Object.values(JSONRPC_ERROR_CODES) as number[];
  return validCodes.includes(code);
}

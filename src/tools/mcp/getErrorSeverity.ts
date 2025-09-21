/**
 * Get error severity for a given MCP error code
 */
import { ERROR_SEVERITY_MAPPING, ERROR_SEVERITY } from "./mcpErrorCodes";

export function getErrorSeverity(errorCode: string): string {
  return (
    ERROR_SEVERITY_MAPPING[errorCode as keyof typeof ERROR_SEVERITY_MAPPING] ||
    ERROR_SEVERITY.PERMANENT
  );
}

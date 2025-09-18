/**
 * Agent Loop Module
 *
 * This module provides agent loop orchestration and execution capabilities
 * for single-turn and multi-turn tool execution and conversation flow management.
 * Includes types, execution context utilities, streaming interruption handling,
 * comprehensive multi-turn error types, unified termination detection, and the
 * main AgentLoop class with comprehensive streaming integration and error recovery
 * strategies.
 */

export type { AgentExecutionState } from "./agentExecutionState";
export type { AgentExecutionOptions } from "./agentExecutionOptions";
export type { EnhancedTerminationReason } from "./enhancedTerminationReason";
export type { ExecutionMetrics } from "./executionMetrics";
export type { ExecutionPhase } from "./executionPhase";
export type { IterationResult } from "./iterationResult";
export type { MultiTurnContext } from "./multiTurnContext";
export type { MultiTurnState } from "./multiTurnState";
export type { StreamingResult } from "./streamingResult";
export type { StreamingState } from "./streamingState";
export type { StreamingTurnResult } from "./streamingTurnResult";
export type { TerminationConfidence } from "./terminationConfidence";
export type { TerminationReason } from "./terminationReason";
export type { TimeoutStatus } from "./timeoutStatus";
export type { UnifiedTerminationSignal } from "./unifiedTerminationSignal";
export { AgentLoop } from "./agentLoop";
export { calculateTerminationConfidence } from "./calculateTerminationConfidence";
export { createExecutionContext } from "./agentExecutionContext";
export { createTerminationSignal } from "./createTerminationSignal";
export { isUnifiedTerminationSignal } from "./isUnifiedTerminationSignal";
export { IterationManager } from "./iterationManager";
export { IterationTimeoutError } from "./iterationTimeoutError";
export { MaxIterationsExceededError } from "./maxIterationsExceededError";
export { MultiTurnExecutionError } from "./multiTurnErrors";
export { MultiTurnStreamingInterruptionError } from "./multiTurnStreamingInterruptionError";
export { StreamingIntegrationError } from "./streamingIntegrationError";
export { StreamingStateMachine } from "./streamingStateMachine";

/**
 * Node.js STDIO MCP Connection Implementation
 *
 * Provides JSON-RPC 2.0 communication with MCP servers via subprocess stdin/stdout.
 * Spawns and manages child processes for local MCP server communication using
 * newline-delimited JSON over stdio streams.
 */

// Dynamic imports for Node.js-specific modules to avoid issues in browser/React Native environments
type ChildProcess = import("child_process").ChildProcess;
type ReadlineInterface = import("readline").Interface;
import type { McpConnection } from "../mcpConnection";
import type { McpConnectionOptions } from "../mcpConnectionOptions";
import { RuntimeError } from "../runtimeError";

/**
 * JSON-RPC 2.0 request structure for MCP communication.
 */
interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id?: string | number;
}

/**
 * JSON-RPC 2.0 response structure for MCP communication.
 */
interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number | null;
}

/**
 * Pending request tracker for request/response correlation.
 */
interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer?: NodeJS.Timeout;
}

/**
 * Node.js STDIO implementation of MCP connection using JSON-RPC 2.0 protocol.
 *
 * Manages subprocess lifecycle, handles newline-delimited JSON communication
 * over stdin/stdout, and provides request/response correlation for MCP servers
 * running as local subprocesses.
 */
export class NodeStdioMcpConnection implements McpConnection {
  private childProcess?: ChildProcess;
  private readline?: ReadlineInterface;
  private isConnectionActive = false;
  private requestIdCounter = 0;
  private readonly pendingRequests = new Map<string | number, PendingRequest>();

  private readonly command: string;
  private readonly args: string[];
  private readonly options: McpConnectionOptions;

  constructor(
    command: string,
    args: string[] = [],
    options: McpConnectionOptions = {},
  ) {
    this.command = command;
    this.args = args;
    this.options = options;
  }

  /**
   * Initialize the STDIO MCP connection by spawning subprocess.
   */
  async initialize(): Promise<void> {
    try {
      await this.spawnSubprocess();
      await this.setupStdioHandlers();
      this.isConnectionActive = true;
    } catch (error) {
      throw new RuntimeError(
        `Failed to initialize STDIO MCP connection: ${error instanceof Error ? error.message : String(error)}`,
        "RUNTIME_MCP_STDIO_INIT_FAILED",
        {
          command: this.command,
          args: this.args,
          originalError: error,
        },
      );
    }
  }

  /**
   * Current connection status based on subprocess state.
   */
  get isConnected(): boolean {
    return (
      this.isConnectionActive &&
      this.childProcess !== undefined &&
      !this.childProcess.killed &&
      this.childProcess.exitCode === null
    );
  }

  /**
   * Make a JSON-RPC 2.0 request and wait for response.
   */
  async call<T = unknown>(method: string, params?: unknown): Promise<T> {
    if (!this.isConnected) {
      throw new RuntimeError(
        "Cannot make request on inactive STDIO MCP connection",
        "RUNTIME_MCP_CONNECTION_INACTIVE",
        { method, command: this.command },
      );
    }

    const requestId = this.generateRequestId();
    const request: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: requestId,
      method,
      params,
    };

    return new Promise<T>((resolve, reject) => {
      // Set up timeout if specified
      let timer: NodeJS.Timeout | undefined;
      if (this.options.timeout) {
        timer = setTimeout(() => {
          this.pendingRequests.delete(requestId);
          reject(
            new RuntimeError(
              `STDIO MCP request timeout after ${this.options.timeout}ms`,
              "RUNTIME_MCP_REQUEST_TIMEOUT",
              { method, requestId, command: this.command },
            ),
          );
        }, this.options.timeout);
      }

      // Track pending request
      this.pendingRequests.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });

      // Send request
      this.sendMessage(request).catch((error) => {
        this.pendingRequests.delete(requestId);
        if (timer) clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });
  }

  /**
   * Send a JSON-RPC 2.0 notification (no response expected).
   */
  async notify(method: string, params?: unknown): Promise<void> {
    if (!this.isConnected) {
      throw new RuntimeError(
        "Cannot send notification on inactive STDIO MCP connection",
        "RUNTIME_MCP_CONNECTION_INACTIVE",
        { method, command: this.command },
      );
    }

    const notification: JsonRpcRequest = {
      jsonrpc: "2.0",
      method,
      params,
    };

    await this.sendMessage(notification);
  }

  /**
   * Close the MCP connection and terminate subprocess.
   */
  async close(): Promise<void> {
    this.isConnectionActive = false;

    // Reject all pending requests
    for (const [requestId, pending] of this.pendingRequests) {
      if (pending.timer) clearTimeout(pending.timer);
      pending.reject(
        new RuntimeError(
          "Connection closed while request was pending",
          "RUNTIME_MCP_CONNECTION_CLOSED",
          { requestId, command: this.command },
        ),
      );
    }
    this.pendingRequests.clear();

    // Close readline interface
    if (this.readline) {
      this.readline.close();
      this.readline = undefined;
    }

    // Terminate subprocess
    if (this.childProcess) {
      if (!this.childProcess.killed) {
        this.childProcess.kill();

        // Wait for process to exit or force kill after timeout
        await new Promise<void>((resolve) => {
          const forceKillTimer = setTimeout(() => {
            if (this.childProcess && !this.childProcess.killed) {
              this.childProcess.kill("SIGKILL");
            }
            resolve();
          }, 5000);

          this.childProcess!.on("exit", () => {
            clearTimeout(forceKillTimer);
            resolve();
          });
        });
      }
      this.childProcess = undefined;
    }
  }

  /**
   * Spawn the MCP server subprocess with configured command and args.
   */
  private async spawnSubprocess(): Promise<void> {
    return new Promise((resolve, reject) => {
      void (async () => {
        try {
          const { spawn } = await import("child_process");

          this.childProcess = spawn(this.command, this.args, {
            stdio: ["pipe", "pipe", "inherit"],
          });

          this.childProcess.on("spawn", () => {
            resolve();
          });

          this.childProcess.on("error", (error: Error) => {
            reject(
              new RuntimeError(
                `Failed to spawn MCP server subprocess: ${error.message}`,
                "RUNTIME_MCP_SUBPROCESS_SPAWN_FAILED",
                {
                  command: this.command,
                  args: this.args,
                  originalError: error,
                },
              ),
            );
          });

          this.childProcess.on("exit", (code, signal) => {
            this.handleSubprocessExit(code, signal);
          });
        } catch (error) {
          reject(
            new RuntimeError(
              `Subprocess spawn error: ${error instanceof Error ? error.message : String(error)}`,
              "RUNTIME_MCP_SUBPROCESS_SPAWN_ERROR",
              {
                command: this.command,
                args: this.args,
                originalError: error,
              },
            ),
          );
        }
      })();
    });
  }

  /**
   * Set up readline interface for parsing newline-delimited JSON from stdout.
   */
  private async setupStdioHandlers(): Promise<void> {
    if (!this.childProcess?.stdout) {
      throw new RuntimeError(
        "Subprocess stdout not available for readline setup",
        "RUNTIME_MCP_SUBPROCESS_STDOUT_UNAVAILABLE",
        { command: this.command },
      );
    }

    const { createInterface } = await import("readline");

    this.readline = createInterface({
      input: this.childProcess.stdout,
      terminal: false,
    });

    this.readline.on("line", (line) => {
      this.handleStdoutLine(line);
    });

    this.readline.on("error", (error: Error) => {
      throw new RuntimeError(
        `Readline error: ${error.message}`,
        "RUNTIME_MCP_READLINE_ERROR",
        {
          command: this.command,
          originalError: error,
        },
      );
    });
  }

  /**
   * Send JSON-RPC message to subprocess stdin.
   */
  private async sendMessage(message: JsonRpcRequest): Promise<void> {
    if (!this.childProcess?.stdin) {
      throw new RuntimeError(
        "Subprocess stdin not available for sending message",
        "RUNTIME_MCP_SUBPROCESS_STDIN_UNAVAILABLE",
        { command: this.command },
      );
    }

    const messageJson = JSON.stringify(message);
    const success = this.childProcess.stdin.write(`${messageJson}\n`);

    if (!success) {
      // Wait for drain event if write buffer is full
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            new RuntimeError(
              "Subprocess stdin write timeout",
              "RUNTIME_MCP_STDIN_WRITE_TIMEOUT",
              { command: this.command },
            ),
          );
        }, 5000);

        this.childProcess!.stdin!.once("drain", () => {
          clearTimeout(timeout);
          resolve();
        });

        this.childProcess!.stdin!.once("error", (error) => {
          clearTimeout(timeout);
          reject(
            new RuntimeError(
              `Subprocess stdin write error: ${error.message}`,
              "RUNTIME_MCP_STDIN_WRITE_ERROR",
              {
                command: this.command,
                originalError: error,
              },
            ),
          );
        });
      });
    }
  }

  /**
   * Handle a line of JSON output from subprocess stdout.
   */
  private handleStdoutLine(line: string): void {
    if (!line.trim()) return; // Skip empty lines

    try {
      const message = JSON.parse(line) as JsonRpcResponse;

      // Handle response messages (have id)
      if (message.id !== undefined && message.id !== null) {
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          this.pendingRequests.delete(message.id);
          if (pending.timer) clearTimeout(pending.timer);

          if (message.error) {
            const error = new Error(message.error.message);
            Object.assign(error, {
              code: message.error.code,
              data: message.error.data,
            });
            pending.reject(error);
          } else {
            pending.resolve(message.result);
          }
        }
      }
      // Note: We ignore notification responses (no id) as they are one-way
    } catch (error) {
      // Log malformed JSON but don't crash the connection
      console.warn(
        `Failed to parse JSON from MCP server stdout: ${line}`,
        error,
      );
    }
  }

  /**
   * Handle subprocess exit event.
   */
  private handleSubprocessExit(
    code: number | null,
    signal: NodeJS.Signals | null,
  ): void {
    this.isConnectionActive = false;

    // Reject all pending requests
    for (const [requestId, pending] of this.pendingRequests) {
      if (pending.timer) clearTimeout(pending.timer);
      pending.reject(
        new RuntimeError(
          `MCP server subprocess exited (code: ${code}, signal: ${signal})`,
          "RUNTIME_MCP_SUBPROCESS_EXITED",
          {
            command: this.command,
            exitCode: code,
            signal,
            requestId,
          },
        ),
      );
    }
    this.pendingRequests.clear();
  }

  /**
   * Generate unique request ID for JSON-RPC correlation.
   */
  private generateRequestId(): string {
    return `node_stdio_${Date.now()}_${++this.requestIdCounter}`;
  }
}

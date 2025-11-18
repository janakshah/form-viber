/**
 * Agent Builder - A utility for creating agent instances with Gemini execution,
 * optional Daytona sandbox support, and optional observability logging.
 *
 * @example
 * ```ts
 * const agent = createAgent(
 *   { systemPrompt: "You are a helpful assistant." },
 *   { gemini: myGeminiExecutor }
 * );
 * const result = await agent.run({ text: "Hello" });
 * ```
 */

/**
 * Input provided to an agent's run method.
 */
export interface AgentInput {
  /**
   * The user's text input.
   */
  text: string;

  /**
   * Optional context that can be enriched by the agent (e.g., sandbox info).
   */
  context?: Record<string, unknown>;
}

/**
 * Output returned from an agent's run method.
 */
export interface AgentOutput {
  /**
   * The agent's response text.
   */
  text: string;

  /**
   * Optional raw response from the underlying model.
   */
  rawModelResponse?: unknown;

  /**
   * Optional metadata about the execution (duration, tokens, sandbox ID, etc.).
   */
  metadata?: {
    durationMs?: number;
    sandboxId?: string;
    tokens?: {
      input?: number;
      output?: number;
    };
    [key: string]: unknown;
  };
}

/**
 * Definition of an agent's behavior and requirements.
 */
export interface AgentDefinition {
  /**
   * The system prompt that defines this agent's behavior.
   */
  systemPrompt: string;

  /**
   * Whether this agent expects to use a Daytona sandbox per run.
   */
  requiresSandbox?: boolean;

  /**
   * Optional sandbox configuration (e.g., CPU, memory, disk, auto-stop settings).
   */
  sandboxConfig?: {
    cpu?: number;
    memoryGb?: number;
    diskGb?: number;
    autoStopMinutes?: number;
    ephemeral?: boolean;
  };
}

/**
 * Executor interface for running Gemini API calls.
 */
export interface GeminiExecutor {
  /**
   * Execute a Gemini call using a system prompt and user input,
   * returning a normalized AgentOutput.
   *
   * @param params - The execution parameters
   * @param params.systemPrompt - The system prompt to use
   * @param params.input - The user input
   * @returns The agent output with text and optional metadata
   */
  run(params: {
    systemPrompt: string;
    input: AgentInput;
  }): Promise<AgentOutput>;
}

/**
 * Manager interface for Daytona sandbox operations.
 */
export interface DaytonaSandboxManager {
  /**
   * Create a sandbox and return its identifier/handle.
   *
   * @param config - Optional sandbox configuration
   * @returns Sandbox handle with ID
   */
  createSandbox(
    config?: AgentDefinition["sandboxConfig"]
  ): Promise<{ id: string }>;

  /**
   * Optionally run a command inside the sandbox.
   * Keep this generic; exact usage can be decided by callers.
   *
   * @param sandboxId - The sandbox identifier
   * @param command - The command to execute
   * @returns Command execution result
   */
  runCommand?(
    sandboxId: string,
    command: string
  ): Promise<{
    stdout: string;
    stderr?: string;
    exitCode: number;
  }>;

  /**
   * Stop and/or clean up the sandbox.
   *
   * @param sandboxId - The sandbox identifier to stop
   */
  stopSandbox(sandboxId: string): Promise<void>;
}

/**
 * Client interface for observability tracking (e.g., Galileo).
 */
export interface ObservabilityClient {
  /**
   * Track a single agent call, success or failure.
   * This is where Galileo can be wired in.
   *
   * @param params - Tracking parameters
   * @param params.definition - The agent definition
   * @param params.input - The input provided
   * @param params.output - The output (if successful)
   * @param params.error - The error (if failed)
   * @param params.durationMs - Execution duration in milliseconds
   * @param params.sandboxId - Optional sandbox ID used
   */
  trackAgentCall(params: {
    definition: AgentDefinition;
    input: AgentInput;
    output?: AgentOutput;
    error?: unknown;
    durationMs: number;
    sandboxId?: string;
  }): Promise<void>;
}

/**
 * Dependencies required to create and run an agent.
 */
export interface AgentDeps {
  /**
   * Gemini executor implementation (required).
   */
  gemini: GeminiExecutor;

  /**
   * Optional Daytona sandbox manager (required if agent.requiresSandbox is true).
   */
  daytona?: DaytonaSandboxManager;

  /**
   * Optional observability client for logging agent calls.
   */
  observability?: ObservabilityClient;
}

/**
 * An agent instance that can execute runs with the configured behavior.
 */
export interface AgentInstance {
  /**
   * The agent's definition.
   */
  definition: AgentDefinition;

  /**
   * Runs the agent once with the given input.
   *
   * @param input - The input to process
   * @returns The agent's output
   * @throws If execution fails or if sandbox is required but not provided
   */
  run(input: AgentInput): Promise<AgentOutput>;
}

/**
 * Creates an agent instance with the given definition and dependencies.
 *
 * This is a pure builder function: given a definition + deps, it returns a callable
 * instance. No global state, IDs, or registry is used.
 *
 * @param definition - The agent's behavior definition
 * @param deps - The dependencies (gemini executor, optional daytona, optional observability)
 * @returns An agent instance with a run method
 *
 * @example
 * ```ts
 * const agent = createAgent(
 *   {
 *     systemPrompt: "You are a helpful coding assistant.",
 *     requiresSandbox: true,
 *   },
 *   {
 *     gemini: myGeminiExecutor,
 *     daytona: myDaytonaManager,
 *     observability: myObservabilityClient,
 *   }
 * );
 *
 * const result = await agent.run({ text: "Write a hello world function" });
 * console.log(result.text);
 * ```
 */
export function createAgent(
  definition: AgentDefinition,
  deps: AgentDeps
): AgentInstance {
  const { gemini, daytona, observability } = deps;

  async function run(input: AgentInput): Promise<AgentOutput> {
    const start = Date.now();
    let sandboxId: string | undefined;
    let output: AgentOutput;

    try {
      // Optional sandbox handling
      if (definition.requiresSandbox) {
        if (!daytona) {
          throw new Error(
            "Agent requires a sandbox, but no DaytonaSandboxManager was provided."
          );
        }

        const sandbox = await daytona.createSandbox(definition.sandboxConfig);
        sandboxId = sandbox.id;

        // Optionally enrich input.context with sandbox info
        input = {
          ...input,
          context: {
            ...(input.context ?? {}),
            sandboxId,
          },
        };

        // If desired in future, callers can pass commands for runCommand.
        // Keep this function generic and not opinionated about what to run.
      }

      // Call Gemini
      output = await gemini.run({
        systemPrompt: definition.systemPrompt,
        input,
      });

      const durationMs = Date.now() - start;

      // Attach metadata in a non-destructive way
      output.metadata = {
        ...(output.metadata ?? {}),
        durationMs,
        sandboxId,
      };

      // Observability: log success
      if (observability) {
        await observability.trackAgentCall({
          definition,
          input,
          output,
          durationMs,
          sandboxId,
        });
      }

      return output;
    } catch (error) {
      const durationMs = Date.now() - start;

      // Observability: log failure
      if (observability) {
        try {
          await observability.trackAgentCall({
            definition,
            input,
            error,
            durationMs,
            sandboxId,
          });
        } catch {
          // Swallow observability errors to avoid masking the original error
        }
      }

      throw error;
    } finally {
      // Best-effort sandbox cleanup
      if (sandboxId && daytona) {
        try {
          await daytona.stopSandbox(sandboxId);
        } catch {
          // Swallow cleanup errors to avoid masking the original error.
        }
      }
    }
  }

  return {
    definition,
    run,
  };
}


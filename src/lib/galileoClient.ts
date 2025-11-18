import type { ObservabilityClient, AgentDefinition, AgentInput, AgentOutput } from "./agentBuilder";

/**
 * Galileo Observability Client implementation using the Galileo SDK.
 * 
 * Requires GALILEO_API_KEY environment variable to be set.
 * Optionally set GALILEO_PROJECT and GALILEO_LOG_STREAM for custom project/log stream names.
 * 
 * Since we use Gemini (not OpenAI), we use manual logging with the Galileo SDK.
 */
export function createGalileoClient(): ObservabilityClient {
  const apiKey = process.env.GALILEO_API_KEY;
  const projectName = process.env.GALILEO_PROJECT || "form-viber";
  const logStreamName = process.env.GALILEO_LOG_STREAM || "agent-calls";

  let galileoLogger: any = null;
  let isInitialized = false;

  async function ensureInitialized() {
    if (isInitialized) return;

    if (!apiKey) {
      console.warn("GALILEO_API_KEY not set. Galileo observability is disabled.");
      isInitialized = true;
      return;
    }

    try {
      const galileoModule = await import("galileo");
      
      // Instantiate GalileoLogger with API key, project, and log stream
      // The SDK may export GalileoLogger or use a different initialization pattern
      if (galileoModule.GalileoLogger) {
        galileoLogger = new galileoModule.GalileoLogger({
          apiKey,
          project: projectName,
          logStream: logStreamName,
        });
      } else if (galileoModule.galileoContext?.init) {
        // Alternative initialization pattern
        galileoModule.galileoContext.init(projectName, logStreamName);
        galileoLogger = galileoModule;
      } else {
        // Fallback: try direct initialization
        galileoLogger = galileoModule;
        if (typeof galileoLogger.init === "function") {
          await galileoLogger.init({
            apiKey,
            project: projectName,
            logStream: logStreamName,
          });
        }
      }
      
      isInitialized = true;
    } catch (error) {
      console.warn("Failed to initialize Galileo SDK:", error);
      isInitialized = true;
    }
  }

  return {
    async trackAgentCall(params) {
      const { definition, input, output, error, durationMs, sandboxId } = params;

      await ensureInitialized();

      if (!apiKey || !galileoLogger) {
        return; // Silently skip if not configured
      }

      try {
        // Start a trace for the agent call
        const trace = galileoLogger.startTrace?.();
        
        // Add workflow-level span
        if (galileoLogger.addWorkflowSpan) {
          galileoLogger.addWorkflowSpan({
            name: "agent-call",
            input: {
              text: input.text,
              context: input.context,
              systemPrompt: definition.systemPrompt.substring(0, 500), // Truncate for display
            },
            output: output
              ? {
                  text: output.text,
                }
              : undefined,
            error: error ? String(error) : undefined,
            metadata: {
              durationMs,
              sandboxId,
            },
          });
        }

        // Add nested LLM call span
        if (galileoLogger.addLlmSpan) {
          galileoLogger.addLlmSpan({
            name: "gemini-call",
            model: "gemini-2.5-flash",
            input: {
              systemPrompt: definition.systemPrompt,
              userInput: input.text,
            },
            output: output
              ? {
                  text: output.text,
                }
              : undefined,
            error: error ? String(error) : undefined,
            metadata: {
              durationMs,
              sandboxId,
              tokens: output?.metadata?.tokens,
            },
          });
        }

        // Conclude the trace
        if (trace && typeof trace.conclude === "function") {
          trace.conclude();
        } else if (galileoLogger.conclude) {
          galileoLogger.conclude();
        }

        // Flush logs to ensure they're sent
        if (galileoLogger.flush) {
          try {
            await galileoLogger.flush();
          } catch (flushError) {
            // Flush errors are non-critical
            console.warn("[Galileo] Flush error (non-critical):", flushError);
          }
        }
      } catch (error) {
        console.warn("[Galileo] Failed to track agent call:", error);
      }
    },
  };
}


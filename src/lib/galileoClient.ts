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

  let galileo: any = null;
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
      galileo = galileoModule;
      
      // Initialize Galileo with API key and project settings
      if (galileo.init) {
        await galileo.init({
          apiKey,
          project: projectName,
          logStream: logStreamName,
        });
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

      if (!apiKey || !galileo) {
        return; // Silently skip if not configured
      }

      try {
        // Log the agent call as a workflow span
        await galileo.log(
          {
            spanType: "workflow",
            name: "agent-call",
            input: {
              text: input.text,
              context: input.context,
              systemPrompt: definition.systemPrompt.substring(0, 500), // Truncate for display
            },
            output: output
              ? {
                  text: output.text,
                  tokens: output.metadata?.tokens,
                }
              : undefined,
            error: error ? String(error) : undefined,
            metadata: {
              durationMs,
              sandboxId,
              model: "gemini-2.5-flash",
              tokens: output?.metadata?.tokens,
            },
          },
          async () => {
            // Nested LLM call span
            await galileo.log(
              {
                spanType: "llm",
                name: "gemini-call",
                model: "gemini-2.5-flash",
                input: {
                  systemPrompt: definition.systemPrompt,
                  userInput: input.text,
                },
                output: output
                  ? {
                      text: output.text,
                      tokens: output.metadata?.tokens,
                    }
                  : undefined,
                error: error ? String(error) : undefined,
                metadata: {
                  durationMs,
                  sandboxId,
                  tokens: output?.metadata?.tokens,
                },
              },
              async () => ({})
            );
            return {};
          }
        );

        // Flush logs to ensure they're sent
        if (galileo.flush) {
          try {
            await galileo.flush();
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


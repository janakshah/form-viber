import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  AgentInput,
  AgentOutput,
  GeminiExecutor,
} from "./agentBuilder";

/**
 * Creates a GeminiExecutor implementation using the Google Generative AI SDK.
 *
 * @param apiKey - Your Google Gemini API key (or set GEMINI_API_KEY env var)
 * @returns A GeminiExecutor instance
 */
export function createGeminiExecutor(
  apiKey?: string
): GeminiExecutor {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "Gemini API key is required. Provide it as an argument or set GEMINI_API_KEY environment variable."
    );
  }

  const genAI = new GoogleGenerativeAI(key);

  return {
    async run(params) {
      const { systemPrompt, input } = params;
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Combine system prompt and user input in a simple format
      const prompt = `${systemPrompt}\n\nUser: ${input.text}\n\nAssistant:`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract token usage if available
        const usageMetadata = response.usageMetadata;
        const tokens = usageMetadata
          ? {
              input: usageMetadata.promptTokenCount,
              output: usageMetadata.candidatesTokenCount,
            }
          : undefined;

        return {
          text,
          rawModelResponse: response,
          metadata: {
            tokens,
          },
        };
      } catch (error) {
        // Wrap errors to provide more context
        throw new Error(
          `Gemini API error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
  };
}


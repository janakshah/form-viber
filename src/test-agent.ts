import "dotenv/config";
import { createAgent } from "./lib/agentBuilder";
import { createGeminiExecutor } from "./lib/geminiExecutor";
import { createGalileoClient } from "./lib/galileoClient";

async function main() {
  console.log("Creating agent...\n");

  // Create Gemini executor
  const geminiExecutor = createGeminiExecutor();
  
  // Create Galileo observability client
  const galileoClient = createGalileoClient();

  // Create agent with a helpful system prompt
  const agent = createAgent(
    {
      systemPrompt:
        "You are a helpful and knowledgeable assistant. Answer questions accurately and concisely.",
    },
    {
      gemini: geminiExecutor,
      observability: galileoClient,
    }
  );

  // Test question
  const question = "Tell me who Mahatma Gandhi was married to";

  console.log(`Question: ${question}\n`);
  console.log("Calling agent...\n");

  try {
    const result = await agent.run({
      text: question,
    });

    console.log("=" .repeat(60));
    console.log("Agent Response:");
    console.log("=" .repeat(60));
    console.log(result.text);
    console.log("=" .repeat(60));

    if (result.metadata) {
      console.log("\nMetadata:");
      console.log(JSON.stringify(result.metadata, null, 2));
    }
    
    console.log("\n✅ Test completed successfully!");
    console.log("Note: If GALILEO_API_KEY is set, the call was logged to Galileo.");
  } catch (error) {
    console.error("Error running agent:", error);
    process.exit(1);
  }
}

main();


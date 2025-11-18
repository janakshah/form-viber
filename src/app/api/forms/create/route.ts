import { NextRequest, NextResponse } from "next/server";
import { createAgent } from "@/lib/agentBuilder";
import { createGeminiExecutor } from "@/lib/geminiExecutor";
import { createDaytonaManager } from "@/lib/daytonaManager";
import { createGalileoClient } from "@/lib/galileoClient";
import { formGeneratorAgentDefinition } from "@/lib/agents/formGeneratorAgent";
import { createForm, type FormField } from "@/lib/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    // Create dependencies
    const geminiExecutor = createGeminiExecutor();
    const daytonaManager = createDaytonaManager();
    const galileoClient = createGalileoClient();

    // Create Agent 1
    const agent = createAgent(formGeneratorAgentDefinition, {
      gemini: geminiExecutor,
      daytona: daytonaManager,
      observability: galileoClient,
    });

    // Run the agent
    const result = await agent.run({ text: description });

    // Parse the JSON response
    let formData;
    try {
      // Trim the response
      let cleanedText = result.text.trim();
      
      // Remove markdown code block using non-greedy match
      cleanedText = cleanedText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/, "$1");
      
      // Locate the first '{' and the last '}' and extract the substring between them
      const firstBrace = cleanedText.indexOf("{");
      const lastBrace = cleanedText.lastIndexOf("}");
      
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error("No valid JSON object found in response");
      }
      
      const jsonString = cleanedText.substring(firstBrace, lastBrace + 1);
      formData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse agent response:", result.text);
      return NextResponse.json(
        { error: "Failed to parse agent response. Please try again." },
        { status: 500 }
      );
    }

    // Validate the form data structure
    if (!formData.formId || !Array.isArray(formData.fields)) {
      return NextResponse.json(
        { error: "Invalid form data structure from agent" },
        { status: 500 }
      );
    }

    // Validate and normalize fields
    const normalizedFields: FormField[] = formData.fields.map((field: any, index: number) => {
      if (!field.id || !field.type || !field.label) {
        throw new Error(`Invalid field at index ${index}: missing id, type, or label`);
      }

      if (!["text", "date", "dropdown", "checkbox", "dynamic"].includes(field.type)) {
        throw new Error(`Invalid field type: ${field.type}`);
      }

      const normalizedField: FormField = {
        id: field.id,
        type: field.type as FormField["type"],
        label: field.label,
        required: field.required ?? false,
        placeholder: field.placeholder,
        options: field.options,
        order: field.order ?? index + 1,
      };

      // Handle nested fields for dynamic type
      if (field.type === "dynamic") {
        if (!field.fields || !Array.isArray(field.fields)) {
          throw new Error(`Dynamic field "${field.id}" must have a "fields" array`);
        }
        normalizedField.fields = field.fields.map((nestedField: any) => {
          if (!nestedField.id || !nestedField.type || !nestedField.label) {
            throw new Error(`Invalid nested field in dynamic field "${field.id}": missing id, type, or label`);
          }
          if (!["text", "date", "dropdown", "checkbox"].includes(nestedField.type)) {
            throw new Error(`Invalid nested field type in dynamic field "${field.id}": ${nestedField.type}`);
          }
          return {
            id: nestedField.id,
            type: nestedField.type as "text" | "date" | "dropdown" | "checkbox",
            label: nestedField.label,
            required: nestedField.required ?? false,
            placeholder: nestedField.placeholder,
            options: nestedField.options,
          };
        });
      }

      return normalizedField;
    });

    // Save to Firestore
    const savedForm = await createForm({
      formId: formData.formId,
      fields: normalizedFields,
      title: formData.title,
    });

    return NextResponse.json({
      formId: savedForm.formId,
      fields: savedForm.fields,
      title: savedForm.title,
    });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create form" },
      { status: 500 }
    );
  }
}


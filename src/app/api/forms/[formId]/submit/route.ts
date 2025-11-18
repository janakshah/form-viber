import { NextRequest, NextResponse } from "next/server";
import { saveFormResult, getForm } from "@/lib/firestore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;
    const body = await request.json();
    const { data } = body;

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Form data is required" },
        { status: 400 }
      );
    }

    // Verify form exists
    const form = await getForm(formId);
    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Validate incoming data against form.fields schema
    const errors: string[] = [];
    const fieldIds = new Set(form.fields.map((f) => f.id));
    const submittedKeys = new Set(Object.keys(data));

    // Check for extra keys not in form.fields
    for (const key of submittedKeys) {
      if (!fieldIds.has(key)) {
        // Strip extra keys (remove from data)
        delete data[key];
      }
    }

    // Validate required fields and types
    for (const field of form.fields) {
      const value = data[field.id];

      // Handle dynamic fields (arrays of objects)
      if (field.type === "dynamic") {
        if (field.required) {
          if (!Array.isArray(value) || value.length === 0) {
            errors.push(`${field.label} is required`);
            continue;
          }
        }

        // Validate nested fields in dynamic form entries
        if (Array.isArray(value) && field.fields) {
          for (let i = 0; i < value.length; i++) {
            const entry = value[i];
            if (typeof entry !== "object" || entry === null) {
              errors.push(`${field.label} entry ${i + 1} must be an object`);
              continue;
            }

            for (const nestedField of field.fields) {
              const nestedValue = entry[nestedField.id];

              if (nestedField.required) {
                if (nestedValue === undefined || nestedValue === null || nestedValue === "") {
                  errors.push(`${field.label} - ${nestedField.label} is required for entry ${i + 1}`);
                  continue;
                }
              }

              // Type validation for nested fields
              if (nestedValue !== undefined && nestedValue !== null && nestedValue !== "") {
                switch (nestedField.type) {
                  case "checkbox":
                    if (typeof nestedValue !== "boolean") {
                      errors.push(`${field.label} - ${nestedField.label} must be a boolean for entry ${i + 1}`);
                    }
                    break;
                  case "text":
                    if (typeof nestedValue !== "string") {
                      errors.push(`${field.label} - ${nestedField.label} must be a string for entry ${i + 1}`);
                    }
                    break;
                  case "date":
                    if (typeof nestedValue !== "string") {
                      errors.push(`${field.label} - ${nestedField.label} must be a date string for entry ${i + 1}`);
                    }
                    break;
                  case "dropdown":
                    if (typeof nestedValue !== "string") {
                      errors.push(`${field.label} - ${nestedField.label} must be a string for entry ${i + 1}`);
                    } else if (nestedField.options && !nestedField.options.some((opt) => opt.value === nestedValue)) {
                      errors.push(`${field.label} - ${nestedField.label} must be one of the allowed options for entry ${i + 1}`);
                    }
                    break;
                }
              }
            }
          }
        } else if (value !== undefined && value !== null && !Array.isArray(value)) {
          errors.push(`${field.label} must be an array`);
        }
        continue;
      }

      // Check required fields for non-dynamic fields
      if (field.required) {
        if (value === undefined || value === null || value === "") {
          errors.push(`${field.label} is required`);
          continue;
        }
      }

      // Type validation for non-dynamic fields
      if (value !== undefined && value !== null && value !== "") {
        switch (field.type) {
          case "checkbox":
            if (typeof value !== "boolean") {
              errors.push(`${field.label} must be a boolean`);
            }
            break;
          case "text":
            if (typeof value !== "string") {
              errors.push(`${field.label} must be a string`);
            }
            break;
          case "date":
            if (typeof value !== "string") {
              errors.push(`${field.label} must be a date string`);
            }
            break;
          case "dropdown":
            if (typeof value !== "string") {
              errors.push(`${field.label} must be a string`);
            } else if (field.options && !field.options.some((opt) => opt.value === value)) {
              errors.push(`${field.label} must be one of the allowed options`);
            }
            break;
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    // Save the result
    const resultId = await saveFormResult(formId, data);

    return NextResponse.json({
      success: true,
      resultId,
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}


"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  TextInput,
  Dropdown,
  Checkbox,
  DatePicker,
  DynamicForm,
  type DynamicFormField,
} from "@/components/ui";

interface FormField {
  id: string;
  type: "text" | "date" | "dropdown" | "checkbox" | "dynamic";
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  order: number;
  // For dynamic forms: nested fields that will be repeated
  fields?: Array<{
    id: string;
    type: "text" | "date" | "dropdown" | "checkbox";
    label: string;
    required?: boolean;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
}

interface Form {
  formId: string;
  fields: FormField[];
  title?: string;
}

export default function FormPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [dynamicFormData, setDynamicFormData] = useState<
    Record<string, Array<Record<string, any>>>
  >({});

  const fetchForm = useCallback(async () => {
    try {
      const response = await fetch(`/api/forms/${formId}`);
      if (!response.ok) {
        throw new Error("Form not found");
      }
      const data = await response.json();
      setForm(data);

      // Initialize form data
      const initialData: Record<string, any> = {};
      const initialDynamicData: Record<string, Array<Record<string, any>>> = {};

      data.fields.forEach((field: FormField) => {
        if (field.type === "dynamic") {
          // Initialize dynamic form data with empty array
          initialDynamicData[field.id] = [];
        } else if (field.type === "checkbox") {
          initialData[field.id] = false;
        } else if (field.type === "date" || field.type === "text" || field.type === "dropdown") {
          initialData[field.id] = "";
        }
      });

      setFormData(initialData);
      setDynamicFormData(initialDynamicData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load form");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleDynamicFormChange = (
    fieldId: string,
    index: number,
    subFieldId: string,
    value: any
  ) => {
    setDynamicFormData((prev) => {
      const fieldArray = prev[fieldId] || [{}];
      const updated = [...fieldArray];
      updated[index] = { ...updated[index], [subFieldId]: value };
      return { ...prev, [fieldId]: updated };
    });
  };

  const handleAddDynamicItem = (fieldId: string) => {
    setDynamicFormData((prev) => {
      const fieldArray = prev[fieldId] || [];
      return { ...prev, [fieldId]: [...fieldArray, {}] };
    });
  };

  const handleRemoveDynamicItem = (fieldId: string, index: number) => {
    setDynamicFormData((prev) => {
      const fieldArray = prev[fieldId] || [];
      return { ...prev, [fieldId]: fieldArray.filter((_, i) => i !== index) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (form) {
      for (const field of form.fields) {
        if (field.required) {
          if (field.type === "dynamic") {
            const dynamicData = dynamicFormData[field.id] || [];
            if (dynamicData.length === 0) {
              setError(`${field.label} is required`);
              return;
            }
            // Validate nested required fields
            for (let i = 0; i < dynamicData.length; i++) {
              const item = dynamicData[i];
              if (field.fields) {
                for (const nestedField of field.fields) {
                  if (nestedField.required) {
                    if (nestedField.type === "checkbox") {
                      if (item[nestedField.id] !== true) {
                        setError(`${field.label} - ${nestedField.label} is required for entry ${i + 1}`);
                        return;
                      }
                    } else {
                      if (!item[nestedField.id] || item[nestedField.id] === "") {
                        setError(`${field.label} - ${nestedField.label} is required for entry ${i + 1}`);
                        return;
                      }
                    }
                  }
                }
              }
            }
          } else if (field.type === "checkbox") {
            if (!formData[field.id]) {
              setError(`${field.label} is required`);
              return;
            }
          } else {
            if (!formData[field.id] || formData[field.id] === "") {
              setError(`${field.label} is required`);
              return;
            }
          }
        }
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      // Combine regular form data with dynamic form data
      const submissionData = {
        ...formData,
        ...dynamicFormData,
      };

      const response = await fetch(`/api/forms/${formId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: submissionData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit form");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${formId}/results`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit form");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <p className="text-black dark:text-white">Loading form...</p>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Link
            href="/"
            className="text-black dark:text-white underline hover:opacity-80"
          >
            Go back to generator
          </Link>
        </div>
      </div>
    );
  }

  if (!form) return null;

  // Sort fields by order
  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);

  // Separate regular fields from dynamic fields
  const regularFields = sortedFields.filter((field) => field.type !== "dynamic");
  const dynamicFields = sortedFields.filter((field) => field.type === "dynamic");

  return (
    <div className="min-h-screen bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white mb-4 inline-block"
          >
            ← Back to Generator
          </Link>
          <h1 className="text-4xl font-bold text-black dark:text-white mb-2">
            {form.title || form.formId}
          </h1>
          <div className="flex gap-4 mt-4">
            <Link
              href={`/${formId}/results`}
              className="text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white underline"
            >
              View Results
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {regularFields.map((field) => {
              const commonProps = {
                id: field.id,
                label: field.label,
                required: field.required,
                value: formData[field.id] || "",
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                  const value =
                    field.type === "checkbox"
                      ? (e.target as HTMLInputElement).checked
                      : e.target.value;
                  handleFieldChange(field.id, value);
                },
              };

              switch (field.type) {
                case "text":
                  return (
                    <TextInput
                      key={field.id}
                      {...commonProps}
                      type="text"
                      placeholder={field.placeholder}
                    />
                  );
                case "date":
                  return (
                    <DatePicker
                      key={field.id}
                      {...commonProps}
                    />
                  );
                case "dropdown":
                  return (
                    <Dropdown
                      key={field.id}
                      {...commonProps}
                      options={field.options || []}
                      placeholder={field.placeholder}
                    />
                  );
                case "checkbox":
                  return (
                    <Checkbox
                      key={field.id}
                      {...commonProps}
                      checked={formData[field.id] || false}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>

          {/* Render dynamic forms */}
          {dynamicFields.map((field) => {
            if (!field.fields || field.fields.length === 0) {
              return null;
            }

            const dynamicValues = dynamicFormData[field.id] || [];
            
            // Convert nested fields to DynamicFormField format
            const dynamicFormFields: DynamicFormField[] = field.fields.map((nestedField) => ({
              id: nestedField.id,
              type: nestedField.type,
              label: nestedField.label,
              required: nestedField.required,
              placeholder: nestedField.placeholder,
              options: nestedField.options,
            }));

            return (
              <div key={field.id} className="w-full">
                <DynamicForm
                  title={field.label}
                  fields={dynamicFormFields}
                  values={dynamicValues}
                  onAdd={() => handleAddDynamicItem(field.id)}
                  onRemove={(index) => handleRemoveDynamicItem(field.id, index)}
                  onChange={(index, subFieldId, value) =>
                    handleDynamicFormChange(field.id, index, subFieldId, value)
                  }
                  minItems={field.required ? 1 : 0}
                  addButtonLabel="Add Another"
                  removeButtonLabel="Remove"
                />
              </div>
            );
          })}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400">
                Form submitted successfully! Redirecting to results...
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || success}
            className="w-full md:w-auto px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded-md hover:bg-black/90 dark:hover:bg-white/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : success ? "Submitted!" : "Submit Form"}
          </button>
        </form>
      </div>
    </div>
  );
}


"use client";

import React, { useState } from "react";
import TextInput from "./TextInput";
import DatePicker from "./DatePicker";
import Dropdown from "./Dropdown";
import Checkbox from "./Checkbox";

export interface DynamicFormField {
  id: string;
  type: "text" | "date" | "dropdown" | "checkbox";
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  error?: string;
  helperText?: string;
}

export interface DynamicFormProps {
  title?: string;
  fields: DynamicFormField[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, fieldId: string, value: any) => void;
  values: Array<Record<string, any>>;
  minItems?: number;
  maxItems?: number;
  addButtonLabel?: string;
  removeButtonLabel?: string;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  title,
  fields,
  onAdd,
  onRemove,
  onChange,
  values,
  minItems = 0,
  maxItems,
  addButtonLabel = "Add Another",
  removeButtonLabel = "Remove",
}) => {
  const canAdd = maxItems === undefined || values.length < maxItems;
  const canRemove = values.length > minItems;

  return (
    <div className="w-full space-y-6">
      {title && (
        <h3 className="text-lg font-semibold text-black dark:text-white">
          {title}
        </h3>
      )}
      {values.map((itemValues, index) => (
        <div
          key={index}
          className="relative p-6 border border-black/10 dark:border-white/10 rounded-lg bg-white dark:bg-black space-y-4"
        >
          {index > 0 && (
            <div className="absolute -top-3 left-6">
              <span className="bg-white dark:bg-black px-2 text-xs font-medium text-black/60 dark:text-white/60">
                #{index + 1}
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => {
              const fieldValue =
                field.type === "checkbox"
                  ? itemValues[field.id] || false
                  : itemValues[field.id] || "";
              const commonProps = {
                id: `${field.id}-${index}`,
                label: field.label,
                required: field.required,
                error: field.error,
                helperText: field.helperText,
                value: field.type === "checkbox" ? undefined : fieldValue,
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                  const value =
                    field.type === "checkbox"
                      ? (e.target as HTMLInputElement).checked
                      : e.target.value;
                  onChange(index, field.id, value);
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
                      checked={fieldValue}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>
          {canRemove && index >= minItems && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="mt-2 text-sm font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors duration-200"
            >
              {removeButtonLabel}
            </button>
          )}
        </div>
      ))}
      {canAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 border-2 border-dashed border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white font-medium hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {addButtonLabel}
        </button>
      )}
    </div>
  );
};

export default DynamicForm;


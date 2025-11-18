"use client";

import React from "react";

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            {...(props.id ? { htmlFor: props.id } : {})}
            className="block text-sm font-medium text-black dark:text-white mb-1.5"
          >
            {label}
            {props.required && (
              <span className="text-black dark:text-white ml-0.5">*</span>
            )}
          </label>
        )}
        <input
          ref={ref}
          type="text"
          className={`
            w-full px-4 py-2.5
            bg-white dark:bg-black
            border border-black/10 dark:border-white/10
            rounded-md
            text-black dark:text-white
            placeholder:text-black/40 dark:placeholder:text-white/40
            focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
            focus:border-transparent
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-red-500 dark:border-red-500" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-black/60 dark:text-white/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export default TextInput;


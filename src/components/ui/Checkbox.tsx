"use client";

import React from "react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="flex items-start gap-3">
          <div className="relative flex items-center">
            <input
              ref={ref}
              type="checkbox"
              className={`
                peer
                w-5 h-5
                appearance-none
                border-2 border-black/20 dark:border-white/20
                rounded-sm
                cursor-pointer
                transition-all duration-200
                checked:bg-black dark:checked:bg-white
                checked:border-black dark:checked:border-white
                focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black
                disabled:opacity-50 disabled:cursor-not-allowed
                ${error ? "border-red-500 dark:border-red-500" : ""}
                ${className}
              `}
              {...props}
            />
            <svg
              className="absolute w-3.5 h-3.5 left-0.5 top-0.5 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200 text-white dark:text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          {label && (
            <label
              htmlFor={props.id}
              className="flex-1 text-sm font-medium text-black dark:text-white cursor-pointer select-none"
              onClick={() => {
                if (!props.disabled && ref && "current" in ref && ref.current) {
                  ref.current.click();
                }
              }}
            >
              {label}
              {props.required && (
                <span className="text-black dark:text-white ml-0.5">*</span>
              )}
            </label>
          )}
        </div>
        {error && (
          <p className="mt-1.5 ml-8 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 ml-8 text-sm text-black/60 dark:text-white/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;


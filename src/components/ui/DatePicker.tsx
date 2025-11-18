"use client";

import React from "react";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  helperText?: string;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-black dark:text-white mb-1.5"
          >
            {label}
            {props.required && (
              <span className="text-black dark:text-white ml-0.5">*</span>
            )}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="date"
            className={`
              w-full px-4 py-2.5
              bg-white dark:bg-black
              border border-black/10 dark:border-white/10
              rounded-md
              text-black dark:text-white
              focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
              focus:border-transparent
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              [&::-webkit-calendar-picker-indicator]:cursor-pointer
              [&::-webkit-calendar-picker-indicator]:opacity-60
              [&::-webkit-calendar-picker-indicator]:hover:opacity-100
              ${error ? "border-red-500 dark:border-red-500" : ""}
              ${className}
            `}
            {...props}
          />
        </div>
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

DatePicker.displayName = "DatePicker";

export default DatePicker;


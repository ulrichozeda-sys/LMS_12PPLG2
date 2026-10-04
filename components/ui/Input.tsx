"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";

const focusRing =
  "outline-none transition-colors duration-150 focus-visible:border-ring focus-visible:ring-2 " +
  "focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const baseField =
  `w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground ` +
  `placeholder:text-muted-foreground ${focusRing} disabled:cursor-not-allowed disabled:opacity-60`;

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, "aria-invalid": ariaInvalid, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : ariaInvalid}
        className={`${baseField} ${error ? "border-danger" : ""} ${className}`}
        {...props}
      />
      {error && <p role="alert" className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, "aria-invalid": ariaInvalid, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={3}
        aria-invalid={error ? true : ariaInvalid}
        className={`${baseField} resize-y ${error ? "border-danger" : ""} ${className}`}
        {...props}
      />
      {error && <p role="alert" className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, placeholder, className = "", children, id, "aria-invalid": ariaInvalid, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-foreground">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : ariaInvalid}
        className={`${baseField} ${error ? "border-danger" : ""} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      {error && <p role="alert" className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  )
);
Select.displayName = "Select";
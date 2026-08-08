import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-700"
    >
      {children}
      {required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </label>
  );
}

export interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string | null;
  hint?: string | null;
  children: ReactNode;
}

export function Field({ label, htmlFor, required, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm",
        "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30",
        "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
        invalid
          ? "border-red-400 focus:border-red-500"
          : "border-gray-300 focus:border-blue-600",
        className
      )}
      {...props}
    />
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm",
        "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30",
        "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
        invalid
          ? "border-red-400 focus:border-red-500"
          : "border-gray-300 focus:border-blue-600",
        className
      )}
      {...props}
    />
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  children: ReactNode;
}

export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-blue-600/30",
        "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
        invalid
          ? "border-red-400 focus:border-red-500"
          : "border-gray-300 focus:border-blue-600",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-label={title}
      className={cn(
        "m-auto w-full rounded-lg border border-gray-200 bg-white p-0 shadow-xl",
        "backdrop:bg-gray-900/40 backdrop:backdrop-blur-sm",
        SIZE_CLASSES[size]
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <svg
            aria-hidden
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      {footer ? (
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}

"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";

export interface ArchiveDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
}

/**
 * Shared confirmation dialog for archive/restore actions. Confirms a
 * destructive-ish transition (discontinued / inactive) before calling the
 * server action.
 */
export function ArchiveDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  description = "Esta acción cambia el estado del registro.",
  confirmLabel = "Confirmar",
  loading = false,
}: ArchiveDialogProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch {
      setError("No se pudo completar la acción. Inténtalo de nuevo.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </Dialog>
  );
}

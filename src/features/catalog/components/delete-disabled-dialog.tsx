"use client";

import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";

export function DeleteDisabledDialog({
  open,
  onClose,
  entityName = "elemento",
}: {
  open: boolean;
  onClose: () => void;
  entityName?: string;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Eliminación no disponible"
      description={`No se puede eliminar un ${entityName}.`}
      size="sm"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Entendido
        </Button>
      }
    >
      <p className="text-sm text-gray-600">
        El modelo de datos del catálogo no permite borrados físicos (D-C14):
        los registros se desactivan o descontinúan mediante{" "}
        <span className="font-medium">Archivar</span>, conservando el historial
        y la trazabilidad. Si necesitas recuperar un registro archivado, usa{" "}
        <span className="font-medium">Restaurar</span>.
      </p>
    </Dialog>
  );
}

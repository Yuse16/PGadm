# Arquitectura de eventos

## Ejemplos

- `inventory.snapshot_imported`
- `inventory.stock_changed`
- `commercialization.approved`
- `quotation.created`
- `supply.request_updated`
- `meeting.transcribed`
- `layout.published`

## Uso

Los módulos reaccionan sin acoplarse directamente.

## Regla

Los eventos deben ser idempotentes y auditables.

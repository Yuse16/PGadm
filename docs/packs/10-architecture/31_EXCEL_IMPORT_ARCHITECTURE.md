# Arquitectura del importador Excel

## Componentes

- FileValidator.
- WorkbookReader.
- SheetDetector.
- ColumnMapper.
- WarehouseResolver.
- ProductResolver.
- SnapshotBuilder.
- ChangeDetector.
- ImportReporter.

## Salida

- Resumen.
- Errores.
- Advertencias.
- Snapshot.
- Cambios.
- Registros ignorados.

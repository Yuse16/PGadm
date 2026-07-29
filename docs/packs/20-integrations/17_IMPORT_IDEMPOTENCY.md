# Idempotencia de importación

## Objetivo

Evitar snapshots duplicados al cargar el mismo archivo varias veces.

## Identificación

- Hash del archivo.
- Fuente.
- Fecha.
- Sucursal.
- Almacén.
- Plantilla.
- Número de filas.

## Comportamiento

- Advertir duplicado.
- Permitir reimportar solo con permiso.
- Registrar motivo.

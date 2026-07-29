# Conflictos de sincronización

## Casos

- Dos usuarios editan el layout.
- Cotización cambia en dos dispositivos.
- Estado cambia mientras un usuario está offline.
- Inventario se actualiza durante una solicitud.

## Estrategias

- Versionado optimista.
- `updated_at`.
- Comparación.
- Resolución manual.
- Historial.

## Regla

No sobrescribir silenciosamente.

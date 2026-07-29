# Row Level Security

## Objetivo

Evitar que un usuario consulte datos fuera de su sucursal o permiso.

## Reglas

- Vendedora: sus clientes y datos de sucursal.
- Gerente: toda su sucursal.
- CEDIS: solicitudes relacionadas.
- Comercial: sucursales asignadas.
- Administrador: acceso controlado.

## Regla

RLS debe existir además de filtros en interfaz.

# Estrategia de cubos

## Decisión actual

No se creará un cubo nuevo en servidor durante la primera fase.

Se reutilizará el cubo existente mediante Excel.

## Razón

Crear un cubo real requiere:

- Acceso al Data Warehouse.
- Herramientas de desarrollo.
- Permisos de Analysis Services.
- Despliegue.
- Procesamiento.
- Roles de seguridad.
- Participación de TI o BI.

## Estrategia progresiva

### Fase 1

Excel conectado y carga manual.

### Fase 2

Excel conectado con proceso local asistido.

### Fase 3

Conector local que actualiza y envía tablas limpias.

### Fase 4

Conexión directa autorizada a cubo, SQL o API.

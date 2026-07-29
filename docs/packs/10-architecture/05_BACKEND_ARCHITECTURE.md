# Arquitectura backend

## Responsabilidades

- Autenticación.
- Autorización.
- Validación.
- Persistencia.
- Procesamiento de archivos.
- Ejecución de agentes.
- Sincronización.
- Auditoría.
- Notificaciones.

## Opciones

### Primera versión

- Next.js server actions o API routes.
- Supabase para base de datos, autenticación y almacenamiento.

### Evolución

- Servicios separados para:
  - sincronización,
  - IA,
  - transcripción,
  - importaciones,
  - notificaciones.

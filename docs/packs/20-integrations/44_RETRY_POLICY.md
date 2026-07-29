# Política de reintentos

## Reintentar

- Error temporal.
- Timeout.
- Servicio no disponible.
- Límite temporal.

## No reintentar automáticamente

- Credencial inválida.
- Permiso denegado.
- Archivo incorrecto.
- Validación fallida.
- Contrato incompatible.

## Estrategia

Backoff exponencial con límite.

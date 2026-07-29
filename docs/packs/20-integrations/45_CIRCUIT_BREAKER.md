# Circuit breaker

## Objetivo

Evitar saturar una integración que está fallando.

## Estados

- Cerrado.
- Abierto.
- Semiabierto.

## Comportamiento

- Suspender llamadas.
- Mostrar modo degradado.
- Probar recuperación.
- Notificar.

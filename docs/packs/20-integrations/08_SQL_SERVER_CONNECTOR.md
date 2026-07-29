# Conector SQL Server

## Arquitectura

Un servicio backend autorizado realiza consultas y transforma respuestas al contrato interno.

## Debe incluir

- Pool de conexiones.
- Cifrado.
- Timeout.
- Reintentos limitados.
- Consultas parametrizadas.
- Paginación.
- Logs.
- Métricas.
- Circuit breaker.

## Restricción

No ejecutar consultas construidas directamente desde texto del usuario o de la IA.

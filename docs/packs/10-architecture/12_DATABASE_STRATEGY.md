# Estrategia de base de datos

## Motor sugerido

PostgreSQL.

## Principios

- Claves UUID.
- Timestamps en UTC.
- Zona horaria al presentar.
- Borrado lógico cuando aplique.
- Historial separado.
- Restricciones.
- Índices.
- Migraciones versionadas.

## Regla

No usar campos JSON para sustituir entidades claras, salvo configuraciones flexibles.

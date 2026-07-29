# Ingesta de los packs 00–25

## Procedimiento

```bash
find . -type f -name "*.md" | sort
```

1. Identificar todos los packs.
2. Crear `docs/INDEX.md`.
3. Extraer reglas, entidades, estados, permisos, integraciones y dudas.
4. Crear `docs/TRACEABILITY.md`.
5. Detectar contradicciones.
6. No reescribir los originales.

## Mapa esperado

00 Gobernanza; 01 Negocio; 02 Layout; 03 Comercialización; 04 Ventas; 05 Inventario; 06 CEDIS; 07 CRM; 08 Juntas; 09 IA; 10 Arquitectura; 11 Proveedores; 12 Entregas; 13 Reportes; 14 Administración; 15 UX; 16 QA; 17 Roadmap; 18 Capacitación; 19 Agentes; 20 Integraciones; 21 Migración; 22 Seguridad; 23 Contratos; 24 Consolidación; 25 Auditoría.

## Resultado

Trazabilidad: `regla → historia → código → prueba → release`.

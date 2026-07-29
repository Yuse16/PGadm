# Integración directa futura

## Posibilidades

- Vista SQL de solo lectura.
- API autorizada.
- SDK Intelisis.
- Consulta autorizada a Analysis Services.
- Exportación programada.

## Arquitectura

La aplicación debe usar adaptadores:

- `ExcelInventoryDataSource`
- `CubeInventoryDataSource`
- `IntelisisSqlDataSource`
- `IntelisisApiDataSource`

## Objetivo

Cambiar la fuente sin rehacer módulos de ventas, layout o comercialización.

# Arquitectura de adaptadores

## Interfaces sugeridas

- `ProductCatalogAdapter`
- `InventoryAdapter`
- `SalesAdapter`
- `MovementAdapter`
- `PriceAdapter`
- `CustomerAdapter`
- `DocumentStorageAdapter`
- `ChatModelAdapter`
- `EmbeddingAdapter`
- `TranscriptionAdapter`
- `NotificationAdapter`

## Regla

Los módulos consumen interfaces.

No deben importar directamente SDKs externos.

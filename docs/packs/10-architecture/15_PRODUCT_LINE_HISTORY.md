# Historial de línea

## Objetivo

Conservar los cambios de línea de cada producto.

## Entidad

`ProductLineHistory`

## Campos

- product_id
- line_id
- source
- valid_from
- valid_to
- detected_at
- campaign_id

## Regla

No sobrescribir el pasado cuando un producto pasa a Impulso o vuelve a otra línea.

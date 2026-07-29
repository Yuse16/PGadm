# Modelo funcional de datos

## Warehouse

- id
- code
- name
- type
- related_store_id

## Product

- id
- code
- description
- family
- category
- line
- unit
- square_meters_per_box
- pieces_per_box
- pallet_quantity

## InventorySnapshot

- id
- warehouse_id
- source
- source_file
- report_date
- imported_at
- imported_by

## InventorySnapshotItem

- snapshot_id
- product_id
- quantity
- boxes
- square_meters

## InventoryChange

- product_id
- warehouse_id
- previous_quantity
- new_quantity
- difference
- detected_at
- source_snapshot_id

## InventoryObservation

- product_id
- warehouse_id
- observed_quantity
- note
- evidence_url
- created_by
- created_at

## ImportTemplate

- id
- name
- sheet_name
- column_mapping
- warehouse_rules

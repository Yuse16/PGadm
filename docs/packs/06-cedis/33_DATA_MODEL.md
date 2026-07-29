# Modelo funcional de datos

## SupplyRequest

- id
- type
- source_store_id
- source_warehouse_id
- destination_store_id
- product_id
- requested_quantity
- accepted_quantity
- pending_quantity
- status
- reason
- required_date
- estimated_value
- created_by
- created_at

## SupplyRequestStatusHistory

- request_id
- previous_status
- new_status
- changed_by
- changed_at
- note

## SupplyRequestMessage

- request_id
- author_id
- message
- attachment_url
- created_at

## DemandSignal

- store_id
- product_id
- status
- client_requests
- estimated_demand
- first_detected_at
- last_detected_at
- normalized_at

## TransitRecord

- request_id
- shipped_quantity
- departed_at
- estimated_arrival
- received_at
- status

## ReceiptRecord

- request_id
- received_quantity
- damaged_quantity
- missing_quantity
- received_by
- received_at
- evidence_url

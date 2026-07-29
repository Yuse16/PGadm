# Modelo funcional de datos

## Supplier

- id
- code
- name
- status
- lead_time_days
- delivery_cadence

## SupplierContact

- supplier_id
- name
- role
- phone
- email
- preferred_channel

## PendingPurchaseItem

- store_id
- product_id
- supplier_id
- requested_quantity
- required_date
- opportunity_id
- status

## PurchaseRequest

- id
- store_id
- supplier_id
- status
- requested_by
- approved_by
- created_at

## PurchaseOrderReference

- id
- purchase_request_id
- intelisis_folio
- status
- promised_date
- confirmed_at

## Receipt

- id
- purchase_order_id
- invoice_number
- received_at
- received_by
- status

## ReceiptItem

- receipt_id
- product_id
- invoiced_quantity
- physical_quantity
- damaged_quantity
- missing_quantity

## SupplierIncident

- id
- supplier_id
- purchase_order_id
- receipt_id
- type
- status
- reported_at
- promised_resolution_at

## SupplierIncidentMessage

- incident_id
- author_id
- channel
- message
- attachment_url
- created_at

## Replacement

- incident_id
- product_id
- quantity
- promised_at
- shipped_at
- received_at
- status

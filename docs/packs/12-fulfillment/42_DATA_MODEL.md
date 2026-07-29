# Modelo funcional de datos

## FulfillmentCase

- id
- intelisis_folio
- store_id
- customer_id
- seller_id
- status
- sale_date
- required_date
- ready_at
- delivered_at
- canceled_at

## FulfillmentItem

- case_id
- product_id
- ordered_quantity
- sourced_quantity
- reserved_quantity
- delivered_quantity
- pending_quantity

## ReservedLocation

- case_id
- zone
- rack
- level
- pallet
- package_count
- note

## FulfillmentStatusHistory

- case_id
- previous_status
- new_status
- changed_by
- changed_at
- note

## CustomerContactAttempt

- case_id
- channel
- result
- contacted_by
- contacted_at
- next_action_at

## DeliveryRecord

- case_id
- type
- delivered_quantity
- received_by_name
- delivered_by
- delivered_at
- evidence_url

## FulfillmentIncident

- case_id
- type
- description
- status
- evidence_url
- created_at

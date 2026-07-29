# Modelo funcional de datos

## Product

- id
- code
- description
- brand
- supplier
- line
- format
- finish
- image_url
- technical_sheet_id

## ProductStock

- product_id
- warehouse_id
- quantity
- boxes
- square_meters
- source
- updated_at

## Customer

- id
- name
- phone
- whatsapp
- assigned_seller_id

## Opportunity

- id
- customer_id
- seller_id
- store_id
- status
- estimated_value
- required_date
- lost_reason

## Quotation

- id
- folio
- customer_id
- seller_id
- store_id
- status
- subtotal
- total
- valid_until

## QuotationItem

- quotation_id
- product_id
- square_meters
- waste_percent
- boxes
- unit_price
- total

## DailySellerSales

- seller_id
- store_id
- date
- sales_amount
- ticket_count
- created_by
- updated_by

## FollowUp

- opportunity_id
- due_at
- type
- status
- note

## CedisRequest

- opportunity_id
- product_id
- requested_quantity
- accepted_quantity
- status
- required_date

# Modelo funcional de datos

## Customer

- id
- name
- phone
- whatsapp
- email
- type
- store_id
- owner_user_id
- created_at

## CustomerProject

- id
- customer_id
- name
- project_type
- square_meters
- budget
- required_date
- notes

## Opportunity

- id
- customer_id
- project_id
- seller_id
- store_id
- status
- estimated_value
- probability
- expected_close_date
- lost_reason

## FollowUp

- id
- opportunity_id
- assigned_to
- type
- due_at
- status
- result
- completed_at

## CustomerInteraction

- id
- customer_id
- opportunity_id
- channel
- summary
- created_by
- created_at

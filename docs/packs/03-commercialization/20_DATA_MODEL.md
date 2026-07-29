# Modelo funcional de datos

## Entidades

### CommercializationPeriod

- id
- store_id
- year
- month
- status
- current_version_id
- created_at

### CommercializationVersion

- id
- period_id
- version_number
- change_summary
- status
- approved_by
- approved_at

### SourceAsset

- id
- version_id
- type
- title
- file_url
- raw_text
- uploaded_by
- uploaded_at

### Transcript

- id
- source_asset_id
- text
- status
- created_at

### AIConversation

- id
- version_id
- user_id
- created_at

### AIMessage

- id
- conversation_id
- role
- content
- created_at

### Checklist

- id
- version_id
- status
- approved_by
- approved_at

### ChecklistItem

- id
- checklist_id
- action_type
- description
- product_code
- location_id
- status
- priority

### Evidence

- id
- checklist_item_id
- type
- file_url
- note
- created_by
- created_at

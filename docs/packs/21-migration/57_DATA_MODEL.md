# Modelo funcional de datos

## MigrationSource

- id
- name
- type
- owner
- source_date
- status
- sensitivity

## MigrationBatch

- id
- source_id
- entity_type
- version
- status
- started_at
- completed_at

## MigrationRecord

- batch_id
- source_row
- external_id
- internal_id
- status
- warnings
- errors

## MappingDefinition

- id
- source_type
- entity_type
- version
- mapping
- approved_by

## MigrationException

- batch_id
- record_id
- type
- description
- resolution
- owner
- due_at
- status

## MigrationApproval

- batch_id
- approved_by
- result
- comments
- approved_at

## MigrationReconciliation

- batch_id
- expected_count
- actual_count
- differences
- status

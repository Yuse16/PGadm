# Modelo funcional de datos

## Connector

- id
- organization_id
- code
- type
- provider
- version
- status
- configuration
- created_at

## ConnectorScope

- connector_id
- scope_type
- scope_id
- active

## SyncSchedule

- connector_id
- frequency
- timezone
- next_run_at
- active

## SyncRun

- id
- connector_id
- status
- started_at
- completed_at
- records_read
- records_created
- records_updated
- warnings
- errors

## SyncCheckpoint

- connector_id
- key
- value
- updated_at

## ExternalReference

- system
- entity_type
- internal_id
- external_id
- scope
- metadata

## MappingTemplate

- connector_id
- name
- version
- source_schema
- target_schema
- active

## IntegrationError

- sync_run_id
- code
- category
- severity
- message
- retryable
- context

## CredentialReference

- connector_id
- secret_reference
- rotated_at
- expires_at
- status

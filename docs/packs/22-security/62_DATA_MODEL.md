# Modelo funcional

## SecurityEvent

- id
- organization_id
- store_id
- actor_id
- type
- severity
- context
- created_at

## SecurityAlert

- event_id
- status
- assigned_to
- resolution
- resolved_at

## DataRequest

- subject_reference
- request_type
- status
- verified_at
- resolved_at

## VendorAssessment

- vendor
- service
- risk_level
- data_types
- approved_by
- reviewed_at

## Incident

- severity
- scope
- status
- started_at
- contained_at
- resolved_at
- root_cause

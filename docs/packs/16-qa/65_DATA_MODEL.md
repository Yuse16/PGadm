# Modelo funcional de datos

## TestCase

- id
- module
- title
- preconditions
- steps
- expected_result
- status
- version

## TestRun

- id
- environment
- version
- started_at
- completed_at
- executed_by
- result

## TestResult

- test_run_id
- test_case_id
- status
- actual_result
- evidence_url
- issue_id

## Issue

- id
- type
- severity
- module
- title
- description
- environment
- version
- status
- assigned_to

## Release

- id
- version
- environment
- status
- released_by
- released_at
- rollback_version

## Incident

- id
- severity
- title
- impact
- status
- started_at
- resolved_at
- root_cause

## SupportTicket

- id
- user_id
- store_id
- module
- priority
- status
- assigned_to
- created_at

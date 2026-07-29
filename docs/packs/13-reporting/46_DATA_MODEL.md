# Modelo funcional de datos

## MetricDefinition

- id
- code
- name
- description
- formula
- unit
- source_type
- version
- active

## Dashboard

- id
- name
- audience
- store_scope
- layout_config
- active

## DashboardWidget

- dashboard_id
- metric_id
- type
- position
- filters
- visibility_rules

## ReportDefinition

- id
- name
- module
- columns
- filters
- permissions
- created_by

## ScheduledReport

- report_definition_id
- frequency
- recipients
- format
- next_run_at
- active

## MetricSnapshot

- metric_id
- store_id
- period_start
- period_end
- value
- source
- calculated_at

## Insight

- store_id
- module
- title
- explanation
- evidence
- confidence
- created_at

# Modelo funcional de datos

## Organization

- id
- name
- timezone
- currency
- status
- settings

## Store

- id
- organization_id
- code
- name
- timezone
- status
- settings

## User

- id
- organization_id
- name
- email
- phone
- status
- last_login_at

## Role

- id
- organization_id
- name
- description
- system_role
- active

## Permission

- id
- code
- module
- action
- scope

## RolePermission

- role_id
- permission_id

## UserStoreRole

- user_id
- store_id
- role_id
- valid_from
- valid_to
- active

## FeatureFlag

- id
- code
- scope_type
- scope_id
- enabled

## IntegrationConfiguration

- id
- provider
- type
- scope_type
- scope_id
- encrypted_credentials
- status

## AuditLog

- id
- actor_id
- store_id
- action
- entity_type
- entity_id
- before_data
- after_data
- reason
- created_at

# Modelo funcional de datos

## KnowledgeDocument

- id
- title
- type
- module
- store_id
- version
- status
- source_type
- source_reference
- content
- approved_by
- approved_at

## KnowledgeObservation

- id
- store_id
- module
- observation
- evidence
- confidence
- status
- created_at

## KnowledgeProposal

- id
- observation_id
- proposed_rule
- scope
- status
- reviewed_by
- reviewed_at

## AIConversation

- id
- user_id
- store_id
- module
- context_reference
- created_at

## AIMessage

- id
- conversation_id
- role
- content
- model
- created_at

## AIRecommendation

- id
- store_id
- module
- action
- explanation
- confidence
- evidence
- status
- created_by_model
- created_at

## RecommendationOutcome

- recommendation_id
- decision
- executed
- result
- note
- recorded_by
- recorded_at

# Modelo funcional de datos

## TrainingCourse

- id
- title
- role
- module
- version
- status

## TrainingLesson

- course_id
- title
- order
- content_type
- content_reference
- required

## TrainingEnrollment

- course_id
- user_id
- assigned_at
- due_at
- status

## TrainingAssessment

- course_id
- title
- passing_score
- practical_required

## TrainingAttempt

- assessment_id
- user_id
- score
- result
- completed_at
- evidence_url

## HelpArticle

- id
- module
- title
- content
- version
- status

## AdoptionMetric

- store_id
- user_id
- metric
- value
- period_start
- period_end

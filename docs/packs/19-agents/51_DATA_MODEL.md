# Modelo funcional de datos

## AgentTask

- id
- story_id
- agent_type
- tool
- branch
- status
- started_at
- completed_at

## AgentLock

- task_id
- resource_type
- resource_name
- locked_by
- expires_at

## AgentHandoff

- task_id
- summary
- changed_files
- migrations
- tests
- risks
- next_steps
- commit_reference

## AgentReview

- task_id
- reviewer_type
- gate
- result
- findings
- reviewed_at

## AgentMetric

- agent_type
- tool
- metric
- value
- period_start
- period_end

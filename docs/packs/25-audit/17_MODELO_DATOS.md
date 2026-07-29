# Modelo funcional

## AuditTemplate
id, code, name, type, version, total_points, passing_percentage, status, vigencia.

## AuditModule
id, template_id, code, name, order, maximum_points.

## AuditQuestion
id, module_id, code, text, points, order, evidence_required, guidance.

## Audit
id, template_id, store_id, audit_type, status, auditor_id, manager_id, submanager_id, applicable_points, obtained_points, percentage.

## AuditAnswer
id, audit_id, question_id, result, obtained_points, comment, answered_by, validated_by.

## AuditFinding
id, audit_answer_id, priority, status, responsible_id, due_at, description, recurrence_key.

## CorrectiveAction
id, finding_id, title, description, responsible_id, status, progress, due_at, validated_by.

## AuditEvidence
id, audit_id, finding_id, action_id, file_id, description, status, uploaded_by, validated_by.

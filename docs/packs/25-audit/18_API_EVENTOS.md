# API y eventos

## Endpoints

- `GET /audit-templates`
- `POST /audits`
- `GET /audits/{id}`
- `PUT /audits/{id}/answers/{questionId}`
- `POST /audits/{id}/calculate`
- `POST /audits/{id}/close`
- `GET /audits/{id}/report`
- `POST /audit-findings/{id}/actions`
- `POST /audit-findings/{id}/progress`
- `POST /audit-findings/{id}/evidence`
- `POST /audit-findings/{id}/validate`

## Eventos

- `audit.created`
- `audit.failed_item_detected`
- `audit.calculated`
- `audit.finding_assigned`
- `audit.action_due`
- `audit.evidence_rejected`
- `audit.finding_closed`

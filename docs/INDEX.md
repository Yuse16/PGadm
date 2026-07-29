# Documentation Index

## Packs (Domain Documentation)

| # | Name | Folder | Purpose | Status |
|---|------|--------|---------|--------|
| 00 | Governance | `docs/packs/00-governance/` | Project governance, roles, and decision-making framework | Imported |
| 01 | PWA Requirements | `docs/packs/01-pwa-requirements/` | PWA functional and non-functional requirements | Imported |
| 02 | Tech Stack | `docs/packs/02-tech-stack/` | Technology stack definition and rationale | Imported |
| 03 | Database | `docs/packs/03-database/` | Database schema, migrations, and data model | Imported |
| 04 | Backend | `docs/packs/04-backend/` | Backend architecture, API, and business logic | Imported |
| 05 | Frontend | `docs/packs/05-frontend/` | Frontend components, routes, and state management | Imported |
| 06 | Auth | `docs/packs/06-auth/` | Authentication and authorization system | Imported |
| 07 | QA | `docs/packs/07-qa/` | Quality assurance, testing, and CI/CD | Imported |
| 08 | Security | `docs/packs/08-security/` | Security policies, audits, and compliance | Imported |
| 09 | Documentation | `docs/packs/09-documentation/` | Documentation standards and tooling | Imported |
| 10 | Inventory | `docs/packs/10-inventory/` | Inventory management domain | Imported |
| 11 | Layout | `docs/packs/11-layout/` | Warehouse and facility layout management | Imported |
| 12 | Sales | `docs/packs/12-sales/` | Sales processes and order management | Imported |
| 13 | CRM | `docs/packs/13-crm/` | Customer relationship management | Imported |
| 14 | Commercialization | `docs/packs/14-commercialization/` | Product commercialization and catalog | Imported |
| 15 | Meetings | `docs/packs/15-meetings/` | Meeting scheduling and management | Imported |
| 16 | Supply | `docs/packs/16-supply/` | Supply chain and procurement | Imported |
| 17 | Suppliers | `docs/packs/17-suppliers/` | Supplier management and evaluation | Imported |
| 18 | Fulfillment | `docs/packs/18-fulfillment/` | Order fulfillment and logistics | Imported |
| 19 | AI | `docs/packs/19-ai/` | AI features and integration | Imported |
| 20 | Reporting | `docs/packs/20-reporting/` | Reporting and analytics | Imported |
| 21 | UX | `docs/packs/21-ux/` | User experience and design system | Imported |
| 22 | Multitenancy | `docs/packs/22-multitenancy/` | Multi-tenant architecture | Imported |
| 23 | Localization | `docs/packs/23-localization/` | i18n and localization | Imported |
| 24 | Deployment | `docs/packs/24-deployment/` | Deployment and DevOps | Imported |
| 25 | Audit | `docs/packs/25-audit/` | Audit logging and compliance | Imported |

## Orchestration (Agent & Workflow Documentation)

| Section | Path | Contents |
|---------|------|----------|
| Agents | `docs/orchestration/agents/` | Specialized agent definitions (DB, BE, FE, Auth, QA, Security, Docs, Inventory, Layout, Sales, CRM, Comercialization, Meetings, Supply, Suppliers, Fulfillment, AI, Reporting) |
| Phases | `docs/orchestration/phases/` | Phase execution plans (00–12) |
| Workflows | `docs/orchestration/workflows/` | Git workflow, branching, PR rules, quality/security gates, DB migration rules, DoD/DoR, doc ingestion |
| Prompts | `docs/orchestration/prompts/` | Dynamic prompt presets (OPENCODE_MASTER, CONTINUE_WORK, AUDIT_REPOSITORY, TASK_EXECUTION, RELEASE) |
| Templates | `docs/orchestration/templates/` | HANDOFF, TASK, BUG_REPORT, PULL_REQUEST templates |

## Root Configuration Files

| File | Purpose |
|------|---------|
| `README.md` | Repository overview and getting started |
| `AGENTS.md` | Agent definitions and registry |
| `AGENT_STATE.md` | Current agent activity state |
| `DECISION_LOG.md` | Architectural decision records |
| `CHANGELOG.md` | Release changelog |
| `TASK_LOCKS.md` | Task lock registry |
| `.gitignore` | Git ignore rules |
| `.gitattributes` | Git attributes configuration |
| `.editorconfig` | Editor configuration |
| `.env.example` | Environment variable template |

## Map Legend

- **Imported** — documentation consolidated from source packs
- **In Review** — under review for accuracy
- **Current** — actively used and maintained
- **Draft** — placeholder or stub awaiting content

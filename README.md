# PGadm — Plomería García PWA

Multi-agent PWA for plumbing service management. Built incrementally across 13 phases with dedicated AI agents for database, backend, frontend, auth, QA, security, documentation, inventory, layout, sales, CRM, commercialization, meetings, supply, suppliers, fulfillment, AI, and reporting.

## Repository Structure

```
PGadm/
├── AGENTS.md              # Agent definitions & registry
├── AGENT_STATE.md         # Current agent activity state
├── DECISION_LOG.md        # Architectural decision records
├── CHANGELOG.md           # Release changelog
├── TASK_LOCKS.md          # Task lock registry
├── docs/
│   ├── INDEX.md           # Master documentation index
│   ├── TRACEABILITY.md    # Cross-reference traceability map
│   ├── ARCHITECTURE.md    # System architecture overview
│   ├── SECURITY.md        # Security policies & posture
│   ├── TESTING.md         # Testing strategy & guidelines
│   └── packs/
│       ├── 00-governance/ … 25-audit/
│       └── orchestration/
│           ├── agents/    # Specialized AI agent docs
│           ├── phases/    # Phase execution plans
│           ├── workflows/ # Git & CI/CD workflows
│           ├── prompts/   # Dynamic prompt presets
│           └── templates/ # Issue & PR templates
└── (future: src/, tests/, database/)
```

## Getting Started

1. Clone the repository
2. Review `docs/INDEX.md` for the complete documentation map
3. Check `AGENTS.md` for agent responsibilities
4. Follow phase guides in `docs/orchestration/phases/`

## Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Repository Bootstrap | Planning |
| 1 | Static PWA Shell | Planning |
| 2 | Database & Auth | Planning |
| 3 | Backend Core | Planning |
| 4 | Frontend Core | Planning |
| 5 | Inventory | Planning |
| 6 | Sales & CRM | Planning |
| 7 | Layout & Commercialization | Planning |
| 8 | Meetings & Supply | Planning |
| 9 | Suppliers & Fulfillment | Planning |
| 10 | AI & Reporting | Planning |
| 11 | Hardening | Planning |
| 12 | Launch | Planning |

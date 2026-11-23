# Skills Summary - Available Skills Index

**Project:** Innovation Cards (Agile Deck)  
**Skills Directory:** `./.agents/skills/`  
**Total Skills:** 15  
**Last Updated:** 2026-11-23

---

## Overview

All skills are pre-installed in the `.agents/skills` directory and can be loaded on-demand using the `skill` tool. They cover a wide range of product development tasks including documentation, design, architecture, and testing.

---

## Skill Catalog

| # | Skill ID | Category | Primary Use Case |
|---|----------|----------|------------------|
| 1 | `architecture-decision-records` | Documentation | Register ADRs (Architecture Decision Records) with context, options, decision and trade-offs |
| 2 | `deliver-prd` | Documentation | Create comprehensive Product Requirements Documents aligning stakeholders |
| 3 | `deliver-user-stories` | Documentation | Generate user stories in persona/action/benefit format with acceptance criteria |
| 4 | `develop-solution-brief` | Documentation | Create concise one-page solution overviews communicating approach and trade-offs |
| 5 | `discover-competitive-analysis` | Analysis | Structured competitive analysis with 2x2 mapping and strategic recommendations |
| 6 | `extract-design-system` | Design | Extract visual identity, CSS tokens and components from URLs for reusable design systems |
| 7 | `foundation-persona` | Analysis | Generate evidence-calibrated product/marketing personas v2.5 |
| 8 | `frontend-design` | Design | Visual design guidance for UI building/reshaping (typography, aesthetics, intentional design) |
| 9 | `migrate-radix-to-base` | Migration | Migrate React components from Radix UI to Base UI |
| 10 | `python-backend-architecture` | Architecture | Comprehensive Python backend architecture review |
| 11 | `shadcn` | Components | Manage shadcn components and projects (add, search, fix, style, compose) |
| 12 | `skill-creator` | Development | Create, modify and improve skills; measure skill performance; run evals |
| 13 | `ux-ascii-designer` | Design | Generate UX/UI ASCII mockups and SDD specifications for Django-cotton/HTMX |
| 14 | `web-solutions-architect` | Architecture | Senior web solutions architect (modern architecture, governance, execution) |
| 15 | `webapp-testing` | Testing | Playwright-based web app testing toolkit (verify frontend, debug UI, capture screenshots) |

---

## Quick Start Examples

### Load a Single Skill
```<skill id="architecture-decision-records">```

### Load Multiple Skills (concurrently)
Skills can be loaded sequentially or in parallel depending on the task requirements.

### Common Use Cases

**1. Creating Documentation**
- `deliver-prd` → Full PRD from feature description
- `deliver-user-stories` → Break features into sprint stories
- `architecture-decision-records` → Document architectural choices as ADRs

**2. Design & UI**
- `extract-design-system` → Clone design system from existing URL
- `frontend-design` → Get visual design guidance
- `ux-ascii-designer` → Create ASCII mockups with SDD specs

**3. Analysis & Research**
- `discover-competitive-analysis` → Compare against competitors
- `foundation-persona` → Generate user personas
- `web-solutions-architect` → Define system architecture

**4. Development & Migration**
- `migrate-radix-to-base` → Move from Radix to Base UI
- `shadcn` → Manage shadcn components
- `skill-creator` → Create custom skills

---

## Directory Structure

```
.agents/skills/
├ architecture-decision-records/
├ deliver-prd/
├ deliver-user-stories/
├ develop-solution-brief/
├ discover-competitive-analysis/
├ extract-design-system/
├ foundation-persona/
├ frontend-design/
├ migrate-radix-to-base/
├ python-backend-architecture/
├ shadcn/
├ skill-creator/
├ ux-ascii-designer/
├ web-solutions-architect/
└ webapp-testing/
```

Each skill directory contains the instructions, templates, and resources needed for that skill.

---

## Usage Notes

- Skills are **loaded on-demand** - no global installation required
- Each skill operates independently with its own context and output format
- Skills can be chained/combined for complex workflows
- The `skill-creator` tool can be used to create custom skills if needed
- All skills follow the project's standards and integrate with the Innovation Cards platform

---

## Recommendations by Task Type

| Task | Recommended Skills |
|------|-------------------|
| **New Feature Specification** | `deliver-prd`, `deliver-user-stories` |
| **Architecture Documentation** | `architecture-decision-records`, `web-solutions-architect` |
| **Design System Extraction** | `extract-design-system`, `frontend-design` |
| **Competitive Research** | `discover-competitive-analysis` |
| **User Persona Creation** | `foundation-persona` |
| **UI/UX Mockups** | `ux-ascii-designer`, `frontend-design` |
| **Component Migration** | `migrate-radix-to-base`, `shadcn` |
| **Testing & QA** | `webapp-testing` |

---

*Generated from the `.agents/skills` directory available in the Innovation Cards project.*
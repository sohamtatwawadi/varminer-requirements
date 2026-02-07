# VarMiner Functional Requirements — Capture Guide

This folder contains a **single, consolidated** way to capture and track VarMiner functional requirements so nothing falls through the cracks and priorities are clear.

---

## Why this structure?

| Before | After |
|--------|--------|
| Two separate tables (report details vs. lifecycle) | **One requirement = one row** with both “what” and “when/who” |
| Empty Dependency column | **Dependency** required when one requirement blocks another |
| Unclear “done” | **Acceptance criteria** define when a requirement is complete |
| No status on the requirement itself | **Status** (To Do → In Progress → Done) in the same place |
| Estimate without unit | **Estimate** in story points or hours (defined once) |
| Missing ownership | **Requestee**, **Assignee**, **Department** on every requirement |

---

## How to use

1. **New requirement** → Add one row to `requirements.csv` (or copy the template in `REQUIREMENTS_TEMPLATE.md`).
2. **Fill every column** that applies; use “—” or “TBD” only when you will come back to it.
3. **Dependencies** → Put the Task ID(s) this requirement depends on (e.g. `3, 5`). Plan and schedule those first.
4. **Acceptance criteria** → At least 1–3 bullet points so “done” is testable.
5. **Status** → Update as work progresses: `To Do` → `In Progress` → `In Review` → `Done` (or `Blocked`).
6. **Estimate** → Use one unit across the project (e.g. story points). Define it once in your team (see below).

---

## Field definitions

| Field | Purpose | Example |
|-------|---------|--------|
| **ID** | Unique ID (numeric or code). | `VR-001`, `1` |
| **Category** | Area/product. | `VarMiner` |
| **Type** | Kind of requirement. | `Report Requirements`, `API`, `UI` |
| **Requirement** | One short sentence: what we will deliver. | “Develop white-label report templates for domestic and international clients.” |
| **Description** | Context, scope, and “why.” | “Create tailored white-label report templates… branding flexibility and format standardization for external partners.” |
| **Acceptance criteria** | Testable conditions for “done.” | “• Template supports logo upload. • Domestic and international variants exist. • PDF export matches spec.” |
| **Clear?** | Is the requirement unambiguous enough to implement? | `Yes` / `No` (if No, add a note in Comments and clarify before dev). |
| **Estimate** | Effort (use one unit: e.g. story points or hours). | `16` (e.g. 16 story points) |
| **Dependency** | IDs of requirements that must be done (or started) first. | `2, 3` or `—` |
| **Priority** | Business importance. | `Critical` / `High` / `Medium` / `Low` |
| **Stack rank** | Order within same priority (lower = do first). | `1`, `2`, … |
| **Status** | Current state (for dashboard KPIs). | `Not started` / `In DEV` / `In UAT` / `Dev completed` / `Closed` |
| **Start sprint** | When work started or will start. | `July H2` |
| **Target sprint** | When it should be done. | `Aug H2` |
| **Release** | Target release/version. | `Q3-2025`, `v2.8` |
| **Requestee dept** | Who asked for it. | `CRT`, `Genessense` |
| **Requested by** | Person or team. | `CRT team`, `Ramamurthy` |
| **Assignee** | Person responsible for delivery. | Name or team |
| **Comments** | Blockers, decisions, links. | “Releasing in v2.8”, “To discuss: report from Clinical software from Thenral” |

---

## Estimate unit (define once)

Choose one and stick to it:

- **Story points** (e.g. 1 = ~0.5 day, 5 = ~2–3 days, 13 = ~1–2 weeks), or  
- **Hours** (e.g. 5, 16, 40).

Write your choice here so everyone uses the same unit:

- **Our estimate unit:** _e.g. Story points (1–21 scale)_ or _Hours_

---

## Files in this folder

| File | Use |
|------|-----|
| `README.md` | This guide. |
| `REQUIREMENTS_TEMPLATE.md` | Empty table template and a one-row example. Copy into your doc or wiki. |
| `requirements.csv` | Spreadsheet-friendly format. Open in Excel/Sheets; one row per requirement. |
| `report-requirements-example.md` | Your current Report Requirements (Tasks 1–6) migrated into the new format. |
| `dashboard.py` | Python (Streamlit) dashboard — KPIs + backlog. |
| `requirements-dashboard.txt` | Python deps for Streamlit dashboard. |
| `dashboard-java/` | **Java (Spring Boot) dashboard** — modern UI, KPIs, Capture requirement, Product backlog. |

---

## Product Backlog Dashboard

Two options:

### Java dashboard (recommended — modern UI)

A **Spring Boot** web app with a lab-style UI ([Figma-style reference](https://paint-smooth-31188563.figma.site)):

- **Left panel:** Dashboard | **Capture requirement** | **Product backlog**
- **Dashboard:** KPI cards — Total, Not started, In DEV, In UAT, Dev completed, Closed
- **Capture requirement:** Form to add new requirements (saved to `requirements.csv`)
- **Product backlog:** Filterable table (Status, Priority) and row click for full detail

**Run:**

```bash
cd varminer-requirements/dashboard-java
mvn spring-boot:run
```

Open **http://localhost:8080**. CSV path: `../requirements.csv` when run from `dashboard-java`, or set `VARMINER_CSV_PATH` to an absolute path.

See `dashboard-java/README.md` for API and layout.

### Python (Streamlit) dashboard

- **KPIs** and **backlog table** with filters and export.
- **Run:** `pip install -r requirements-dashboard.txt` then `streamlit run dashboard.py` from `varminer-requirements`.

**Status flow** (use in `requirements.csv`):  
`Not started` → `In DEV` → `In UAT` → `Dev completed` → `Closed`

---

## Quick checklist for each new requirement

- [ ] **ID** and **Requirement** (one sentence) filled.
- [ ] **Description** and at least one **Acceptance criterion**.
- [ ] **Clear?** = Yes, or a plan to clarify (and note in Comments).
- [ ] **Priority** and **Stack rank** set.
- [ ] **Dependency** filled if this requirement blocks or is blocked by others.
- [ ] **Requestee** (dept + name) and **Assignee** set.
- [ ] **Status** and **Target sprint** / **Release** set.

Once this is your standard, you can replace the old two-table setup with this single requirements document.

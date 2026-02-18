# VarMiner Requirements Dashboard — Application Overview

Use this document to understand the application as it exists today (for handoff, ChatGPT, or onboarding).

---

## What It Is

**VarMiner** is a product-backlog and requirements tracker. It is a single-page web app with a Java (Spring Boot) backend. Data is stored in a **CSV file** (`requirements.csv`). The app provides:

- **Login** — Only authenticated users can access the app. One admin user can add other users.
- **Dashboard** — KPIs by status, charts (status, priority, clear requirement, release schedule). KPIs and charts are clickable and open the Product backlog with the right filter.
- **Capture requirement** — Form to add a new requirement (saved to CSV).
- **Product backlog** — Filterable table (Status, Type, Priority, Clear req., Release). Rows are clickable to open an **edit/delete** panel. **Download CSV** exports all requirements.
- **Q1 2026** — Separate view listing only requirements whose **Release** contains “Q1”. Same table + edit/delete; **Download CSV** exports only Q1 requirements.
- **Manage users** (admin only) — Add new users (username + password). List of users. Stored in `users.json`.

**Production URL:** `https://varminer-requirements-production.up.railway.app`  
**Run locally:** `cd dashboard-java && mvn spring-boot:run` → http://localhost:8080

---

## Tech Stack

| Layer   | Technology |
|--------|------------|
| Backend | Java 17+, Spring Boot 3.2, Spring Security (form login, session cookie) |
| Frontend | Vanilla HTML/CSS/JS, single-page app; Chart.js for charts |
| Data | `requirements.csv` (OpenCSV), `users.json` (Jackson); both file-based |
| Build | Maven |

---

## Authentication & Users

- **Login page:** `/login.html`. Form POSTs to `/login` (Spring Security). Success redirects to `/`.
- **Default admin:** ID `soham.tatwawadi`, password `soham1010`. This user is **admin** and the only one who can add users.
- **Other users:** Added by admin via **Manage users** in the sidebar. Stored in `users.json` (same directory as CSV or project root). Passwords are BCrypt-hashed.
- **Logout:** Sidebar footer has “Logout” → `/logout` → redirect to login.
- **CORS:** Controllers use `@CrossOrigin(originPatterns = "*", allowCredentials = "true")` (cannot use `origins = "*"` with credentials).

---

## Status & Type Values

**Status** (exactly these, used in KPIs, filters, and forms):

- Not Started  
- In Dev  
- Dev Completed  
- In QA  
- QA Completed  
- In UAT  
- Production Ready  
- Released  

**Type:**

- Functionality  
- Bug  
- Report Requirement  
- Adhoc  
- Other  
- UI  

Backend normalizes legacy values (e.g. “Not started” → “Not Started”, “Closed” → “Released”) via `STATUS_ALIASES` in `RequirementsService`.

---

## API (all under `/api`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/requirements` | Yes | List all requirements |
| GET | `/requirements/export` | Yes | CSV of all requirements. Query `?view=q1` → only Q1 (release contains “Q1”) |
| GET | `/kpis` | Yes | `{ total, byStatus: { "Not Started": n, ... } }` |
| POST | `/requirements` | Yes | Add requirement (ID auto-generated if omitted) |
| PUT | `/requirements/{id}` | Yes | Update requirement |
| DELETE | `/requirements/{id}` | Yes | Delete requirement |
| POST | `/requirements/upload` | Yes | Replace data: multipart file, CSV |
| GET | `/me` | Yes | Current user: `{ username, role: "ADMIN" \| "USER" }` |
| GET | `/users` | Admin only | List users `[{ username, role }]` |
| POST | `/users` | Admin only | Add user; body `{ username, password }` |

---

## Data Model (Requirement / CSV columns)

Same order as in CSV and export:

- ID, Category, Type, Requirement, Description, Acceptance criteria, Clear?, Estimate, Dependency, Priority, Stack rank, Status, Start sprint, Target sprint, Release, Requestee dept, Requested by, Assignee, Comments  

Java model: `com.varminer.dashboard.model.Requirement` (OpenCSV `@CsvBindByName`).

---

## Project Layout (dashboard-java)

```
dashboard-java/
├── pom.xml
├── README.md
└── src/main/
    ├── java/com/varminer/dashboard/
    │   ├── VarminerDashboardApplication.java
    │   ├── config/
    │   │   ├── SecurityConfig.java      # Form login, permit /login.html, /css, /js
    │   │   └── PasswordEncoderConfig.java  # BCrypt bean (avoids circular dep)
    │   ├── controller/
    │   │   ├── RequirementsController.java  # CRUD, upload, export CSV
    │   │   └── AuthController.java          # /me, /users
    │   ├── model/
    │   │   ├── Requirement.java
    │   │   ├── KpiSummary.java          # total + byStatus map
    │   │   ├── UserInfo.java            # username, role
    │   │   └── JiraPushRequest.java     # (JIRA push not wired in UI)
    │   └── service/
    │       ├── RequirementsService.java # CSV read/write, KPIs, getByQ1Release(), toCsv()
    │       ├── UserService.java         # UserDetailsService, users.json, admin add user
    │       └── JiraService.java         # push to JIRA (no controller/UI)
    └── resources/
        ├── application.properties       # server.port, varminer.requirements.csv-path
        └── static/
            ├── index.html               # SPA: Dashboard, Capture, Backlog, Q1 2026, Manage users
            ├── login.html               # Login form (POST /login)
            ├── css/style.css
            └── js/app.js                # All frontend logic
```

---

## Frontend (SPA) Summary

- **Views:** Dashboard, Capture requirement, Product backlog, Q1 2026, Manage users (admin only).
- **Navigation:** Sidebar; “Manage users” and “Logout” only for authenticated user; “Manage users” visible only when `GET /api/me` returns `role === "ADMIN"`.
- **Dashboard:** KPI cards (Total + 8 statuses from `byStatus`). Charts: By status (pie), By priority (bar), Clear requirement (pie), Release schedule (bar). All clickable → switch to Product backlog (and set filter) or, for Total, show all.
- **Product backlog:** Filters: Status, Type, Priority, Clear req., Release. Table rows clickable → detail panel with full form; **Save changes** (PUT), **Delete requirement** (DELETE), **Cancel**.
- **Q1 2026:** Same table + detail panel; data = `getByQ1Release()` (release contains “Q1”).
- **Download CSV:** Product backlog → link to `/api/requirements/export` (all). Q1 2026 → `/api/requirements/export?view=q1`.
- **Init:** On load, `fetchMe()`, then `refreshKpis()`, `loadBacklog()`, `setView('dashboard')`. KPI/chart click handlers use event delegation / `goToBacklogWithFilter({ status, type, priority, clear, release })`.

---

## Configuration

- **CSV path:** `VARMINER_CSV_PATH` env var or default: parent dir `requirements.csv` when run from `dashboard-java`.
- **Users file:** `users.json` in same directory as CSV (or parent). Admin user is not stored in file; only added users are.
- **Server port:** 8080 (override in `application.properties` or env).

---

## Deployment (Railway)

- Build: Maven; run the packaged JAR.
- **Persistent data:** Use a Railway volume and set `VARMINER_CSV_PATH` to a path on that volume (e.g. `/data/requirements.csv`) so requirements and `users.json` persist across deploys.

---

## Quick Reference for AI / New Devs

1. **Add a new status or type:** Backend: `RequirementsService.STATUS_ORDER` or frontend dropdowns + chart labels; KPI cards in `index.html`; `STATUS_LIST` in `app.js`; CSS `.status-*` if needed.
2. **New API endpoint:** Add in `RequirementsController` or `AuthController`; protect with auth (all `/api` is authenticated except login).
3. **New view:** Add section in `index.html`, add entry in `views` in `app.js`, add nav item and `setView` branch.
4. **Auth:** Spring Security form login; `UserService` implements `UserDetailsService`; admin is hardcoded in `UserService`; others in `users.json`.

This document reflects the application state as of the last update (login, admin user management, CSV export, 8 statuses, 6 types, Q1 2026 view, CORS and circular-dependency fixes).

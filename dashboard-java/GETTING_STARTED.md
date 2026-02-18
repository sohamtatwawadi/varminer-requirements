# VarMiner Dashboard — What to Do Now (Step by Step)

## 1. Create a Postgres database (Supabase or local)

**Option A — Supabase (recommended for production)**  
1. Go to [supabase.com](https://supabase.com) and sign in.  
2. Create a new project (choose region, set a DB password).  
3. In the project: **Settings → Database**.  
4. Copy:
   - **Host** (e.g. `db.xxxx.supabase.co`)
   - **Port** (usually `5432`)
   - **Database name** (usually `postgres`)
   - **User** (usually `postgres`)
   - **Password** (the one you set)

**Option B — Local Postgres**  
- Install Postgres and create a database, e.g. `createdb varminer`.

---

## 2. Set environment variables

Use the values from step 1.

**If running from terminal (local):**

```bash
export SPRING_DATASOURCE_URL="jdbc:postgresql://YOUR_HOST:5432/postgres"
export SPRING_DATASOURCE_USERNAME="postgres"
export SPRING_DATASOURCE_PASSWORD="YOUR_DB_PASSWORD"
```

Optional (to create your own admin instead of the default):

```bash
export ADMIN_USERNAME="your.email"
export ADMIN_PASSWORD="your-secure-password"
```

**If deploying on Railway:**  
- In the Railway project, open your service → **Variables**.  
- Add: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` (and optionally `ADMIN_USERNAME`, `ADMIN_PASSWORD`).

---

## 3. Run the app

From the repo root:

```bash
cd dashboard-java
mvn spring-boot:run
```

- On success you’ll see something like “Started VarminerDashboardApplication”.  
- Open **http://localhost:8080** in a browser.

---

## 4. Log in

- If you did **not** set `ADMIN_USERNAME` / `ADMIN_PASSWORD` and the DB had no users, the app creates a default admin:
  - **Username:** `soham.tatwawadi`  
  - **Password:** `soham1010`
- If you **did** set `ADMIN_USERNAME` / `ADMIN_PASSWORD`, use those to log in.

---

## 5. (Optional) Import your old CSV and users

Only if you have existing `requirements.csv` and/or `users.json` from the old file-based app.

1. **Enable the import endpoint** (one time):
   ```bash
   export VARMINER_IMPORT_ENABLED=true
   ```
   Then restart the app (step 3).

2. **Call the import API** (e.g. with curl, after logging in and saving the session cookie):
   ```bash
   # Replace YOUR_APP_URL with http://localhost:8080 or your Railway URL
   curl -c cookies.txt -b cookies.txt -X POST \
     -F "requirements=@/path/to/requirements.csv" \
     -F "users=@/path/to/users.json" \
     "YOUR_APP_URL/api/admin/import"
   ```
   Or use Postman: POST to `/api/admin/import`, form-data, add file fields `requirements` and optionally `users`.

3. **Turn import off again** (recommended):
   ```bash
   unset VARMINER_IMPORT_ENABLED
   # or set VARMINER_IMPORT_ENABLED=false on Railway
   ```
   Restart the app.

---

## 6. Use the app

- **Dashboard** — KPIs, charts, summary (shipments, next release, top 5 priorities, open actions).  
- **Capture requirement** — Add new requirements (saved in Postgres).  
- **Product backlog** — Filters, search, saved views, executive columns; click a row to edit/delete.  
- **Q1 2026** — Same as before (release contains “Q1”).  
- **Roadmap** — Pick quarter/year; see requirements by month.  
- **Upcoming Releases** — List of upcoming releases.  
- **Priorities** — Priority sets (week/month/quarter/custom).  
- **Releases** — Release log, notes, comments.  
- **Meetings** — Weekly/fortnightly meetings, agenda, decisions, action items.  
- **Manage users** (admin only) — Add users (stored in Postgres).

---

## 7. Deploy to Railway (optional)

1. Connect your repo to Railway and create a service from `dashboard-java` (or root with build command from `dashboard-java`).  
2. Add variables: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` (and optional admin/import vars).  
3. Deploy. The app runs migrations on startup; data persists in Supabase.

---

## Quick checklist

| Step | Action |
|------|--------|
| 1 | Create Postgres (Supabase or local) and note host, port, DB name, user, password |
| 2 | Set `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` (and optionally admin vars) |
| 3 | `cd dashboard-java && mvn spring-boot:run` |
| 4 | Open http://localhost:8080 and log in (default: soham.tatwawadi / soham1010 if no env admin) |
| 5 | (Optional) Set `VARMINER_IMPORT_ENABLED=true`, restart, POST CSV/users to `/api/admin/import`, then disable and restart |
| 6 | Use Dashboard, Backlog, Roadmap, Releases, Meetings, Priorities as needed |
| 7 | (Optional) Deploy to Railway with the same env vars |

If anything fails, check the app logs (e.g. “Flyway” or “Connection” errors) and confirm the DB URL and credentials.

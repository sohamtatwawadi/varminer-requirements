# VarMiner Dashboard — Deployment (Railway + Supabase)

## Supabase Postgres

Data is stored in **Supabase Postgres** (or any PostgreSQL 14+). No file storage; all data persists across deploys.

### Environment variables (Railway / production)

| Variable | Required | Description |
|----------|----------|-------------|
| `SPRING_DATASOURCE_URL` | Yes | JDBC URL, e.g. `jdbc:postgresql://db.xxx.supabase.co:5432/postgres` |
| `SPRING_DATASOURCE_USERNAME` | Yes | DB user (e.g. `postgres`) |
| `SPRING_DATASOURCE_PASSWORD` | Yes | DB password |
| `ADMIN_USERNAME` | No | Admin login (created on first run if no users exist) |
| `ADMIN_PASSWORD` | No | Admin password (only used when seeding admin) |
| `VARMINER_IMPORT_ENABLED` | No | Set to `true` to enable one-time import (admin-only). Default: `false` |

If `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set, an admin user is created on startup when that username does not exist. If the DB has no users and env is not set, a default admin `soham.tatwawadi` / `soham1010` is created.

## One-time import from CSV / users.json

When migrating from the old file-based app:

1. Set `VARMINER_IMPORT_ENABLED=true` in the environment.
2. As admin, call the import endpoint once:
   - **POST** `/api/admin/import` with `multipart/form-data`:
     - `requirements`: file = your `requirements.csv`
     - `users`: file = your `users.json` (array of `{ "username", "password" }`)
   - Example with curl (after login and saving session cookie):
     ```bash
     curl -X POST -b cookies.txt -F "requirements=@requirements.csv" -F "users=@users.json" https://your-app.up.railway.app/api/admin/import
     ```
3. Set `VARMINER_IMPORT_ENABLED=false` again (or leave disabled by default) so the endpoint is no longer usable.

No filesystem or persistent volume is required; the app uses only the database.

## Build and run

- **Local (with Postgres):** Set `SPRING_DATASOURCE_URL`, `USERNAME`, `PASSWORD` (and optionally `ADMIN_USERNAME`, `ADMIN_PASSWORD`), then:
  ```bash
  cd dashboard-java && mvn spring-boot:run
  ```
- **Railway:** Build with Maven; run the packaged JAR. Configure the env vars above in the Railway dashboard.

## Flyway

Migrations run on startup from `src/main/resources/db/migration/`. Schema is created/updated automatically; do not use `spring.jpa.hibernate.ddl-auto=create` in production (it is set to `validate`).

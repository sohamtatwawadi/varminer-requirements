# VarMiner Requirements Dashboard (Java)

Modern web dashboard for product managers: **KPIs**, **Capture requirement**, and **Product backlog**. Built with Spring Boot and a single-page UI inspired by genetic testing lab dashboards ([ref](https://paint-smooth-31188563.figma.site)).

## Features

- **Dashboard** — KPI cards: Total requirements, Not started, In DEV, In UAT, Dev completed, Closed
- **Capture requirement** — Form to add new requirements (saved to `requirements.csv`)
- **Product backlog** — Filterable table (Status, Priority) and row click for full detail

## Requirements

- Java 17+
- Maven 3.6+

## Run

From this directory (`dashboard-java`):

```bash
mvn spring-boot:run
```

The app uses `../requirements.csv` (parent folder = `varminer-requirements`) by default. To use another file:

```bash
export VARMINER_CSV_PATH=/absolute/path/to/requirements.csv
mvn spring-boot:run
```

Open: **http://localhost:8080**

## Project layout

```
dashboard-java/
├── pom.xml
├── README.md
└── src/main/
    ├── java/com/varminer/dashboard/
    │   ├── VarminerDashboardApplication.java
    │   ├── controller/RequirementsController.java
    │   ├── model/Requirement.java, KpiSummary.java
    │   └── service/RequirementsService.java
    └── resources/
        ├── application.properties
        └── static/
            ├── index.html
            ├── css/style.css
            └── js/app.js
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/requirements` | List all requirements |
| GET | `/api/kpis` | KPI counts by status |
| POST | `/api/requirements` | Add a requirement (ID auto-generated if omitted) |
| PUT | `/api/requirements/{id}` | Update a requirement |

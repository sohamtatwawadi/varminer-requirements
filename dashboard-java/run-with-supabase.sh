#!/bin/bash
# Run the app with Supabase Postgres.
# If you see "password authentication failed for user postgres":
#   1. In Supabase Dashboard go to: Project Settings → Database
#   2. Copy "Database password" (or reset it and use the new one)
#   3. Put that password in SPRING_DATASOURCE_PASSWORD below (inside single quotes).

export SPRING_DATASOURCE_URL="jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
export SPRING_DATASOURCE_USERNAME="postgres.zsxaoguryybevvrezcfo"
export SPRING_DATASOURCE_PASSWORD='Varminer@1997'

cd "$(dirname "$0")"
mvn spring-boot:run

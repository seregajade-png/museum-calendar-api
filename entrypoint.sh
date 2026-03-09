#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ] && [ -f /app/migration.sql ]; then
  node /app/migrate.js
fi

exec node server.js

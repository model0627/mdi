#!/bin/sh
set -e
# Fix ownership of mounted data volume at runtime
chown -R nextjs:nodejs /app/data
# Drop privileges and exec the main process
exec su-exec nextjs "$@"

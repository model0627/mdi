#!/bin/sh
set -e
# Ensure data/ is world-writable so host CI runner (gitlab-runner) can overwrite files
chmod -R 777 /app/data 2>/dev/null || true
# Drop privileges and exec the main process (umask 000 = new files always world-writable)
umask 000
exec su-exec nextjs "$@"

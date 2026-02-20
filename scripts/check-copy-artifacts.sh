#!/usr/bin/env sh
set -eu

# Detect accidental Finder/editor copy artifacts like "file 2.ts" and "file 3.md".
# Excludes dependency/build/git folders.
BAD_FILES=$(find . \
  -type d \( -name .git -o -name node_modules -o -name dist -o -name build -o -name coverage \) -prune -o \
  -type f -print | \
  rg '/[^/]+ [2-9]\.(ts|tsx|js|jsx|mjs|cjs|py|md|txt|json|yml|yaml|sql|css|html|diff)$' || true)

if [ -n "${BAD_FILES}" ]; then
  echo "Found probable copy-artifact files (defragmentation check failed):"
  echo "${BAD_FILES}"
  echo ""
  echo "Rename/remove these files before committing."
  exit 1
fi

echo "No copy-artifact filenames found."

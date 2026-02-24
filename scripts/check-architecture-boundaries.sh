#!/usr/bin/env sh
set -eu

FAIL=0

check() {
  PATTERN=$1
  GLOB=$2
  MESSAGE=$3

  MATCHES=$(rg -n "$PATTERN" $GLOB || true)
  if [ -n "$MATCHES" ]; then
    echo "$MESSAGE"
    echo "$MATCHES"
    echo ""
    FAIL=1
  fi
}

# Shared layer must stay feature-agnostic.
check "from ['\"]@/features/" "src/shared" "Architecture violation: src/shared must not import from src/features"

# Service layer must not depend on feature modules.
check "from ['\"]@/features/" "src/services" "Architecture violation: src/services must not import from src/features"

if [ "$FAIL" -ne 0 ]; then
  exit 1
fi

echo "Architecture boundary checks passed."

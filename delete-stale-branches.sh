#!/usr/bin/env bash
# Deletes all 50 stale branches from github.com/guitarbeat/Naming-Nosferatu
# Usage: GITHUB_TOKEN=ghp_xxxx bash delete-stale-branches.sh

REPO="guitarbeat/Naming-Nosferatu"
TOKEN="${GITHUB_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "ERROR: Set GITHUB_TOKEN before running."
  exit 1
fi

BRANCHES=(
  "add-branch-cleanup-workflow-10126757740085571993"
  "chore-clean-tournament-flow-log-12333027123476774260"
  "chore-remove-console-log-in-api-7736861350955001250"
  "chore-remove-localstorage-cleanup-log-16663482090189455389"
  "chore/remove-console-log-admin-dashboard-6152544244944635572"
  "chore/remove-console-log-from-local-storage-cleanup-15968532533862104506"
  "chore/remove-console-log-tournament-flow-2198437042585468138"
  "chore/remove-db-logs-15764577642194940948"
  "chore/remove-informational-console-log-from-db-15288865847100656109"
  "chore/remove-tournament-flow-console-log-16681889665441402605"
  "chore/remove-tournament-flow-console-log-2740419085646054927"
  "chore/remove-websocket-console-logs-18440594534496537509"
  "code-health/remove-websocket-console-log-13218719697686979099"
  "code-health/remove-websocket-console-log-9656085575286349109"
  "dependabot/github_actions/pnpm/action-setup-5"
  "feat/optimize-cache-key-8511419773622921582"
  "fix/high-priority-improvements-and-form-progress-10006104711167260657"
  "fix/storage-getstoragestring-tests-13058024772765910844"
  "jules-10420539041236628401-8cfa54ab"
  "jules-15210135966981287722-2f51e1eb"
  "jules-15519052711043885643-36b23b0c"
  "jules-17948410498211539017-52cbb579"
  "jules-6173086170140002468-b33dc3f7"
  "jules-6316572519634771067-ba70c7e3"
  "jules-6871729012948020276-19ffca5b"
  "jules-9045302671092699503-ed74d597"
  "jules-99168620723252370-d89ce97b"
  "jules-chore/remove-console-log-api-15648046872855075175"
  "jules-remove-websocket-console-log-2524921757139415097"
  "jules-test-buildInitialRatings-16017845232646379231"
  "perf-admin-bulk-action-13305445082760581445"
  "perf-bulk-actions-5343953381232276915"
  "perf/bulk-action-concurrency-866157374659891902"
  "perf/concurrent-bulk-actions-5895144830095126123"
  "perf/optimize-duplicate-nameid-check-6387195073841974885"
  "perf/optimize-get-cache-key-10699437191157264730"
  "perf/use-admin-action-confirmation-map-lookup-5745407909859617557"
  "test-create-tournament-id-15756689489672601033"
  "test-match-helpers-get-match-side-id-11762669178114130194"
  "test-matchHelpers-coverage-10301797606283654315"
  "test-use-admin-action-confirmation-14354351662233920369"
  "test/add-isrpcsignatureerror-tests-15845530311506257096"
  "test/add-isrpcsignatureerror-tests-17414352454119448045"
  "test/add-matchhelpers-test-9957827191031691956"
  "test/add-matchhelpers-tests-4385940442568565118"
  "test/heat-utils-getflamecount-2269997248299969363"
  "test/match-helpers-coverage-14418282300483768445"
  "test/match-helpers-getmatchsidename-4133593020267148817"
  "test/storage-utilities-10561723117080726205"
  "test/use-personal-results-7339775898638181024"
)

for branch in "${BRANCHES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X DELETE \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$REPO/git/refs/heads/${branch}")
  if [ "$STATUS" = "204" ]; then
    echo "✓ Deleted: $branch"
  else
    echo "✗ Failed ($STATUS): $branch"
  fi
done
echo "Done."

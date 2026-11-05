#!/usr/bin/env bash
# Creates labels and one GitHub issue per backlog item (docs/backlog.json).
# Prerequisites: GitHub CLI installed and logged in (gh auth login); run from the repo root.
# Usage: bash scripts/create_issues.sh [OWNER/REPO]
set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
echo "Creating labels and issues in $REPO ..."

gh label create "priority: high"   --color D73A4A --force -R "$REPO"
gh label create "priority: medium" --color FBCA04 --force -R "$REPO"
gh label create "priority: low"    --color 0E8A16 --force -R "$REPO"
gh label create "application"      --color 1D76DB --force -R "$REPO"
gh label create "devops"           --color 5319E7 --force -R "$REPO"

python - "$REPO" <<'PY'
import json, subprocess, sys
repo = sys.argv[1]
items = json.load(open("docs/backlog.json"))
for rank, b in enumerate(items, start=1):
    body = (
        f"**Backlog rank:** {rank}  \n**Priority:** {b['priority']}  \n**Type:** {b['type']}  \n"
        f"**Planned branch:** `{b['branch']}`\n\n"
        f"### User story\n{b['story']}\n\n### Acceptance criteria\n{b['criteria']}\n"
    )
    labels = f"priority: {b['priority'].lower()},{'application' if b['type']=='Application' else 'devops'}"
    out = subprocess.run(
        ["gh", "issue", "create", "-R", repo, "--title", f"[{b['id']}] {b['title']}",
         "--body", body, "--label", labels],
        check=True, capture_output=True, text=True).stdout.strip()
    print(rank, b["id"], out)
PY

echo "Done. Next: add the issues to your GitHub Project (Project -> Add item -> pick the issues, or"
echo "  use 'Add items' and select all open issues)."

#!/bin/bash
echo "Analyzing branches..."
for branch in $(git branch -r | grep -v 'HEAD\|main' | sed 's/origin\///'); do
  base=$(git merge-base origin/main origin/$branch)
  # Get list of modified files in the branch
  files=$(git diff --name-only $base..origin/$branch)
  for file in $files; do
    if [ -f "$file" ]; then
      echo "Branch $branch modifies existing file: $file"
    fi
  done
done

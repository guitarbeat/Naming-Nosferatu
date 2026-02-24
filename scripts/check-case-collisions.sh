#!/usr/bin/env sh
set -eu

# Detect paths that differ only by case (problematic on case-insensitive filesystems).
case_groups=$(
	git ls-files | awk '
	{
		key = tolower($0)
		paths[key] = paths[key] ? paths[key] "\n" $0 : $0
		count[key]++
	}
	END {
		has = 0
		for (key in count) {
			if (count[key] > 1) {
				has = 1
				printf "Case-collision group:\n%s\n\n", paths[key]
			}
		}
		if (has == 0) {
			exit 1
		}
	}
'
) || true

if [ -n "$case_groups" ]; then
	echo "$case_groups"
	echo "Error: Resolve case-collision paths before committing."
	exit 1
fi

echo "No case-collision paths found."

with open("pnpm-lock.yaml", "r") as f:
    lines = f.readlines()

in_snapshots = False
seen_keys = {}
duplicates = []

for i, line in enumerate(lines):
    stripped = line.strip()
    if line.startswith("snapshots:"):
        in_snapshots = True
        continue
    if not in_snapshots:
        continue

    # Check for keys at indentation level 2 (snapshots keys)
    # pnpm uses 2 spaces indentation usually
    if line.startswith("  ") and not line.startswith("    ") and stripped.endswith(":"):
        key = stripped
        if key in seen_keys:
            duplicates.append((key, seen_keys[key], i + 1))
        seen_keys[key] = i + 1

if duplicates:
    print(f"Found {len(duplicates)} duplicate keys in snapshots:")
    for key, line1, line2 in duplicates:
        print(f"  {key} at lines {line1} and {line2}")
else:
    print("No duplicate keys found in snapshots.")

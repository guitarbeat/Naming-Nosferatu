with open("pnpm-lock.yaml", "r") as f:
    lines = f.readlines()

seen_keys = {}
duplicates = []

for i, line in enumerate(lines):
    stripped = line.strip()
    # Check for YAML keys (simplified)
    if stripped.endswith(":") and not stripped.startswith("-"):
        key = stripped
        if key in seen_keys:
            duplicates.append((key, seen_keys[key], i + 1))
        seen_keys[key] = i + 1

if duplicates:
    print(f"Found {len(duplicates)} duplicate keys:")
    for key, line1, line2 in duplicates:
        print(f"  {key} at lines {line1} and {line2}")
else:
    print("No duplicate keys found.")

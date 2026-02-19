import yaml

try:
    with open("pnpm-lock.yaml", "r") as f:
        yaml.safe_load(f)
    print("YAML is valid.")
except yaml.YAMLError as exc:
    print(f"YAML error: {exc}")
except Exception as e:
    print(f"Error: {e}")

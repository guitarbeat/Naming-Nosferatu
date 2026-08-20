import json

with open('package.json', 'r') as f:
    data = json.load(f)

data['packageManager'] = "pnpm@10.27.0"
data['engines']['pnpm'] = "10.27.0"

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')

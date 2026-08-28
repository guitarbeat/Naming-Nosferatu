# Ah, I left the duplicate components behind in the original file! I only prepended exports!
# Let me clear out everything in UIBlocks except the exports.

with open("src/shared/components/UIBlocks.tsx", "r") as f:
    text = f.read()

# I will keep only lines starting with export that I added.
lines = text.split("\n")
exports = []
for line in lines:
    if line.startswith("import {") and "./ui/" in line:
        exports.append(line)
    elif line.startswith("export {"):
        exports.append(line)

with open("src/shared/components/UIBlocks.tsx", "w") as f:
    f.write("\n".join(exports) + "\n")

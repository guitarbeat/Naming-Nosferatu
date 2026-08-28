import re

with open("src/shared/components/UIBlocks.tsx", "r") as f:
    content = f.read()

def extract_and_save(pattern, filename, imports_needed):
    global content
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print(f"Could not find {filename}")
        return False

    comp_code = match.group(0)
    with open(f"src/shared/components/ui/{filename}", "w") as f:
        f.write(imports_needed + "\n\n" + comp_code + "\n")

    content = re.sub(pattern, "", content, flags=re.DOTALL)
    return True

# We have duplicates in UIBlocks! MagicToggle, ProfileInner, etc... they might be duplicated because of how the regex failed and left them. Let's just create a fresh UIBlocks.tsx with just the exports!
# Wait, I have to be careful with the imports at the top of UIBlocks.tsx, let's keep them clean.

import os
import re

ui_blocks_path = "src/shared/components/UIBlocks.tsx"
with open(ui_blocks_path, "r") as f:
    content = f.read()

# Make the directory
os.makedirs("src/shared/components/ui", exist_ok=True)

# Function to extract a component and write to file
def extract_and_save(pattern, filename, imports_needed):
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print(f"Could not find {filename}")
        return False

    comp_code = match.group(0)
    with open(f"src/shared/components/ui/{filename}", "w") as f:
        f.write(imports_needed + "\n\n" + comp_code + "\n")
    return True

# MagicToggle
magic_toggle_pattern = r"(export interface MagicToggleOption.*?export function MagicToggle.*?\}\n)"
magic_toggle_imports = """import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { hapticNavTap } from "@/shared/lib/utils";"""
extract_and_save(magic_toggle_pattern, "MagicToggle.tsx", magic_toggle_imports)

# We need to remove the extracted code from UIBlocks.tsx
content = re.sub(magic_toggle_pattern, "", content, flags=re.DOTALL)

# Add exports to UIBlocks.tsx
content = 'import { MagicToggle, type MagicToggleOption, type MagicToggleProps } from "./ui/MagicToggle";\nexport { MagicToggle, type MagicToggleOption, type MagicToggleProps };\n' + content

with open(ui_blocks_path, "w") as f:
    f.write(content)
print("Extracted MagicToggle")

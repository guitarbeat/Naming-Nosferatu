import os
import re

ui_blocks_path = "src/shared/components/UIBlocks.tsx"
with open(ui_blocks_path, "r") as f:
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

# SearchFilterBar
search_filter_pattern = r"(interface SearchFilterBarProps \{.*?export function SearchFilterBar\(\{.*?\}\) \{.*?\n\}\n)"
search_filter_imports = """import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import { Button } from "@/shared/components/LayoutBlocks";
import { hapticNavTap } from "@/shared/lib/utils";"""
if extract_and_save(search_filter_pattern, "SearchFilterBar.tsx", search_filter_imports):
    content = 'import { SearchFilterBar } from "./ui/SearchFilterBar";\nexport { SearchFilterBar };\n' + content


with open(ui_blocks_path, "w") as f:
    f.write(content)
print("Extracted SearchFilterBar")

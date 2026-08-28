import re

with open("src/shared/components/UIBlocks.tsx", "r") as f:
    content = f.read()

# I see MagicToggle didn't extract properly due to the closing brace being left behind, or I left duplicates.
# Let's just fix it manually. I will read the whole file, clean it up, and write it back.

# Let's extract SearchFilterBar and SectionHeading, and RouteFallback.
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

search_filter_pattern = r"(interface SearchFilterBarProps \{.*?export function SearchFilterBar\(\{.*?\}\) \{.*?\n\}\n)"
search_filter_imports = """import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import { Button } from "@/shared/components/LayoutBlocks";
import { hapticNavTap } from "@/shared/lib/utils";"""
if extract_and_save(search_filter_pattern, "SearchFilterBar.tsx", search_filter_imports):
    content = 'import { SearchFilterBar } from "./ui/SearchFilterBar";\nexport { SearchFilterBar };\n' + content


route_fallback_pattern = r"(export function RouteFallback\(\{ text \}: \{ text: string \}\) \{.*?\n\}\n)"
route_fallback_imports = """import { Loading } from "@/shared/components/LayoutBlocks";"""
if extract_and_save(route_fallback_pattern, "RouteFallback.tsx", route_fallback_imports):
    content = 'import { RouteFallback } from "./ui/RouteFallback";\nexport { RouteFallback };\n' + content


section_heading_pattern = r"(export const SectionHeading = memo\(function SectionHeading\(\{.*?\n\}\);\n)"
section_heading_imports = """import { memo } from "react";"""
if extract_and_save(section_heading_pattern, "SectionHeading.tsx", section_heading_imports):
    content = 'import { SectionHeading } from "./ui/SectionHeading";\nexport { SectionHeading };\n' + content


with open("src/shared/components/UIBlocks.tsx", "w") as f:
    f.write(content)
print("Finished fixing UIBlocks")

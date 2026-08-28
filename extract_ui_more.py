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

# FloatingNav
floating_nav_pattern = r"(export type NavItem =.*?export const FloatingNav = memo\(function FloatingNav\(\{ items \}: \{ items: NavItem\[\] \}\) \{.*?\n\}\);)"
floating_nav_imports = """import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { memo } from "react";
import { cn, hapticNavTap } from "@/shared/lib/utils";"""
if extract_and_save(floating_nav_pattern, "FloatingNav.tsx", floating_nav_imports):
    content = 'import { FloatingNav, type NavItem } from "./ui/FloatingNav";\nexport { FloatingNav, type NavItem };\n' + content


# MagicProfileWidget
magic_profile_pattern = r"(export interface MagicProfileWidgetProps.*?export function MagicProfileWidget.*?\}\n)"
magic_profile_imports = """import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Pencil, User } from "lucide-react";
import type { RefObject } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";"""
if extract_and_save(magic_profile_pattern, "MagicProfileWidget.tsx", magic_profile_imports):
    content = 'import { MagicProfileWidget, type MagicProfileWidgetProps } from "./ui/MagicProfileWidget";\nexport { MagicProfileWidget, type MagicProfileWidgetProps };\n' + content

# ProfileInner
profile_inner_pattern = r"(interface ProfileInnerProps \{.*?export function ProfileInner\(\{ onLogin, onLogout \}: ProfileInnerProps\) \{.*?\n\}\n)"
profile_inner_imports = """import { motion } from "framer-motion";
import { Award, Check, Crown, Flame, LogOut, Pencil, Shield, Trophy, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";
import { ErrorManager } from "@/shared/services/errorManager";
import useAppStore from "@/store/appStore";"""
if extract_and_save(profile_inner_pattern, "ProfileInner.tsx", profile_inner_imports):
    content = 'import { ProfileInner } from "./ui/ProfileInner";\nexport { ProfileInner };\n' + content

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
print("Extracted FloatingNav, MagicProfileWidget, ProfileInner, SearchFilterBar")

import os
import re

with open("src/shared/components/UIBlocks.tsx", "r") as f:
    text = f.read()

# Rather than regex, just split the file by known substrings that don't change.

parts = {
    "FloatingNav": {
        "start": "export type NavItem = {",
        "end": "export const FloatingNav = memo(function FloatingNav({ items }: { items: NavItem[] }) {",
        "end_after": "});", # Actually ends with `});`
        "imports": """import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { memo } from "react";
import { cn, hapticNavTap } from "@/shared/lib/utils";"""
    },
    "MagicProfileWidget": {
        "start": "export interface MagicProfileWidgetProps {",
        "end": "export function MagicProfileWidget({",
        "imports": """import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Pencil, User } from "lucide-react";
import type { RefObject } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";"""
    },
    "MagicToggle": {
        "start": "export interface MagicToggleOption<T extends string> {",
        "end": "export function MagicToggle<T extends string>({",
        "imports": """import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { hapticNavTap } from "@/shared/lib/utils";"""
    },
    "ProfileInner": {
        "start": "interface ProfileInnerProps {",
        "end": "export function ProfileInner({ onLogin, onLogout }: ProfileInnerProps) {",
        "imports": """import { motion } from "framer-motion";
import { Award, Check, Crown, Flame, LogOut, Pencil, Shield, Trophy, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";
import { ErrorManager } from "@/shared/services/errorManager";
import useAppStore from "@/store/appStore";"""
    },
    "RouteFallback": {
        "start": "export function RouteFallback({ text }: { text: string }) {",
        "imports": """import { Loading } from "@/shared/components/LayoutBlocks";"""
    },
    "SearchFilterBar": {
        "start": "interface SearchFilterBarProps {",
        "end": "export function SearchFilterBar({",
        "imports": """import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import { Button } from "@/shared/components/LayoutBlocks";
import { hapticNavTap } from "@/shared/lib/utils";"""
    },
    "SectionHeading": {
        "start": "export const SectionHeading = memo(function SectionHeading({",
        "end_after": "});",
        "imports": """import { memo } from "react";"""
    }
}

def extract_block(text, start_str):
    idx = text.find(start_str)
    if idx == -1:
        return None, None, None

    brace_start = text.find("{", idx)
    if brace_start == -1:
        return None, None, None

    brace_count = 0
    in_block = False

    for i in range(brace_start, len(text)):
        if text[i] == '{':
            brace_count += 1
            in_block = True
        elif text[i] == '}':
            brace_count -= 1

        if in_block and brace_count == 0:
            end_idx = i + 1
            if end_idx < len(text) and text[end_idx] == ')':
                end_idx += 1
            if end_idx < len(text) and text[end_idx] == ';':
                end_idx += 1
            return text[idx:end_idx], idx, end_idx

    return None, None, None

exports = []

for name, info in parts.items():
    code = ""
    # Interface / Type
    if "end" in info:
        # Extract interface first
        type_code, t_start, t_end = extract_block(text, info["start"])
        # Extract component
        comp_code, c_start, c_end = extract_block(text, info["end"])
        if type_code and comp_code:
            code = type_code + "\n\n" + comp_code
            text = text[:t_start] + text[t_end:c_start] + text[c_end:]
        else:
            print(f"Failed to extract {name}")
            continue
    else:
        # Only one block
        comp_code, c_start, c_end = extract_block(text, info["start"])
        if comp_code:
            code = comp_code
            text = text[:c_start] + text[c_end:]
        else:
            print(f"Failed to extract {name}")
            continue

    with open(f"src/shared/components/ui/{name}.tsx", "w") as f:
        f.write(info["imports"] + "\n\n" + code + "\n")

    if name == "FloatingNav":
        exports.append('import { FloatingNav, type NavItem } from "./ui/FloatingNav";\nexport { FloatingNav, type NavItem };')
    elif name == "MagicProfileWidget":
        exports.append('import { MagicProfileWidget, type MagicProfileWidgetProps } from "./ui/MagicProfileWidget";\nexport { MagicProfileWidget, type MagicProfileWidgetProps };')
    elif name == "MagicToggle":
        exports.append('import { MagicToggle, type MagicToggleOption, type MagicToggleProps } from "./ui/MagicToggle";\nexport { MagicToggle, type MagicToggleOption, type MagicToggleProps };')
    elif name == "SearchFilterBar":
        exports.append('import { SearchFilterBar } from "./ui/SearchFilterBar";\nexport { SearchFilterBar };')
    else:
        exports.append(f'import {{ {name} }} from "./ui/{name}";\nexport {{ {name} }};')

# Some components like SearchInput and FilterSelect are private to SearchFilterBar
# We need to extract them manually if they were left behind.
search_input_code, s_start, s_end = extract_block(text, "function SearchInput({")
if search_input_code:
    text = text[:s_start] + text[s_end:]
    with open("src/shared/components/ui/SearchFilterBar.tsx", "a") as f:
        f.write("\n" + search_input_code + "\n")

filter_select_code, f_start, f_end = extract_block(text, "function FilterSelect({")
if filter_select_code:
    text = text[:f_start] + text[f_end:]
    with open("src/shared/components/ui/SearchFilterBar.tsx", "a") as f:
        f.write("\n" + filter_select_code + "\n")


with open("src/shared/components/UIBlocks.tsx", "w") as f:
    f.write("\n".join(exports) + "\n\n" + text)

print("Extraction complete")

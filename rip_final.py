import re
import os

with open("src/shared/components/UIBlocks.tsx", "r") as f:
    code = f.read()

def get_block(start_kw, end_kw):
    start_idx = code.find(start_kw)
    if start_idx == -1: return None, None, None
    end_idx = code.find(end_kw, start_idx)
    if end_idx == -1: return None, None, None
    end_idx += len(end_kw)
    return code[start_idx:end_idx], start_idx, end_idx

# We'll just extract these blocks manually by exact string match of the end pattern.

nav_item_start = "export type NavItem = {"
nav_item_end = "};\n\n"

floating_nav_start = "export const FloatingNav = memo(function FloatingNav({ items }: { items: NavItem[] }) {"
floating_nav_end = "\t);\n});\n\n"

magic_profile_start = "export interface MagicProfileWidgetProps {"
magic_profile_end = "\t);\n}\n\n"

magic_toggle_start = "export interface MagicToggleOption<T extends string> {"
magic_toggle_end = "\t);\n}\n\n"

profile_inner_start = "interface ProfileInnerProps {"
profile_inner_end = "\t);\n}\n\n"

route_fallback_start = "export function RouteFallback({ text }: { text: string }) {"
route_fallback_end = "}\n\n"

search_filter_start = "interface SearchFilterBarProps {"
search_filter_end = "\t);\n}\n\n"

section_heading_start = "export const SectionHeading = memo(function SectionHeading({"
section_heading_end = "\t);\n});\n"


os.makedirs("src/shared/components/ui", exist_ok=True)

exports = []

# FloatingNav
nav_item_block, n1, n2 = get_block(nav_item_start, nav_item_end)
floating_nav_block, f1, f2 = get_block(floating_nav_start, floating_nav_end)

if nav_item_block and floating_nav_block:
    with open("src/shared/components/ui/FloatingNav.tsx", "w") as f:
        f.write("""import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { memo } from "react";
import { cn, hapticNavTap } from "@/shared/lib/utils";\n\n""")
        f.write(nav_item_block + floating_nav_block)
    code = code[:n1] + code[n2:f1] + code[f2:]
    exports.append('import { FloatingNav, type NavItem } from "./ui/FloatingNav";\nexport { FloatingNav, type NavItem };')


# MagicProfileWidget
mp_block, mp1, mp2 = get_block(magic_profile_start, magic_profile_end)
if mp_block:
    with open("src/shared/components/ui/MagicProfileWidget.tsx", "w") as f:
        f.write("""import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Pencil, User } from "lucide-react";
import type { RefObject } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";\n\n""")
        f.write(mp_block)
    code = code[:mp1] + code[mp2:]
    exports.append('import { MagicProfileWidget, type MagicProfileWidgetProps } from "./ui/MagicProfileWidget";\nexport { MagicProfileWidget, type MagicProfileWidgetProps };')


# MagicToggle
mt_block, mt1, mt2 = get_block(magic_toggle_start, magic_toggle_end)
if mt_block:
    with open("src/shared/components/ui/MagicToggle.tsx", "w") as f:
        f.write("""import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { hapticNavTap } from "@/shared/lib/utils";\n\n""")
        f.write(mt_block)
    code = code[:mt1] + code[mt2:]
    exports.append('import { MagicToggle, type MagicToggleOption, type MagicToggleProps } from "./ui/MagicToggle";\nexport { MagicToggle, type MagicToggleOption, type MagicToggleProps };')


# ProfileInner
pi_block, pi1, pi2 = get_block(profile_inner_start, profile_inner_end)
if pi_block:
    with open("src/shared/components/ui/ProfileInner.tsx", "w") as f:
        f.write("""import { motion } from "framer-motion";
import { Award, Check, Crown, Flame, LogOut, Pencil, Shield, Trophy, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";
import { ErrorManager } from "@/shared/services/errorManager";
import useAppStore from "@/store/appStore";\n\n""")
        f.write(pi_block)
    code = code[:pi1] + code[pi2:]
    exports.append('import { ProfileInner } from "./ui/ProfileInner";\nexport { ProfileInner };')


# RouteFallback
rf_block, rf1, rf2 = get_block(route_fallback_start, route_fallback_end)
if rf_block:
    with open("src/shared/components/ui/RouteFallback.tsx", "w") as f:
        f.write("""import { Loading } from "@/shared/components/LayoutBlocks";\n\n""")
        f.write(rf_block)
    code = code[:rf1] + code[rf2:]
    exports.append('import { RouteFallback } from "./ui/RouteFallback";\nexport { RouteFallback };')


# SearchFilterBar
sf_block, sf1, sf2 = get_block(search_filter_start, search_filter_end)
if sf_block:
    with open("src/shared/components/ui/SearchFilterBar.tsx", "w") as f:
        f.write("""import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import { Button } from "@/shared/components/LayoutBlocks";
import { hapticNavTap } from "@/shared/lib/utils";\n\n""")
        f.write(sf_block)
    code = code[:sf1] + code[sf2:]
    exports.append('import { SearchFilterBar } from "./ui/SearchFilterBar";\nexport { SearchFilterBar };')


# SectionHeading
sh_block, sh1, sh2 = get_block(section_heading_start, section_heading_end)
if sh_block:
    with open("src/shared/components/ui/SectionHeading.tsx", "w") as f:
        f.write("""import { memo } from "react";\n\n""")
        f.write(sh_block)
    code = code[:sh1] + code[sh2:]
    exports.append('import { SectionHeading } from "./ui/SectionHeading";\nexport { SectionHeading };')


with open("src/shared/components/UIBlocks.tsx", "w") as f:
    f.write("\n".join(exports) + "\n\n" + code)

print("Done!")

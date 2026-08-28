import os

with open("src/shared/components/UIBlocks.tsx", "r") as f:
    text = f.read()

def extract_block(text, search_str):
    start = text.find(search_str)
    if start == -1: return None, None, None

    # We find where the first block starts
    # Note: interfaces might not have curly braces immediately, but let's assume they do.
    brace_start = text.find('{', start)
    brace_count = 1
    in_block = True

    for i in range(brace_start + 1, len(text)):
        if text[i] == '{':
            brace_count += 1
        elif text[i] == '}':
            brace_count -= 1

        if brace_count == 0:
            end = i + 1
            if end < len(text) and text[end] == ')': end += 1
            if end < len(text) and text[end] == ';': end += 1
            return text[start:end], start, end
    return None, None, None

exports = []

# NavItem & FloatingNav
nav_item_code, n_start, n_end = extract_block(text, "export type NavItem = {")
text = text[:n_start] + text[n_end:]
floating_nav_code, f_start, f_end = extract_block(text, "export const FloatingNav = memo(function FloatingNav(")
text = text[:f_start] + text[f_end:]

with open("src/shared/components/ui/FloatingNav.tsx", "w") as f:
    f.write("""import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { memo } from "react";
import { cn, hapticNavTap } from "@/shared/lib/utils";\n\n""")
    f.write(nav_item_code + "\n\n" + floating_nav_code + "\n")
exports.append('import { FloatingNav, type NavItem } from "./ui/FloatingNav";\nexport { FloatingNav, type NavItem };')


# MagicProfileWidget
magic_prof_props, mp_start, mp_end = extract_block(text, "export interface MagicProfileWidgetProps {")
text = text[:mp_start] + text[mp_end:]
magic_prof_code, mc_start, mc_end = extract_block(text, "export function MagicProfileWidget({")
text = text[:mc_start] + text[mc_end:]

with open("src/shared/components/ui/MagicProfileWidget.tsx", "w") as f:
    f.write("""import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Pencil, User } from "lucide-react";
import type { RefObject } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";\n\n""")
    f.write(magic_prof_props + "\n\n" + magic_prof_code + "\n")
exports.append('import { MagicProfileWidget, type MagicProfileWidgetProps } from "./ui/MagicProfileWidget";\nexport { MagicProfileWidget, type MagicProfileWidgetProps };')


# MagicToggle
magic_tog_opt, mo_start, mo_end = extract_block(text, "export interface MagicToggleOption<T extends string> {")
text = text[:mo_start] + text[mo_end:]
magic_tog_props, mtp_start, mtp_end = extract_block(text, "export interface MagicToggleProps<T extends string> {")
text = text[:mtp_start] + text[mtp_end:]
magic_tog_code, mt_start, mt_end = extract_block(text, "export function MagicToggle<T extends string>({")
text = text[:mt_start] + text[mt_end:]

with open("src/shared/components/ui/MagicToggle.tsx", "w") as f:
    f.write("""import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { hapticNavTap } from "@/shared/lib/utils";\n\n""")
    f.write(magic_tog_opt + "\n\n" + magic_tog_props + "\n\n" + magic_tog_code + "\n")
exports.append('import { MagicToggle, type MagicToggleOption, type MagicToggleProps } from "./ui/MagicToggle";\nexport { MagicToggle, type MagicToggleOption, type MagicToggleProps };')


# ProfileInner
prof_inner_props, pp_start, pp_end = extract_block(text, "interface ProfileInnerProps {")
text = text[:pp_start] + text[pp_end:]
prof_inner_code, pc_start, pc_end = extract_block(text, "export function ProfileInner({ onLogin, onLogout }: ProfileInnerProps) {")
text = text[:pc_start] + text[pc_end:]

with open("src/shared/components/ui/ProfileInner.tsx", "w") as f:
    f.write("""import { motion } from "framer-motion";
import { Award, Check, Crown, Flame, LogOut, Pencil, Shield, Trophy, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";
import { ErrorManager } from "@/shared/services/errorManager";
import useAppStore from "@/store/appStore";\n\n""")
    f.write(prof_inner_props + "\n\n" + prof_inner_code + "\n")
exports.append('import { ProfileInner } from "./ui/ProfileInner";\nexport { ProfileInner };')


# RouteFallback
route_fall_code, r_start, r_end = extract_block(text, "export function RouteFallback({ text }: { text: string }) {")
text = text[:r_start] + text[r_end:]

with open("src/shared/components/ui/RouteFallback.tsx", "w") as f:
    f.write("""import { Loading } from "@/shared/components/LayoutBlocks";\n\n""")
    f.write(route_fall_code + "\n")
exports.append('import { RouteFallback } from "./ui/RouteFallback";\nexport { RouteFallback };')


# SearchFilterBar
search_props, sp_start, sp_end = extract_block(text, "interface SearchFilterBarProps {")
text = text[:sp_start] + text[sp_end:]
search_in_code, si_start, si_end = extract_block(text, "function SearchInput({")
text = text[:si_start] + text[si_end:]
filter_sel_code, fs_start, fs_end = extract_block(text, "function FilterSelect({")
text = text[:fs_start] + text[fs_end:]
search_bar_code, sb_start, sb_end = extract_block(text, "export function SearchFilterBar({")
text = text[:sb_start] + text[sb_end:]

with open("src/shared/components/ui/SearchFilterBar.tsx", "w") as f:
    f.write("""import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import { Button } from "@/shared/components/LayoutBlocks";
import { hapticNavTap } from "@/shared/lib/utils";\n\n""")
    f.write(search_props + "\n\n" + search_in_code + "\n\n" + filter_sel_code + "\n\n" + search_bar_code + "\n")
exports.append('import { SearchFilterBar } from "./ui/SearchFilterBar";\nexport { SearchFilterBar };')


# SectionHeading
sec_head_code, sh_start, sh_end = extract_block(text, "export const SectionHeading = memo(function SectionHeading({")
text = text[:sh_start] + text[sh_end:]

with open("src/shared/components/ui/SectionHeading.tsx", "w") as f:
    f.write("""import { memo } from "react";\n\n""")
    f.write(sec_head_code + "\n")
exports.append('import { SectionHeading } from "./ui/SectionHeading";\nexport { SectionHeading };')


with open("src/shared/components/UIBlocks.tsx", "w") as f:
    f.write("\n".join(exports) + "\n\n" + text)

print("Success")

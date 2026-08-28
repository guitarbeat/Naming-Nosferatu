# My extraction was bad because I replaced curly braces logic with simple string search and forgot to take the parameters.
# The extraction actually was cut off, let me redo the extraction script!
import os
import re

os.system("git checkout src/shared/components/UIBlocks.tsx")

with open("src/shared/components/UIBlocks.tsx", "r") as f:
    text = f.read()

parts = {
    "FloatingNav": {
        "pattern": r"(export type NavItem =.*?export const FloatingNav = memo\(function FloatingNav\(\{ items \}: \{ items: NavItem\[\] \}\) \{.*?\n\}\);)",
        "imports": """import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { memo } from "react";
import { cn, hapticNavTap } from "@/shared/lib/utils";"""
    },
    "MagicProfileWidget": {
        "pattern": r"(export interface MagicProfileWidgetProps \{.*?export function MagicProfileWidget\(.*?\n\}\n)",
        "imports": """import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Pencil, User } from "lucide-react";
import type { RefObject } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";"""
    },
    "MagicToggle": {
        "pattern": r"(export interface MagicToggleOption.*?export function MagicToggle<T extends string>\(.*?\n\}\n)",
        "imports": """import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { hapticNavTap } from "@/shared/lib/utils";"""
    },
    "ProfileInner": {
        "pattern": r"(interface ProfileInnerProps \{.*?export function ProfileInner\(\{ onLogin, onLogout \}: ProfileInnerProps\) \{.*?\n\}\n)",
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
        "pattern": r"(export function RouteFallback\(\{ text \}: \{ text: string \}\) \{.*?\n\}\n)",
        "imports": """import { Loading } from "@/shared/components/LayoutBlocks";"""
    },
    "SearchFilterBar": {
        "pattern": r"(interface SearchFilterBarProps \{.*?export function SearchFilterBar\(\{.*?\}\) \{.*?\n\}\n)",
        "imports": """import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import { Button } from "@/shared/components/LayoutBlocks";
import { hapticNavTap } from "@/shared/lib/utils";"""
    },
    "SectionHeading": {
        "pattern": r"(export const SectionHeading = memo\(function SectionHeading\(\{.*?\n\}\);\n)",
        "imports": """import { memo } from "react";"""
    }
}

# The previous script broke MagicToggle and ProfileInner... Wait, let's just write a custom script using index positions.

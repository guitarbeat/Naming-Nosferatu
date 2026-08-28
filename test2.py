import os

with open("src/shared/components/UIBlocks.tsx", "r") as f:
    text = f.read()

def get_block(start_keyword, end_keyword, text):
    start = text.find(start_keyword)
    if start == -1: return None, None, None
    end = text.find(end_keyword, start)
    if end == -1: return None, None, None
    end += len(end_keyword)
    return text[start:end], start, end

parts = [
    {
        "name": "FloatingNav",
        "start": "export type NavItem = {",
        "end": "});\n",
        "imports": """import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { memo } from "react";
import { cn, hapticNavTap } from "@/shared/lib/utils";""",
        "export": 'import { FloatingNav, type NavItem } from "./ui/FloatingNav";\nexport { FloatingNav, type NavItem };'
    },
    {
        "name": "MagicProfileWidget",
        "start": "export interface MagicProfileWidgetProps {",
        "end": "\t);\n}\n",
        "imports": """import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Pencil, User } from "lucide-react";
import type { RefObject } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";""",
        "export": 'import { MagicProfileWidget, type MagicProfileWidgetProps } from "./ui/MagicProfileWidget";\nexport { MagicProfileWidget, type MagicProfileWidgetProps };'
    },
    {
        "name": "MagicToggle",
        "start": "export interface MagicToggleOption<T extends string> {",
        "end": "\t);\n}\n",
        "imports": """import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { hapticNavTap } from "@/shared/lib/utils";""",
        "export": 'import { MagicToggle, type MagicToggleOption, type MagicToggleProps } from "./ui/MagicToggle";\nexport { MagicToggle, type MagicToggleOption, type MagicToggleProps };'
    },
    {
        "name": "ProfileInner",
        "start": "interface ProfileInnerProps {",
        "end": "\t);\n}\n",
        "imports": """import { motion } from "framer-motion";
import { Award, Check, Crown, Flame, LogOut, Pencil, Shield, Trophy, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";
import { ErrorManager } from "@/shared/services/errorManager";
import useAppStore from "@/store/appStore";""",
        "export": 'import { ProfileInner } from "./ui/ProfileInner";\nexport { ProfileInner };'
    },
    {
        "name": "RouteFallback",
        "start": "export function RouteFallback({ text }: { text: string }) {",
        "end": "}\n",
        "imports": """import { Loading } from "@/shared/components/LayoutBlocks";""",
        "export": 'import { RouteFallback } from "./ui/RouteFallback";\nexport { RouteFallback };'
    },
    {
        "name": "SearchFilterBar",
        "start": "interface SearchFilterBarProps {",
        "end": "\t);\n}\n",
        "imports": """import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import { Button } from "@/shared/components/LayoutBlocks";
import { hapticNavTap } from "@/shared/lib/utils";""",
        "export": 'import { SearchFilterBar } from "./ui/SearchFilterBar";\nexport { SearchFilterBar };'
    },
    {
        "name": "SectionHeading",
        "start": "export const SectionHeading = memo(function SectionHeading({",
        "end": "});\n",
        "imports": """import { memo } from "react";""",
        "export": 'import { SectionHeading } from "./ui/SectionHeading";\nexport { SectionHeading };'
    }
]

# We need to manually fix MagicProfileWidget end keyword, as `\t);\n}\n` is used for many functions.
# Let's write a python function to match curly braces correctly.

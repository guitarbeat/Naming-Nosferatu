import re

with open("src/shared/components/UIBlocks.tsx.bak", "r") as f:
    lines = f.readlines()

def write_comp(filename, imports, start_line, end_line):
    with open(f"src/shared/components/ui/{filename}", "w") as f:
        f.write(imports + "\n\n")
        for line in lines[start_line:end_line+1]:
            f.write(line)

# Let's find the line numbers for each section
# NavItem starts at line 14
# FloatingNav ends at line 102
write_comp(
    "FloatingNav.tsx",
    """import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { memo } from "react";
import { cn, hapticNavTap } from "@/shared/lib/utils";""",
    14, 102
)

# MagicProfileWidgetProps starts at line 104
# MagicProfileWidget ends at line 294
write_comp(
    "MagicProfileWidget.tsx",
    """import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Pencil, User } from "lucide-react";
import type { RefObject } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";""",
    104, 294
)

# MagicToggleOption starts at line 296
# MagicToggle ends at line 386
write_comp(
    "MagicToggle.tsx",
    """import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { hapticNavTap } from "@/shared/lib/utils";""",
    296, 386
)

# ProfileInnerProps starts at line 388
# ProfileInner ends at line 673
write_comp(
    "ProfileInner.tsx",
    """import { motion } from "framer-motion";
import { Award, Check, Crown, Flame, LogOut, Pencil, Shield, Trophy, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";
import { ErrorManager } from "@/shared/services/errorManager";
import useAppStore from "@/store/appStore";""",
    388, 673
)

# RouteFallback starts at line 675
# RouteFallback ends at line 678
write_comp(
    "RouteFallback.tsx",
    """import { Loading } from "@/shared/components/LayoutBlocks";""",
    675, 678
)

# SearchFilterBarProps starts at line 680
# SearchFilterBar ends at line 802
write_comp(
    "SearchFilterBar.tsx",
    """import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import { Button } from "@/shared/components/LayoutBlocks";
import { hapticNavTap } from "@/shared/lib/utils";""",
    680, 802
)

# SectionHeading starts at line 804
# SectionHeading ends at line 826
write_comp(
    "SectionHeading.tsx",
    """import { memo } from "react";""",
    804, 826
)

# Create a new UIBlocks.tsx that exports all of these
with open("src/shared/components/UIBlocks.tsx", "w") as f:
    f.write("""export { FloatingNav, type NavItem } from "./ui/FloatingNav";
export { MagicProfileWidget, type MagicProfileWidgetProps } from "./ui/MagicProfileWidget";
export { MagicToggle, type MagicToggleOption, type MagicToggleProps } from "./ui/MagicToggle";
export { ProfileInner } from "./ui/ProfileInner";
export { RouteFallback } from "./ui/RouteFallback";
export { SearchFilterBar } from "./ui/SearchFilterBar";
export { SectionHeading } from "./ui/SectionHeading";
""")

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

os.makedirs("src/shared/components/ui", exist_ok=True)
exports = []

# FloatingNav
nav_item_start = "export type NavItem = {"
nav_item_end = "};\n\n"
floating_nav_start = "export const FloatingNav = memo(function FloatingNav({ items }: { items: NavItem[] }) {"
floating_nav_end = "\t);\n});\n\n"

n1, n2 = code.find(nav_item_start), code.find(nav_item_end) + len(nav_item_end)
f1, f2 = code.find(floating_nav_start), code.find(floating_nav_end) + len(floating_nav_end)

with open("src/shared/components/ui/FloatingNav.tsx", "w") as f:
    f.write("""import { motion, useReducedMotion } from "framer-motion";\nimport type { ReactNode } from "react";\nimport { memo } from "react";\nimport { cn, hapticNavTap } from "@/shared/lib/utils";\n\n""")
    f.write(code[n1:n2] + code[f1:f2])
code = code[:n1] + code[n2:f1] + code[f2:]
exports.append('import { FloatingNav, type NavItem } from "./ui/FloatingNav";\nexport { FloatingNav, type NavItem };')


# MagicProfileWidget
mp_start = "export interface MagicProfileWidgetProps {"
mp_end = "\t);\n}\n\n"
m1, m2 = code.find(mp_start), code.find(mp_end) + len(mp_end)
with open("src/shared/components/ui/MagicProfileWidget.tsx", "w") as f:
    f.write("""import { AnimatePresence, motion, useReducedMotion } from "framer-motion";\nimport { LogOut, Pencil, User } from "lucide-react";\nimport type { RefObject } from "react";\nimport { Button, Input } from "@/shared/components/LayoutBlocks";\n\n""")
    f.write(code[m1:m2])
code = code[:m1] + code[m2:]
exports.append('import { MagicProfileWidget, type MagicProfileWidgetProps } from "./ui/MagicProfileWidget";\nexport { MagicProfileWidget, type MagicProfileWidgetProps };')


# MagicToggle
mt_start = "export interface MagicToggleOption<T extends string> {"
mt_end = "\t);\n}\n\n"
m1, m2 = code.find(mt_start), code.find(mt_end, code.find(mt_start)) + len(mt_end)
with open("src/shared/components/ui/MagicToggle.tsx", "w") as f:
    f.write("""import { motion } from "framer-motion";\nimport type { ReactNode } from "react";\nimport { hapticNavTap } from "@/shared/lib/utils";\n\n""")
    f.write(code[m1:m2])
code = code[:m1] + code[m2:]
exports.append('import { MagicToggle, type MagicToggleOption, type MagicToggleProps } from "./ui/MagicToggle";\nexport { MagicToggle, type MagicToggleOption, type MagicToggleProps };')


# ProfileInner
pi_start = "interface ProfileInnerProps {"
pi_end = "\t);\n}\n\n"
p1, p2 = code.find(pi_start), code.find(pi_end, code.find(pi_start)) + len(pi_end)
with open("src/shared/components/ui/ProfileInner.tsx", "w") as f:
    f.write("""import { motion } from "framer-motion";\nimport { Award, Check, Crown, Flame, LogOut, Pencil, Shield, Trophy, User } from "lucide-react";\nimport { useEffect, useRef, useState } from "react";\nimport { Button, Input } from "@/shared/components/LayoutBlocks";\nimport { CAT_IMAGES } from "@/shared/lib/constants";\nimport { cn } from "@/shared/lib/utils";\nimport { ErrorManager } from "@/shared/services/errorManager";\nimport useAppStore from "@/store/appStore";\n\n""")
    f.write(code[p1:p2])
code = code[:p1] + code[p2:]
exports.append('import { ProfileInner } from "./ui/ProfileInner";\nexport { ProfileInner };')


# RouteFallback
rf_start = "export function RouteFallback({ text }: { text: string }) {"
rf_end = "}\n\n"
r1, r2 = code.find(rf_start), code.find(rf_end, code.find(rf_start)) + len(rf_end)
with open("src/shared/components/ui/RouteFallback.tsx", "w") as f:
    f.write("""import { Loading } from "@/shared/components/LayoutBlocks";\n\n""")
    f.write(code[r1:r2])
code = code[:r1] + code[r2:]
exports.append('import { RouteFallback } from "./ui/RouteFallback";\nexport { RouteFallback };')


# SearchFilterBar (contains 3 sub components)
sf_start = "interface SearchFilterBarProps {"
sf_end = "\t);\n}\n\n"
# SearchFilterBar is the LAST block before SectionHeading, so its end is right before SectionHeading
s1, s2 = code.find(sf_start), code.find("export const SectionHeading")
with open("src/shared/components/ui/SearchFilterBar.tsx", "w") as f:
    f.write("""import { motion, useReducedMotion } from "framer-motion";\nimport { Loader2, Search } from "lucide-react";\nimport type { ChangeEvent } from "react";\nimport { Button } from "@/shared/components/LayoutBlocks";\nimport { hapticNavTap } from "@/shared/lib/utils";\n\n""")
    f.write(code[s1:s2])
code = code[:s1] + code[s2:]
exports.append('import { SearchFilterBar } from "./ui/SearchFilterBar";\nexport { SearchFilterBar };')


# SectionHeading
sh_start = "export const SectionHeading = memo(function SectionHeading({"
sh_end = "\t);\n});\n"
h1, h2 = code.find(sh_start), code.find(sh_end, code.find(sh_start)) + len(sh_end)
with open("src/shared/components/ui/SectionHeading.tsx", "w") as f:
    f.write("""import { memo } from "react";\n\n""")
    f.write(code[h1:h2])
code = code[:h1] + code[h2:]
exports.append('import { SectionHeading } from "./ui/SectionHeading";\nexport { SectionHeading };')


with open("src/shared/components/UIBlocks.tsx", "w") as f:
    f.write("\n".join(exports) + "\n\n" + code)

print("Done!")

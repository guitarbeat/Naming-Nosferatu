const fs = require('fs');

const code = fs.readFileSync('src/shared/components/UIBlocks.tsx', 'utf8');

function extract(startStr) {
    const idx = code.indexOf(startStr);
    if (idx === -1) return null;

    const braceStart = code.indexOf('{', idx);
    if (braceStart === -1) return null;

    let braceCount = 1;
    for (let i = braceStart + 1; i < code.length; i++) {
        if (code[i] === '{') braceCount++;
        if (code[i] === '}') braceCount--;

        if (braceCount === 0) {
            let end = i + 1;
            if (code[end] === ')') end++;
            if (code[end] === ';') end++;
            return {
                text: code.slice(idx, end),
                start: idx,
                end: end
            };
        }
    }
    return null;
}

const comps = {
    "FloatingNav": ["export type NavItem = {", "export const FloatingNav = memo(function FloatingNav({ items }: { items: NavItem[] }) {"],
    "MagicProfileWidget": ["export interface MagicProfileWidgetProps {", "export function MagicProfileWidget({"],
    "MagicToggle": ["export interface MagicToggleOption<T extends string> {", "export interface MagicToggleProps<T extends string> {", "export function MagicToggle<T extends string>({"],
    "ProfileInner": ["interface ProfileInnerProps {", "export function ProfileInner({ onLogin, onLogout }: ProfileInnerProps) {"],
    "RouteFallback": ["export function RouteFallback({ text }: { text: string }) {"],
    "SearchFilterBar": ["interface SearchFilterBarProps {", "function SearchInput({", "function FilterSelect({", "export function SearchFilterBar({"],
    "SectionHeading": ["export const SectionHeading = memo(function SectionHeading({"]
};

const imports = {
    "FloatingNav": `import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { memo } from "react";
import { cn, hapticNavTap } from "@/shared/lib/utils";`,
    "MagicProfileWidget": `import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Pencil, User } from "lucide-react";
import type { RefObject } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";`,
    "MagicToggle": `import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { hapticNavTap } from "@/shared/lib/utils";`,
    "ProfileInner": `import { motion } from "framer-motion";
import { Award, Check, Crown, Flame, LogOut, Pencil, Shield, Trophy, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@/shared/components/LayoutBlocks";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/utils";
import { ErrorManager } from "@/shared/services/errorManager";
import useAppStore from "@/store/appStore";`,
    "RouteFallback": `import { Loading } from "@/shared/components/LayoutBlocks";`,
    "SearchFilterBar": `import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import type { ChangeEvent } from "react";
import { Button } from "@/shared/components/LayoutBlocks";
import { hapticNavTap } from "@/shared/lib/utils";`,
    "SectionHeading": `import { memo } from "react";`
};

let rangesToRemove = [];
fs.mkdirSync('src/shared/components/ui', { recursive: true });

let myExports = [];

for (const [name, starts] of Object.entries(comps)) {
    let output = imports[name] + "\\n\\n";
    for (const start of starts) {
        const block = extract(start);
        if (block) {
            output += block.text + "\\n\\n";
            rangesToRemove.push([block.start, block.end]);
        }
    }
    fs.writeFileSync(`src/shared/components/ui/${name}.tsx`, output);

    if (name === "FloatingNav") myExports.push('import { FloatingNav, type NavItem } from "./ui/FloatingNav";\\nexport { FloatingNav, type NavItem };');
    else if (name === "MagicProfileWidget") myExports.push('import { MagicProfileWidget, type MagicProfileWidgetProps } from "./ui/MagicProfileWidget";\\nexport { MagicProfileWidget, type MagicProfileWidgetProps };');
    else if (name === "MagicToggle") myExports.push('import { MagicToggle, type MagicToggleOption, type MagicToggleProps } from "./ui/MagicToggle";\\nexport { MagicToggle, type MagicToggleOption, type MagicToggleProps };');
    else if (name === "SearchFilterBar") myExports.push('import { SearchFilterBar } from "./ui/SearchFilterBar";\\nexport { SearchFilterBar };');
    else myExports.push(`import { ${name} } from "./ui/${name}";\\nexport { ${name} };`);
}

rangesToRemove.sort((a, b) => b[0] - a[0]);

let newCode = code;
for (const [start, end] of rangesToRemove) {
    newCode = newCode.slice(0, start) + newCode.slice(end);
}

fs.writeFileSync("src/shared/components/UIBlocks.tsx", myExports.join("\\n") + "\\n\\n" + newCode);

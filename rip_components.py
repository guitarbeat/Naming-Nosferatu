import os

with open("src/shared/components/UIBlocks.tsx", "r") as f:
    text = f.read()

# I will write a simple python script to just split the file using string indices.
# FloatingNav: from `export type NavItem` to `export const FloatingNav = memo(...) { ... });`
# MagicProfileWidget: from `export interface MagicProfileWidgetProps` to end of `export function MagicProfileWidget(...) { ... }`
# MagicToggle: from `export interface MagicToggleOption` to end of `export function MagicToggle(...) { ... }`
# ProfileInner: from `interface ProfileInnerProps` to end of `export function ProfileInner(...) { ... }`
# RouteFallback: from `export function RouteFallback` to end of it.
# SearchFilterBar: from `interface SearchFilterBarProps` to end of `export function SearchFilterBar(...) { ... }` (Note this also includes SearchInput and FilterSelect and SectionHeading)

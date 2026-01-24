# Bolt's Journal

## 2026-01-24 - Framer Motion Optimization
**Learning:** React state (`useState`) for drag coordinates causes excessive re-renders (one per frame). `useMotionValue` allows performant, declarative animations without re-renders.
**Action:** Always prefer `useMotionValue` and `useTransform` for continuous gesture-driven animations. Use `dragSnapToOrigin` to handle reset logic when not controlling position via state.

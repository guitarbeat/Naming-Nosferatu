1. We will extract the inline components from `src/features/tournament/components/NameSelector.tsx` to a separate primitives file `src/features/tournament/components/ui/NameCardPrimitives.tsx` to make the main file lighter.
2. We extracted the `SectionHeading` inline component in `src/app/routes/HomeRoute.tsx` to `src/shared/components/ui/SectionHeading.tsx` since it's a generic UI element that could be reused and keeps the home route file focused on routing and data logic.
3. Complete pre commit steps to ensure proper testing, verification, review, and reflection are done.
4. Use `submit` to commit the changes and push.

# AI_RULES.md

## Tech Stack
- React
- TypeScript
- React Router
- shadcn/ui
- Tailwind CSS
- Lucide React (for icons)
- Node.js / npm
- Folder structure: `src/pages` for pages, `src/components` for reusable components

## Library Usage Rules
1. **shadcn/ui**: Use prebuilt components; do not modify existing ones. Create new components if customization is needed.
2. **Tailwind CSS**: Handle all styling with Tailwind classes. Avoid inline styles or other CSS libraries.
3. **Lucide React**: Use for icons. Do not use other icon libraries.
4. **React Router**: Manage all navigation routes in `src/App.tsx`.
5. **Folder Structure**: Keep pages in `src/pages` and components in `src/components`. Do not place components elsewhere.
6. **Simplicity**: Prioritize simple, maintainable code. Avoid unnecessary abstractions or features.
7. **No External Libraries**: Only use shadcn, Tailwind, Lucide, and React Router unless explicitly required.
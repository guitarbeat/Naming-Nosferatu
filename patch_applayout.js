const fs = require('fs');
let code = fs.readFileSync('src/app/index.tsx', 'utf8');

// 1. Add StaggeredMenu import
code = code.replace(
  'import { RouteFallback } from "@/shared/components/UIBlocks";',
  'import { RouteFallback } from "@/shared/components/UIBlocks";\nimport { StaggeredMenu } from "@/shared/components/StaggeredMenu";'
);

// 2. Add useNavigate inside AppLayout
code = code.replace(
  'export function AppLayout({ children }: { children: ReactNode }) {\n\tconst tournament = useAppStore((s) => s.tournament);',
  'export function AppLayout({ children }: { children: ReactNode }) {\n\tconst navigate = useNavigate();\n\tconst tournament = useAppStore((s) => s.tournament);'
);

// 3. Add useMemo items
const itemsCode = `
	const staggeredMenuItems = useMemo(
		() => [
			{
				label: "Home",
				onClick: () => navigate("/"),
			},
			{
				label: "Admin Dashboard",
				onClick: () => navigate("/admin"),
			},
			{
				label: "Tournament Setup",
				onClick: () => navigate("/setup"),
			},
		],
		[navigate],
	);

	const socialItems = useMemo(
		() => [
			{
				label: "GitHub",
				link: "https://github.com/google/ai-studio",
			},
			{
				label: "About",
				link: "#",
			},
		],
		[],
	);
`;

code = code.replace(
  '\tconst handleDismissError = () => {\n\t\terrorActions.clearError();\n\t};\n\n\treturn (',
  '\tconst handleDismissError = () => {\n\t\terrorActions.clearError();\n\t};\n' + itemsCode + '\n\treturn ('
);

// 4. Add StaggeredMenu component
const menuCode = `
				<OfflineIndicator />
				<StaggeredMenu
					position="right"
					items={staggeredMenuItems}
					socialItems={socialItems}
					colors={["#FFD6E8", "#FFA3CC", "#FF70B0"]}
					accentColor="#FF70B0"
					menuButtonColor="var(--primary)"
					isFixed={true}
				/>`;
code = code.replace(
  '\t\t\t\t<OfflineIndicator />',
  menuCode
);

fs.writeFileSync('src/app/index.tsx', code);

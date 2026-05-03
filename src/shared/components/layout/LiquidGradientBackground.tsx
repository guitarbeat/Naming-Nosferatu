export function LiquidGradientBackground() {
	return (
		<div
			className="fixed inset-0 -z-10"
			aria-hidden="true"
			style={{
				background: `
					radial-gradient(ellipse 80% 60% at 20% 10%, hsl(190 55% 18% / 0.35) 0%, transparent 60%),
					radial-gradient(ellipse 60% 50% at 85% 80%, hsl(16 71% 22% / 0.22) 0%, transparent 55%),
					hsl(224 28% 7%)
				`,
			}}
		/>
	);
}

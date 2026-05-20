import { LiquidButton, MetalButton } from "@/shared/components/ui/liquid-glass-button";

export default function LiquidGlassDemoOne() {
	return (
		<div className="flex flex-col gap-8 items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/20">
			{/* Liquid Glass Button Demo */}
			<div className="relative h-[200px] w-[800px] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
				<LiquidButton className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
					Liquid Glass
				</LiquidButton>
			</div>

			{/* Metal Button Variants */}
			<div className="flex gap-4 flex-wrap justify-center">
				<MetalButton variant="default">Metal Default</MetalButton>
				<MetalButton variant="primary">Metal Primary</MetalButton>
				<MetalButton variant="success">Metal Success</MetalButton>
				<MetalButton variant="error">Metal Error</MetalButton>
				<MetalButton variant="gold">Metal Gold</MetalButton>
				<MetalButton variant="bronze">Metal Bronze</MetalButton>
			</div>

			{/* Multiple Liquid Buttons with different sizes */}
			<div className="flex gap-4 flex-wrap justify-center">
				<LiquidButton size="sm">Small</LiquidButton>
				<LiquidButton size="default">Default</LiquidButton>
				<LiquidButton size="lg">Large</LiquidButton>
				<LiquidButton size="xl">Extra Large</LiquidButton>
				<LiquidButton size="xxl">2X Large</LiquidButton>
			</div>
		</div>
	);
}

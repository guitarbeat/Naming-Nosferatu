import { cva } from "class-variance-authority";

export const cardVariants = cva(
	"relative flex flex-col overflow-hidden rounded-xl transition-all duration-300 backdrop-blur-md",
	{
		variants: {
			variant: {
				default: "bg-foreground/5 border border-border/10",
				elevated: "bg-foreground/5 border-none shadow-md",
				outlined: "bg-transparent border border-border/20",
				filled: "bg-foreground/10 border-none",
				primary:
					"bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/30",
				success:
					"bg-gradient-to-br from-chart-2/10 to-chart-2/5 border border-chart-2/20 hover:border-chart-2/30",
				warning:
					"bg-gradient-to-br from-chart-4/10 to-chart-4/5 border border-chart-4/20 hover:border-chart-4/30",
				info: "bg-gradient-to-br from-chart-5/10 to-chart-5/5 border border-chart-5/20 hover:border-chart-5/30",
				danger:
					"bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 hover:border-destructive/30",
				secondary:
					"bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 hover:border-secondary/30",
			},
			padding: {
				none: "p-0",
				small: "p-3",
				medium: "p-5",
				large: "p-8",
				xl: "p-10",
			},
			shadow: {
				none: "shadow-none",
				small: "shadow-sm",
				medium: "shadow-md",
				large: "shadow-lg",
				xl: "shadow-xl",
			},
			bordered: {
				true: "border border-border/10",
				false: "",
			},
			background: {
				solid: "bg-background/40",
				glass: "backdrop-blur-xl bg-foreground/5",
				gradient: "bg-gradient-to-br from-foreground/10 to-foreground/5",
				transparent: "bg-transparent",
			},
		},
		defaultVariants: {
			variant: "default",
			padding: "medium",
			shadow: "none",
			bordered: false,
			background: "solid",
		},
	},
);

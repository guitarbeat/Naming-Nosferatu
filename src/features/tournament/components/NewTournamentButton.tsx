import { Plus } from "lucide-react";
import type { ElementType } from "react";
import Button from "@/shared/components/layout/Button";

interface NewTournamentButtonProps {
	onClick: () => void;
	className?: string;
	variant?: "outline" | "glass" | "primary" | "danger" | "ghost" | "flat";
	size?: "small" | "medium" | "large" | "icon";
	label?: string;
	icon?: ElementType;
	fullWidth?: boolean;
}

export function NewTournamentButton({
	onClick,
	className,
	variant = "outline",
	size = "small",
	label = "New Tournament",
	icon: Icon = Plus,
	fullWidth,
}: NewTournamentButtonProps) {
	return (
		<Button
			variant={variant}
			size={size}
			onClick={onClick}
			className={`${fullWidth ? "w-full" : ""} ${className || ""}`.trim()}
		>
			<Icon size={14} />
			{label}
		</Button>
	);
}

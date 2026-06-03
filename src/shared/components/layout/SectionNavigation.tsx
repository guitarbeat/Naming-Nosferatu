import Button from "./Button";

interface NavigationButton {
	label: string;
	onClick: () => void;
	direction?: "back" | "next";
}

interface SectionNavigationProps {
	back?: NavigationButton;
	next?: NavigationButton;
}

export function SectionNavigation({ back, next }: SectionNavigationProps) {
	return (
		<div className="mt-auto pt-8 flex justify-center gap-4">
			{back && (
				<Button variant="glass" size="lg" onClick={back.onClick}>
					← {back.label}
				</Button>
			)}
			{next && (
				<Button variant="glass" size="lg" onClick={next.onClick}>
					{next.label} →
				</Button>
			)}
		</div>
	);
}

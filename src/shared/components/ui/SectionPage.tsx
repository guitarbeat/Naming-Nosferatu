import type { ReactNode } from "react";
import { Section } from "@/shared/components/layout/Section";
import { SectionHeading } from "@/shared/components/layout/SectionHeading";

interface SectionPageProps {
	id: string;
	title: string;
	subtitle: string;
	children: ReactNode;
	maxWidth?: "xl" | "2xl";
}

export function SectionPage({ id, title, subtitle, children, maxWidth = "2xl" }: SectionPageProps) {
	return (
		<Section
			id={id}
			variant="minimal"
			padding="comfortable"
			maxWidth={maxWidth}
			separator={true}
			fullpage={true}
		>
			<div className="flex flex-col items-center justify-center min-h-[100dvh] py-12 md:py-16">
				<div className="w-full flex flex-col items-center gap-8 md:gap-12">
					<SectionHeading title={title} subtitle={subtitle} />
					{children}
				</div>
			</div>
		</Section>
	);
}

import { Cat } from "lucide-react";
import { GooeyText } from "@/components/ui/gooey-text-morphing";

function GooeyTextDemo() {
	return (
		<div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden rounded-xl bg-muted/20">
			<div className="absolute inset-0 opacity-20">
				<img
					src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=2043&ixlib=rb-4.0.3"
					alt="Cat background"
					className="w-full h-full object-cover"
				/>
			</div>
			<div className="z-10 flex flex-col items-center gap-8">
				<Cat className="w-12 h-12 text-primary" />
				<GooeyText
					texts={["Design", "Engineering", "Is", "Awesome", "With", "Cats"]}
					morphTime={1}
					cooldownTime={0.5}
					className="font-bold min-h-[100px] w-full"
				/>
			</div>
		</div>
	);
}

export { GooeyTextDemo };

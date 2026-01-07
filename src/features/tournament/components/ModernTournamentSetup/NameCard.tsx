import Card from "../../../../shared/components/Card/Card";

const CardBody = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={className} {...props}>
		{children}
	</div>
);

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { CatName } from "../../services/tournamentService";

interface NameCardProps {
	cat: CatName;
	isSelected: boolean;
	onToggle: () => void;
}

export function NameCard({ cat, isSelected, onToggle }: NameCardProps) {
	return (
		<motion.div
			layout={true}
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
		>
			<Card
				isPressable={true}
				onPress={onToggle}
				className={`w-full h-full min-h-[140px] border transition-all duration-200 ${
					isSelected
						? "border-purple-500 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
						: "border-white/5 bg-slate-900/50 hover:bg-slate-800/50 hover:border-white/10"
				}`}
			>
				<CardBody className="flex flex-col justify-between p-4">
					<div>
						<div className="flex justify-between items-start mb-2">
							<h3
								className={`text-lg font-bold font-mono ${
									isSelected ? "text-purple-300" : "text-slate-200"
								}`}
							>
								{cat.name.toUpperCase()}
							</h3>
							{isSelected && (
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									className="bg-purple-500 rounded-full p-1"
								>
									<Trophy size={10} className="text-white" />
								</motion.div>
							)}
						</div>
						{cat.description && (
							<p className="text-xs text-slate-400 line-clamp-3">{cat.description}</p>
						)}
					</div>
					<div className="mt-4 flex gap-2">
						{cat.avg_rating && (
							<div className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">
								RAT: {Math.round(cat.avg_rating)}
							</div>
						)}
					</div>
				</CardBody>
			</Card>
		</motion.div>
	);
}

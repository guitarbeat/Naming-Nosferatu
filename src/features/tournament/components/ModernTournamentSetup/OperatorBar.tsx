import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import React from "react";
import { useTournamentStore } from "../../stores/tournamentStore";

export function OperatorBar() {
	const { operatorIdentity, setOperatorIdentity } = useTournamentStore();
	const [isEditing, setIsEditing] = React.useState(false);
	const [tempName, setTempName] = React.useState(operatorIdentity);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setOperatorIdentity(tempName);
		setIsEditing(false);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-slate-900 border-b border-white/10 p-4 flex items-center justify-between"
		>
			<div className="flex items-center gap-3">
				<div className="bg-purple-500/20 p-2 rounded-lg">
					<User className="w-5 h-5 text-purple-400" />
				</div>
				<div className="flex flex-col">
					<span className="text-[10px] uppercase tracking-wider text-slate-400">
						Operator Identity
					</span>
					{isEditing ? (
						<form onSubmit={handleSubmit} className="flex gap-2 items-center">
							<input
								autoFocus={true}
								value={tempName}
								onChange={(e) => setTempName(e.target.value)}
								onBlur={handleSubmit}
								className="bg-transparent border-b border-purple-500 text-white focus:outline-none text-sm font-mono"
							/>
						</form>
					) : (
						<div
							className="flex items-center gap-2 cursor-pointer group"
							onClick={() => setIsEditing(true)}
						>
							<span className="text-white font-mono">{operatorIdentity}</span>
							<span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
								[EDIT]
							</span>
						</div>
					)}
				</div>
			</div>
			<div
				className="bg-purple-900/30 border border-purple-500/20 rounded px-2 py-1 inline-flex items-center gap-1"
			>
				<Sparkles size={12} />
				<span className="text-xs">System Online</span>
			</div>
		</motion.div>
	);
}

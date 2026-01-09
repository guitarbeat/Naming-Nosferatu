import { AnimatePresence, motion } from "framer-motion";

interface KeyboardHelpProps {
	show: boolean;
}

export function KeyboardHelp({ show }: KeyboardHelpProps) {
	return (
		<AnimatePresence>
			{show && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					transition={{ duration: 0.3 }}
					id="keyboardHelp"
					className="p-5 mt-4 bg-gradient-to-br from-white/6 to-white/3 border border-white/12 rounded-2xl shadow-lg backdrop-blur-xl"
					role="complementary"
					aria-label="Keyboard shortcuts help"
				>
					<h3 className="m-0 mb-3 text-lg font-semibold text-slate-200">Keyboard Shortcuts</h3>
					<ul className="p-0 m-0 list-none">
						<li className="flex gap-2 items-center py-2 text-slate-400">
							<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
								←
							</kbd>
							Select left name
						</li>
						<li className="flex gap-2 items-center py-2 text-slate-400">
							<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
								→
							</kbd>
							Select right name
						</li>
						<li className="flex gap-2 items-center py-2 text-slate-400">
							<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
								↑
							</kbd>
							Vote for both names
						</li>
						<li className="flex gap-2 items-center py-2 text-slate-400">
							<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
								↓
							</kbd>
							Skip this match
						</li>
						<li className="flex gap-2 items-center py-2 text-slate-400">
							<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
								Space
							</kbd>
							or
							<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
								Enter
							</kbd>
							Vote for selected name
						</li>
						<li className="flex gap-2 items-center py-2 text-slate-400">
							<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
								Escape
							</kbd>
							Clear selection
						</li>
						<li className="flex gap-2 items-center py-2 text-slate-400">
							<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
								Tab
							</kbd>
							Navigate between elements
						</li>
						<li className="flex gap-2 items-center py-2 text-slate-400">
							<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
								C
							</kbd>
							Toggle cat pictures
						</li>
					</ul>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

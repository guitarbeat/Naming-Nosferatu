/**
 * @module ProfileEditorModal
 * @description Modal for editing user profile (name and avatar)
 */

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import Button from "@/features/ui/Button";
import { Card } from "@/features/ui/Card";
import { Input } from "@/features/ui/FormPrimitives";
import useAppStore from "@/store/useAppStore";

interface ProfileEditorModalProps {
	onLogin: (name: string) => Promise<boolean | undefined>;
}

export function ProfileEditorModal({ onLogin }: ProfileEditorModalProps) {
	const { user, ui, uiActions } = useAppStore();
	const [editedName, setEditedName] = useState(user.name || "");
	const [isSaving, setIsSaving] = useState(false);

	const isOpen = ui.isEditingProfile;

	const handleClose = () => {
		uiActions.setEditingProfile(false);
		setEditedName(user.name || "");
	};

	const handleSave = async () => {
		if (!editedName.trim()) {
			return;
		}
		setIsSaving(true);
		try {
			await onLogin(editedName.trim());
			uiActions.setEditingProfile(false);
		} catch (err) {
			console.error("Failed to update name:", err);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={handleClose}
				>
					{/* Modal */}
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 20 }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						onClick={(e) => e.stopPropagation()}
						className="w-full max-w-sm"
					>
						<Card className="relative w-full overflow-hidden" variant="default">
							<button
								className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
								onClick={handleClose}
								aria-label="Close"
							>
								<X size={20} />
							</button>

							<div className="flex flex-col gap-6 p-8 items-center">
								{/* Avatar */}
								<div className="relative group">
									<div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
									<div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-xl bg-neutral-800">
										<img
											src={user.avatarUrl || "https://placekitten.com/100/100"}
											alt="Profile"
											className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
										/>
									</div>
								</div>

								{/* Name Input */}
								<div className="w-full space-y-2">
									<label className="text-sm font-semibold text-white/70 ml-1">Your Name</label>
									<Input
										type="text"
										value={editedName}
										onChange={(e) => setEditedName(e.target.value)}
										placeholder="Enter your name..."
										onKeyDown={(e) => e.key === "Enter" && handleSave()}
										className="text-center font-bold text-lg bg-white/5 border-white/10 focus:border-purple-500"
									/>
								</div>

								{/* Actions */}
								<div className="flex gap-3 w-full mt-2">
									<Button variant="secondary" onClick={handleClose} className="flex-1">
										Cancel
									</Button>
									<Button
										variant="primary"
										onClick={handleSave}
										disabled={isSaving || !editedName.trim()}
										className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-none"
									>
										{isSaving ? "Saving..." : "Save"}
									</Button>
								</div>
							</div>
						</Card>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

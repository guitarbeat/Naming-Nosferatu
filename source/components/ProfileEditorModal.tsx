/**
 * @module ProfileEditorModal
 * @description Modal for editing user profile (name and avatar)
 */

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import useAppStore from "@/store/useAppStore";
import Button from "./Button";
import { Input } from "./FormPrimitives";
import styles from "./ProfileEditorModal.module.css";

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
					className={styles.overlay}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={handleClose}
				>
					{/* Modal */}
					<motion.div
						className={styles.modal}
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 20 }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						onClick={(e) => e.stopPropagation()}
					>
						<button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
							<X size={20} />
						</button>

						<div className={styles.content}>
							{/* Avatar */}
							<div className={styles.avatarSection}>
								<div className={styles.avatarGlow} />
								<div className={styles.avatar}>
									<img src={user.avatarUrl || "https://placekitten.com/100/100"} alt="Profile" />
								</div>
							</div>

							{/* Name Input */}
							<div className={styles.inputSection}>
								<label className={styles.label}>Your Name</label>
								<Input
									type="text"
									value={editedName}
									onChange={(e) => setEditedName(e.target.value)}
									placeholder="Enter your name..."
									onKeyDown={(e) => e.key === "Enter" && handleSave()}
								/>
							</div>

							{/* Actions */}
							<div className={styles.actions}>
								<Button variant="secondary" onClick={handleClose}>
									Cancel
								</Button>
								<Button
									variant="primary"
									onClick={handleSave}
									disabled={isSaving || !editedName.trim()}
								>
									{isSaving ? "Saving..." : "Save"}
								</Button>
							</div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

/**
 * @module TournamentForms
 * @description Form components for tournament interaction
 * Includes: NameSuggestion, NameUploadForm, ProfileSection
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CAT_IMAGES } from "@/utils/constants";
import { useNameSuggestion } from "@/hooks/useNames";
import { LogOut, Pencil, Upload, User, X } from "@/utils/icons";
import Button from "@/layout/Button";
import { Input, Textarea } from "@/layout/FormPrimitives";
import { getGlassPreset } from "@/layout/GlassPresets";
import { LiquidGlass } from "@/layout/LayoutEffects";
import { Section } from "@/layout/Section";
import { imagesAPI } from "@/services/supabase-client/client";
import useAppStore from "@/store/appStore";
import { compressImageFile, devError } from "@/utils/basic";

/* =========================================================================
   NAME UPLOAD FORM COMPONENT
   ========================================================================= */

interface NameUploadFormProps {
	onImagesUploaded: (uploadedPaths: string[]) => void;
	isAdmin?: boolean;
}

export function NameUploadForm({ onImagesUploaded, isAdmin = false }: NameUploadFormProps) {
	const handleFileUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files || []);
			if (!files.length) {
				return;
			}

			try {
				const uploaded: string[] = [];
				await Promise.all(
					files.map(async (f) => {
						const compressed = await compressImageFile(f, {
							maxWidth: 1600,
							maxHeight: 1600,
							quality: 0.8,
						});
						const result = await imagesAPI.upload(compressed, "admin");
						if (result?.path) {
							uploaded.push(result.path);
						}
					}),
				);
				if (uploaded.length > 0) {
					onImagesUploaded(uploaded);
				}
			} catch (err) {
				devError("Upload error", err);
			}
		},
		[onImagesUploaded],
	);

	if (!isAdmin) {
		return null;
	}

	return (
		<div className="flex justify-center mt-12 mb-8">
			<label className="cursor-pointer flex items-center gap-3 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-all font-bold tracking-wider uppercase text-sm border border-purple-500/20 active:scale-95 shadow-xl shadow-purple-900/30">
				<input
					type="file"
					accept="image/*"
					multiple={true}
					onChange={handleFileUpload}
					style={{ display: "none" }}
				/>
				<Upload size={20} />
				<span>Upload New Cat Photos</span>
			</label>
		</div>
	);
}

/* =========================================================================
   INLINE NAME SUGGESTION COMPONENT
   ========================================================================= */

function InlineNameSuggestion() {
	const { values, isSubmitting, handleChange, handleSubmit, globalError, successMessage } =
		useNameSuggestion();

	const handleLocalSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await handleSubmit();
	};

	return (
		<LiquidGlass
			className="w-full flex flex-col items-center justify-center p-8 backdrop-blur-md rounded-3xl"
			style={{ width: "100%", height: "auto", minHeight: "200px" }}
			{...getGlassPreset("card")}
		>
			<form
				onSubmit={handleLocalSubmit}
				className="flex flex-col gap-6 w-full max-w-2xl mx-auto"
				style={{ padding: "2rem" }}
			>
				<div className="flex flex-col gap-4">
					<label
						htmlFor="suggest-name"
						className="text-xl font-bold text-center text-white/90 drop-shadow-sm"
					>
						Got a great name in mind?
					</label>
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<div className="flex-1">
							<Input
								id="suggest-name"
								type="text"
								value={values.name}
								onChange={(e) => handleChange("name", e.target.value)}
								placeholder="Enter a cool cat name..."
								className="w-full h-[50px] px-4 font-medium backdrop-blur-sm"
								disabled={isSubmitting}
							/>
						</div>
						<Button
							type="submit"
							variant="gradient"
							size="xl"
							disabled={!values.name.trim() || !values.description.trim() || isSubmitting}
							loading={isSubmitting}
							className="w-full sm:w-auto"
						>
							Suggest
						</Button>
					</div>
					<div className="flex flex-col gap-2">
						<label htmlFor="suggest-description" className="text-sm font-medium text-white/80">
							Why this name? (optional but encouraged)
						</label>
						<Textarea
							id="suggest-description"
							value={values.description}
							onChange={(e) => handleChange("description", e.target.value)}
							placeholder="Share what makes this name special, its meaning, or why it fits your cat..."
							rows={3}
							className="w-full px-4 py-3 font-medium backdrop-blur-sm resize-none"
							disabled={isSubmitting}
						/>
					</div>
				</div>
				{globalError && (
					<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
						{globalError}
					</div>
				)}
				{successMessage && (
					<div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-200 text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
						{successMessage}
					</div>
				)}
				<p className="text-center text-sm text-white/50 font-medium">
					Your suggestion will be added to the pool for everyone to discover.
				</p>
			</form>
		</LiquidGlass>
	);
}

/* =========================================================================
   MODAL NAME SUGGESTION COMPONENT
   ========================================================================= */

interface ModalNameSuggestionProps {
	isOpen: boolean;
	onClose: () => void;
}

function ModalNameSuggestion({ isOpen, onClose }: ModalNameSuggestionProps) {
	const isMountedRef = useRef(true);
	const nameInputRef = useRef<HTMLInputElement | null>(null);
	const modalGlassId = useId();

	const {
		values,
		errors,
		touched,
		isSubmitting,
		isValid,
		handleChange,
		handleBlur,
		handleSubmit,
		reset,
		globalError,
		successMessage: success,
		setGlobalError,
	} = useNameSuggestion({
		onSuccess: () => {
			setTimeout(() => {
				if (isMountedRef.current) {
					onClose();
				}
			}, 3000);
		},
	});

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		if (isOpen && nameInputRef.current) {
			setTimeout(() => {
				nameInputRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				reset();
				onClose();
			}
		};

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose, reset]);

	const handleClose = useCallback(() => {
		if (isSubmitting) {
			return;
		}
		reset();
		setGlobalError("");
		onClose();
	}, [isSubmitting, onClose, reset, setGlobalError]);

	if (!isOpen) {
		return null;
	}

	return (
		<>
			<div
				className="fixed inset-0 bg-black/60 z-[1050] backdrop-blur-sm animate-in fade-in duration-200"
				onClick={handleClose}
				aria-hidden="true"
			/>
			<LiquidGlass
				id={`modal-glass-${modalGlassId.replace(/:/g, "-")}`}
				{...getGlassPreset("modal")}
				className="z-[1051] overflow-hidden"
				style={{
					position: "fixed",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: "min(90vw, 500px)",
					maxHeight: "90vh",
					height: "auto",
					minHeight: "400px",
					maxWidth: "min(90vw, 500px)",
					zIndex: "1051",
				}}
			>
				<div
					className="flex flex-col h-full bg-black/40 text-white"
					role="dialog"
					aria-labelledby="suggest-name-title"
					aria-describedby="suggest-name-description"
					aria-modal="true"
				>
					<div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
						<h2
							id="suggest-name-title"
							className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400"
						>
							💡 Suggest a Name
						</h2>
						<button
							type="button"
							className="flex items-center justify-center w-8 h-8 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
							onClick={handleClose}
							aria-label="Close modal"
							disabled={isSubmitting}
						>
							<X size={24} />
						</button>
					</div>

					<div className="p-6">
						<p id="suggest-name-description" className="text-sm text-white/70 mb-6">
							Help us expand the list by suggesting new cat names!
						</p>

						<form
							onSubmit={(e) => {
								e.preventDefault();
								void handleSubmit();
							}}
							className="flex flex-col gap-5"
						>
							<Input
								id="modal-name-input"
								label="Name"
								ref={nameInputRef}
								type="text"
								value={values.name}
								onChange={(e) => {
									handleChange("name", e.target.value);
									if (globalError) {
										setGlobalError("");
									}
								}}
								onBlur={() => handleBlur("name")}
								placeholder="e.g., Whiskers"
								maxLength={50}
								showSuccess={true}
								error={touched.name ? errors.name : null}
							/>

							<Textarea
								id="modal-description-input"
								label="Description"
								value={values.description}
								onChange={(e) => {
									handleChange("description", e.target.value);
									if (globalError) {
										setGlobalError("");
									}
								}}
								onBlur={() => handleBlur("description")}
								placeholder="Why is this name special? (e.g. 'He looks like a vampire!')"
								disabled={isSubmitting}
								maxLength={500}
								rows={4}
								error={touched.description ? errors.description : null}
							/>

							{globalError && (
								<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm font-medium animate-in fade-in slide-in-from-top-2">
									{globalError}
								</div>
							)}
							{success && (
								<div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-200 text-sm font-medium animate-in fade-in slide-in-from-top-2">
									{success}
								</div>
							)}

							<div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
								<Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
									Cancel
								</Button>
								<Button
									type="submit"
									variant="gradient"
									disabled={isSubmitting || !isValid}
									loading={isSubmitting}
									className="px-6"
								>
									Submit Suggestion
								</Button>
							</div>
						</form>
					</div>
				</div>
			</LiquidGlass>
		</>
	);
}

/* =========================================================================
   UNIFIED NAME SUGGESTION EXPORT
   ========================================================================= */

interface NameSuggestionProps {
	variant?: "inline" | "modal";
	isOpen?: boolean;
	onClose?: () => void;
}

export function NameSuggestion({
	variant = "inline",
	isOpen = false,
	onClose,
}: NameSuggestionProps) {
	if (variant === "modal") {
		return (
			<ModalNameSuggestion
				isOpen={isOpen}
				onClose={
					onClose ||
					(() => {
						/* No-op default */
					})
				}
			/>
		);
	}
	return <InlineNameSuggestion />;
}

/* =========================================================================
   PROFILE SECTION COMPONENT
   ========================================================================= */

interface ProfileSectionProps {
	onLogin: (name: string) => Promise<boolean | undefined>;
}

export function ProfileSection({ onLogin }: ProfileSectionProps) {
	const { user, userActions } = useAppStore();
	const [editedName, setEditedName] = useState(user.name || "");
	const [isSaving, setIsSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(!user.isLoggedIn);
	const [avatarSrc, setAvatarSrc] = useState(user.avatarUrl || "https://placekitten.com/200/200");

	useEffect(() => {
		setEditedName(user.name || "");
		setAvatarSrc(user.avatarUrl || "https://placekitten.com/200/200");
		if (!user.isLoggedIn) {
			setIsEditing(true);
		}
	}, [user.name, user.isLoggedIn, user.avatarUrl]);

	const handleSave = async () => {
		if (!editedName.trim()) {
			return;
		}
		setIsSaving(true);
		try {
			await onLogin(editedName.trim());
			setIsEditing(false);
		} catch (err) {
			console.error("Failed to update name:", err);
		} finally {
			setIsSaving(false);
		}
	};

	const handleLogout = () => {
		userActions.logout();
		setIsEditing(true);
	};

	return (
		<Section id="profile" variant="minimal" padding="comfortable" maxWidth="2xl" separator={true}>
			<LiquidGlass
				className="w-full flex flex-col items-center justify-center backdrop-blur-md rounded-3xl"
				style={{ width: "100%", height: "auto", minHeight: "200px" }}
				{...getGlassPreset("card")}
			>
				<div className="flex flex-col gap-6 w-full p-8">
					{isEditing && !user.isLoggedIn && (
						<div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
							<h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
								Join the Council
							</h2>
							<p className="text-sm text-white/70">Enter your name to track your rankings</p>
						</div>
					)}

					<div className="flex flex-col md:flex-row gap-6 items-center">
						<div className="relative shrink-0">
							<div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-xl animate-pulse" />
							<div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-purple-500/30 shadow-lg shadow-purple-900/20 bg-neutral-900">
								<img
									src={avatarSrc}
									alt="Profile"
									className="w-full h-full object-cover"
									onError={() => setAvatarSrc(CAT_IMAGES[0] ?? "")}
								/>
							</div>
						</div>

						<div className="flex-1 w-full">
							{isEditing ? (
								<div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
									<div className="space-y-2">
										<label className="text-sm font-medium text-white/80 block">Your Name</label>
										<div className="relative">
											<User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/50" />
											<Input
												type="text"
												value={editedName}
												onChange={(e) => setEditedName(e.target.value)}
												placeholder="Who are you?"
												onKeyDown={(e) => e.key === "Enter" && handleSave()}
												className="w-full h-[50px] pl-12 pr-4 font-medium backdrop-blur-sm"
												autoFocus={!user.isLoggedIn}
											/>
										</div>
									</div>
									<div className="flex gap-3">
										{user.isLoggedIn && (
											<Button
												type="button"
												variant="ghost"
												onClick={() => setIsEditing(false)}
												className="flex-1"
											>
												Cancel
											</Button>
										)}
										<Button
											type="submit"
											variant="gradient"
											size="xl"
											onClick={handleSave}
											disabled={!editedName.trim() || isSaving}
											loading={isSaving}
											className="flex-[2]"
										>
											{user.isLoggedIn ? "Save" : "Begin Journey"}
										</Button>
									</div>
								</div>
							) : (
								<div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
									<div className="flex items-center gap-3">
										<h3 className="text-2xl md:text-3xl font-bold text-white">{user.name}</h3>
										<button
											type="button"
											onClick={() => setIsEditing(true)}
											className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
											aria-label="Edit name"
										>
											<Pencil size={16} />
										</button>
									</div>
									<button
										type="button"
										onClick={handleLogout}
										className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors group"
									>
										<LogOut
											size={16}
											className="group-hover:-translate-x-0.5 transition-transform"
										/>
										Logout
									</button>
								</div>
							)}
						</div>
					</div>

					{!isEditing && (
						<p className="text-center text-sm text-white/50 font-medium">
							Your preferences are saved to track your cat name rankings.
						</p>
					)}
				</div>
			</LiquidGlass>
		</Section>
	);
}

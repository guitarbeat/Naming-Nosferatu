import { User } from "lucide-react";
import type { RefObject } from "react";
import Button from "@/shared/components/layout/Button";
import { Input } from "@/shared/components/layout/FormPrimitives";

export interface ProfileEditFormProps {
	editedName: string;
	setEditedName: (val: string) => void;
	saveError: string | null;
	setSaveError: (val: string | null) => void;
	isSaving: boolean;
	isLoggedIn: boolean;
	handleSave: () => void;
	handleCancel: () => void;
	nameInputRef: RefObject<HTMLInputElement | null>;
}

export function ProfileEditForm({
	editedName,
	setEditedName,
	saveError,
	setSaveError,
	isSaving,
	isLoggedIn,
	handleSave,
	handleCancel,
	nameInputRef,
}: ProfileEditFormProps) {
	return (
		<div className="w-full space-y-4 animate-in fade-in duration-200">
			<div className="relative">
				<User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
				<Input
					ref={nameInputRef}
					type="text"
					value={editedName}
					onChange={(e) => {
						setEditedName(e.target.value);
						if (saveError) {
							setSaveError(null);
						}
					}}
					placeholder="Who are you?"
					onKeyDown={(e) => e.key === "Enter" && handleSave()}
					className="w-full h-11 pl-10 pr-4 text-sm"
				/>
			</div>

			{saveError && (
				<p role="alert" className="text-sm text-destructive">
					{saveError}
				</p>
			)}

			<div className="flex gap-2">
				{isLoggedIn && (
					<Button
						type="button"
						variant="ghost"
						onClick={handleCancel}
						className="flex-1"
					>
						Cancel
					</Button>
				)}
				<Button
					type="submit"
					variant="glass"
					size="large"
					onClick={handleSave}
					disabled={!editedName.trim() || isSaving}
					loading={isSaving}
					className={isLoggedIn ? "flex-[2]" : "w-full"}
				>
					{isLoggedIn ? "Save" : "Begin Journey"}
				</Button>
			</div>
		</div>
	);
}

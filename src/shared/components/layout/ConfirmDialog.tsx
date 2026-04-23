import { cn } from "@/shared/lib/utils";
import Button from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
        open: boolean;
        title: string;
        description?: string;
        confirmLabel?: string;
        cancelLabel?: string;
        confirmTone?: "default" | "danger";
        loading?: boolean;
        onConfirm: () => void | Promise<void>;
        onCancel: () => void;
}

/**
 * A specialized modal for confirmation actions.
 * Leverages the base Modal component for consistent accessibility and layout logic.
 */
export function ConfirmDialog({
        open,
        title,
        description,
        confirmLabel = "Confirm",
        cancelLabel = "Cancel",
        confirmTone = "default",
        loading = false,
        onConfirm,
        onCancel,
}: ConfirmDialogProps) {
        return (
                <Modal
                        open={open}
                        title={title}
                        onClose={onCancel}
                        closeDisabled={loading}
                        description={description}
                        maxWidth="max-w-md"
                >
                        <div className="flex flex-col">
                                {description && <p className="text-sm text-muted-foreground">{description}</p>}

                                <div className="mt-6 flex items-center justify-end gap-3">
                                        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                                                {cancelLabel}
                                        </Button>
                                        <Button
                                                type="button"
                                                variant={confirmTone === "danger" ? "danger" : "gradient"}
                                                onClick={() => void onConfirm()}
                                                loading={loading}
                                                className={cn(confirmTone === "danger" && "bg-red-600 hover:bg-red-500")}
                                        >
                                                {confirmLabel}
                                        </Button>
                                </div>
                        </div>
                </Modal>
        );
}

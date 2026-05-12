import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
        it("opens and can be closed with the cancel button", () => {
                const onCancel = vi.fn();
                render(
                        <ConfirmDialog
                                open={true}
                                title="Confirm action"
                                description="A confirmation is required."
                                onConfirm={() => {}}
                                onCancel={onCancel}
                        />,
                );

                fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
                expect(onCancel).toHaveBeenCalled();
        });
});

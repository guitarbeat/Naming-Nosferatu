import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
        it("renders when open and matches title", () => {
                render(
                        <Modal title="Welcome" open={true} onClose={() => {}}>
                                <p>Modal Content</p>
                        </Modal>,
                );
                expect(screen.getByText("Welcome")).toBeInTheDocument();
                expect(screen.getByText("Modal Content")).toBeInTheDocument();
        });

        it("does not render when closed", () => {
                render(
                        <Modal title="Welcome" open={false} onClose={() => {}}>
                                <p>Modal Content</p>
                        </Modal>,
                );
                expect(screen.queryByText("Welcome")).not.toBeInTheDocument();
        });

        it("calls onClose when close button is clicked", () => {
                const onClose = vi.fn();
                render(
                        <Modal title="Welcome" open={true} onClose={onClose}>
                                <p>Modal Content</p>
                        </Modal>,
                );
                const closeButton = screen.getByLabelText("Close welcome");
                fireEvent.click(closeButton);
                expect(onClose).toHaveBeenCalled();
        });

});

import type React from "react";
import { forwardRef } from "react";
import { cn } from "@/utils/basic";
import "./FancyButton.css";

export interface FancyButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
}

export const FancyButton = forwardRef<HTMLButtonElement, FancyButtonProps>(
	({ children, className, ...props }, ref) => {
		return (
			<div className={cn("fancy-button-wrap", className)}>
				<button className="fancy-button" ref={ref} {...props}>
					<span>{children}</span>
				</button>
				<div className="fancy-button-shadow" />
			</div>
		);
	},
);

FancyButton.displayName = "FancyButton";

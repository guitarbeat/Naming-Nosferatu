import { cn } from "@utils";
import React from "react";
import Button from "@/layout/Button";
import type {
	NameItem,
	NameManagementViewExtensions,
	NameManagementViewProfileProps,
	TournamentFilters,
} from "@/types";
import { NameGrid } from "../components/NameGrid";
import { TournamentToolbar } from "../components/TournamentToolbar";

interface ProfileModeProps {
	filterConfig: TournamentFilters;
	handleFilterChange: (name: keyof TournamentFilters, value: string | number | boolean) => void;
	names: NameItem[];
	isLoading: boolean;
	extensions: NameManagementViewExtensions;
	profileProps: NameManagementViewProfileProps;
	selectedNames: NameItem[];
	toggleName: (name: NameItem) => void;
	showCatPictures?: boolean;
	imageList?: string[];
}

export function ProfileMode({
	filterConfig,
	handleFilterChange,
	names,
	isLoading,
	extensions,
	profileProps,
	selectedNames,
	toggleName,
	showCatPictures = false,
	imageList = [],
}: ProfileModeProps) {
	return (
		<div
			className="w-full max-w-[1600px] mx-auto min-h-[80vh] flex flex-col gap-8 px-4 md:px-8 pb-32"
			data-mode="profile"
		>
			{/* Header Extension */}
			{extensions.header && (
				<div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
					{typeof extensions.header === "function" ? extensions.header() : extensions.header}
				</div>
			)}

			{/* Dashboard Extension */}
			{extensions.dashboard && (
				<section className="w-full flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500 delay-100">
					{React.isValidElement(extensions.dashboard)
						? extensions.dashboard
						: typeof extensions.dashboard === "function"
							? React.createElement(extensions.dashboard as React.ComponentType)
							: extensions.dashboard}
				</section>
			)}

			{/* Filters - Sticky for easier access */}
			<section className="w-full sticky top-20 z-30 transition-all duration-300">
				<div className="backdrop-blur-xl bg-black/60 rounded-2xl border border-white/10 p-2 shadow-2xl">
					<TournamentToolbar
						mode="profile"
						filters={filterConfig}
						onFilterChange={handleFilterChange as (name: string, value: string) => void}
						// categories removed
						showUserFilter={profileProps.showUserFilter}
						showSelectionFilter={!!profileProps.selectionStats}
						userOptions={profileProps.userOptions}
					/>
				</div>
			</section>

			{/* Actions */}
			<section className={cn("w-full flex justify-end gap-2 px-2")}>
				{(() => {
					// Intelligent button logic based on selection count
					if (selectedNames.length === 0) {
						return (
							<Button
								variant="secondary"
								size="small"
								onClick={() => {
									// Scroll to top to encourage selection
									document
										.querySelector('[data-component="name-grid"]')
										?.scrollIntoView({ behavior: "smooth" });
								}}
								className="font-medium whitespace-nowrap"
							>
								Select Names
							</Button>
						);
					}

					// Names selected - show view option
					return (
						<Button
							variant="primary"
							size="small"
							onClick={() => {
								// Could implement a modal or detailed view of selected names
								console.log("View selected names:", selectedNames);
							}}
							className="font-medium whitespace-nowrap"
						>
							View Selected ({selectedNames.length})
						</Button>
					);
				})()}
			</section>

			{/* Bulk Actions Extension */}
			{extensions.bulkActions && (
				<section className={cn("w-full flex justify-end gap-2 px-2")}>
					{extensions.bulkActions &&
						React.createElement(extensions.bulkActions, {
							onExport: () => {
								console.log("Export", names.length, "names");
							},
						})}
				</section>
			)}

			{/* Name Grid */}
			<section className={cn("w-full flex-1")}>
				<NameGrid
					names={names}
					selectedNames={selectedNames}
					onToggleName={toggleName}
					filters={filterConfig}
					isAdmin={!!profileProps.isAdmin}
					onToggleVisibility={
						profileProps.onToggleVisibility
							? (id: string | number) => {
									profileProps.onToggleVisibility?.(String(id)).catch(console.error);
								}
							: undefined
					}
					onDelete={
						profileProps.onDelete
							? (name: NameItem) => {
									profileProps.onDelete?.(name).catch(console.error);
								}
							: undefined
					}
					showCatPictures={showCatPictures}
					imageList={imageList}
					isLoading={isLoading}
					className="min-h-[400px]"
				/>
			</section>

			{/* Navbar Extension */}
			{extensions.navbar && (
				<div className={cn("fixed bottom-0 left-0 right-0 z-50 pointer-events-none")}>
					<div className={cn("pointer-events-auto")}>
						{typeof extensions.navbar === "function" ? extensions.navbar() : extensions.navbar}
					</div>
				</div>
			)}
		</div>
	);
}

import React from "react";

// Shared test utilities for eliminating duplication across test files

// Framer Motion Props that should not be passed to DOM elements
export const FRAMER_MOTION_PROPS = new Set([
	"layout",
	"dragConstraints",
	"dragElastic",
	"whileHover",
	"whileTap",
	"initial",
	"animate",
	"exit",
	"variants",
	"transition",
	"drag",
	"dragDirectionLock",
	"dragMomentum",
	"dragPropagation",
	"dragSnapToOrigin",
	"layoutId",
	"layoutDependency",
	"onDrag",
	"onDragStart",
	"onDragEnd",
	"onHoverStart",
	"onHoverEnd",
	"onTap",
	"onTapStart",
	"onTapCancel",
]);

// Framer Motion mock factory - creates filtered element components
export const createFramerMotionMock = () => {
	const createFilteredElement =
		(Tag: React.ElementType) =>
		({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
			// Filter out framer-motion specific props
			const domProps = Object.fromEntries(
				Object.entries(props).filter(([key]) => !FRAMER_MOTION_PROPS.has(key)),
			);
			return React.createElement(Tag, domProps, children);
		};

	return {
		motion: {
			div: createFilteredElement("div"),
			h1: createFilteredElement("h1"),
			p: createFilteredElement("p"),
			button: createFilteredElement("button"),
		},
		AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
	};
};

// Enhanced Framer Motion mock with drag simulation for interactive components
export const createEnhancedFramerMotionMock = () => {
	const createFilteredElement =
		(Tag: React.ElementType) =>
		({
			children,
			onDragEnd,
			onClick,
			...props
		}: React.PropsWithChildren<
			Record<string, unknown> & {
				onDragEnd?: (event: unknown, info: { offset: { x: number; y: number } }) => void;
				onClick?: (e: React.MouseEvent) => void;
			}
		>) => {
			// Filter out framer-motion specific props
			const domProps = Object.fromEntries(
				Object.entries(props).filter(([key]) => !FRAMER_MOTION_PROPS.has(key)),
			);

			return React.createElement(
				Tag,
				{
					...domProps,
					"data-testid": "motion-div",
					onClick: (e: React.MouseEvent) => {
						// Meta Key = Simulate Swipe Right (+150px)
						if (e.metaKey && onDragEnd) {
							onDragEnd(e, { offset: { x: 150, y: 0 } });
							return;
						}
						// Alt Key = Simulate Swipe Left (-150px)
						if (e.altKey && onDragEnd) {
							onDragEnd(e, { offset: { x: -150, y: 0 } });
							return;
						}
						// Normal Click
						if (onClick) {
							onClick(e);
						}
					},
				},
				children,
			);
		};

	return {
		motion: {
			div: createFilteredElement,
		},
		AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
	};
};

// Common mock objects
export const createCommonMocks = () => ({
	// Auth hooks mock
	authHooks: {
		useLoginController: () => ({
			name: "",
			isLoading: false,
			error: null,
			handleNameChange: vi.fn(),
			handleSubmit: vi.fn(),
			handleRandomName: vi.fn(),
			handleKeyDown: vi.fn(),
			handleBlur: vi.fn(),
			catFact: "Cats are great",
			nameSchema: {},
			touched: {},
		}),
		useEyeTracking: () => ({ x: 0, y: 0 }),
		useCatFact: () => "Cats rule",
	},

	// Tournament controller mock
	tournamentController: {
		currentView: "setup",
		isEditingName: false,
		tempName: "",
		setTempName: vi.fn(),
		showAllPhotos: false,
		setShowAllPhotos: vi.fn(),
		galleryImages: [],
		isAdmin: false,
		activeUser: "User",
		stats: {},
		selectionStats: {},
		handleNameSubmit: vi.fn(),
		toggleEditingName: vi.fn(),
		handleImageOpen: vi.fn(),
		handleImagesUploaded: vi.fn(),
		handleLightboxNavigate: vi.fn(),
		handleLightboxClose: vi.fn(),
		fetchSelectionStats: vi.fn(),
		showSuccess: vi.fn(),
		showError: vi.fn(),
		showToast: vi.fn(),
		handlersRef: { current: {} },
		ToastContainer: () => <div>ToastContainer</div>,
	},

	// Component mocks
	components: {
		NameManagementView: ({
			onStartTournament,
		}: {
			onStartTournament?: (names: unknown[]) => void;
		}) => <button onClick={() => onStartTournament?.([])}>Start Tournament Utils</button>,
		Input: ({
			error: _error,
			showSuccess: _showSuccess,
			...props
		}: Record<string, unknown>) => <input data-testid="input" {...props} />,
	},

	// Context mocks
	contexts: {
		useNameManagementContextOptional: () => ({
			names: [],
			isLoading: false,
			isError: false,
			error: null,
			dataError: null,
			refetch: vi.fn(),
			clearErrors: vi.fn(),
			setNames: vi.fn(),
			setHiddenIds: vi.fn(),
			selectedNames: [],
			selectedIds: new Set(),
			isSelectionMode: false,
			setIsSelectionMode: vi.fn(),
			toggleName: vi.fn(),
			toggleNameById: vi.fn(),
			toggleNamesByIds: vi.fn(),
			clearSelection: vi.fn(),
			selectAll: vi.fn(),
			isSelected: vi.fn(() => false),
			selectedCount: 0,
			searchQuery: "",
			setSearchQuery: vi.fn(),
			filterStatus: "all",
			setFilterStatus: vi.fn(),
			sortBy: "name",
			setSortBy: vi.fn(),
			sortOrder: "asc",
			setSortOrder: vi.fn(),
			visibleNames: [],
			hiddenIds: new Set(),
			hasHiddenNames: false,
			totalCount: 0,
			visibleCount: 0,
			hiddenCount: 0,
			fetchNames: vi.fn(),
			toggleVisibility: vi.fn(),
			deleteName: vi.fn(),
			updateName: vi.fn(),
			createName: vi.fn(),
		}),
	},
});

// Test setup utilities
export const createTestSetup = (_testName: string) => ({
	beforeEach: (setupFn?: () => void) => {
		beforeEach(() => {
			vi.clearAllMocks();
			if (setupFn) {
				setupFn();
			}
		});
	},

	createDefaultProps: <T extends Record<string, unknown>>(defaults: T) => defaults,
});

// Re-export common testing utilities
export { fireEvent, render, screen } from "@testing-library/react";
export { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

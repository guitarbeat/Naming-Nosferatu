// Shared test utilities for eliminating duplication across test files

import { vi } from "vitest";

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

// Utility function to filter out framer-motion specific props
export const filterFramerMotionProps = (props: Record<string, any>) => {
	return Object.fromEntries(Object.entries(props).filter(([key]) => !FRAMER_MOTION_PROPS.has(key)));
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
		ToastContainer: () => null,
	},

	// Component mocks
	components: {
		NameManagementView: ({ onStartTournament: _onStartTournament }: any) => null,
		ValidatedInput: ({ externalError: _externalError, externalTouched: _externalTouched }: any) =>
			null,
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

// Re-export common testing utilities
export { fireEvent, render, screen } from "@testing-library/react";
export { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

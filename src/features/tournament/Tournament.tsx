import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
	type KeyboardEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { ErrorComponent } from "@/shared/components/layout/Feedback/ErrorBoundary";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { getRandomCatImage } from "@/shared/lib/media";
import { getVisibleNames } from "@/shared/lib/names/nameFilters";
import type { TournamentProps } from "@/shared/types";
import useAppStore from "@/store/appStore";
import { MatchSideCard } from "./components/MatchSideCard";
import { TournamentAnnouncements } from "./components/TournamentAnnouncements";
import { TournamentComplete } from "./components/TournamentComplete";
import { TournamentHeader } from "./components/TournamentHeader";
import { useAudioManager } from "./hooks/useAudioManager";
import { useTournamentState } from "./hooks/useTournamentState";
import type { StreakBurst } from "./types/announcements";
import { getHeatLevel, type HeatLevel, STREAK_THRESHOLDS } from "./utils/heat";
import {
	extractMatchData,
	getMatchSideId,
	normalizeParticipant,
} from "./utils/matchHelpers";
import { useTimedState } from "./utils/useTimedState";

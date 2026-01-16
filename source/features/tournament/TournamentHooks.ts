import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { TOURNAMENT_TIMING } from "../../core/constants";
import { useTournament } from "../../core/hooks/tournamentHooks";
import { shuffleArray } from "../../shared/utils";
import type { NameItem, VoteData } from "../../types/components";
import { useProfile } from "../../core/hooks/useProfile";
import { useProfileNotifications } from "../../core/hooks/useProfileNotifications";
import { useAdminStatus } from "../../shared/hooks/useAppHooks";
import { useLightboxState } from "../../shared/hooks/useLightboxState";
import { useImageGallery } from "../../shared/components/Gallery";

/* =========================================================================
   CORE TOURNAMENT STATE HOOK
   ========================================================================= */

export function useTournamentState(
    names: NameItem[] | null | undefined,
    existingRatings: Record<string, number> | null | undefined,
    onComplete: (ratings: Record<string, number>) => void,
    _onVote: (winner: NameItem, loser: NameItem) => void,
) {
    const [randomizedNames, setRandomizedNames] = useState<NameItem[]>([]);
    const [selectedOption, setSelectedOption] = useState<"left" | "right" | "both" | "neither" | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastMatchResult, setLastMatchResult] = useState<string | null>(null);
    const [showMatchResult, setShowMatchResult] = useState(false);
    const [showBracket, setShowBracket] = useState(false);
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
    const [showRoundTransition, setShowRoundTransition] = useState(false);
    const [nextRoundNumber, setNextRoundNumber] = useState<number | null>(null);
    const [votingError, setVotingError] = useState<unknown>(null);

    const namesIdentity = useMemo(() => (Array.isArray(names) ? names.map((n) => n.id || n.name).join(",") : ""), [names]);

    useEffect(() => {
        if (Array.isArray(names) && names.length > 0) {
            setRandomizedNames((prev) => {
                const prevIds = Array.isArray(prev) ? prev.map((n) => n.id || n.name).join(",") : "";
                return prevIds === namesIdentity ? prev : shuffleArray([...names]);
            });
        }
    }, [names, namesIdentity]);

    const convertedRatings = useMemo(() => existingRatings ? Object.fromEntries(
        Object.entries(existingRatings).map(([key, value]) => [key, typeof value === "number" ? { rating: value } : value])
    ) : {}, [existingRatings]);

    const tournament = useTournament({
        names: randomizedNames.map(n => ({ id: String(n.id || n.name || ""), name: String(n.name || ""), description: n.description as string })),
        existingRatings: convertedRatings as any,
        onComplete: (results) => {
            const ratings = Object.fromEntries(results.map(r => [r.name, { rating: r.rating, wins: r.wins, losses: r.losses }]));
            onComplete(ratings as any);
        }
    });

    useEffect(() => {
        if (tournament.roundNumber > 1) {
            setShowRoundTransition(true);
            setNextRoundNumber(tournament.roundNumber);
            const timer = setTimeout(() => {
                setShowRoundTransition(false);
                setNextRoundNumber(null);
            }, TOURNAMENT_TIMING.ROUND_TRANSITION_DELAY);
            return () => clearTimeout(timer);
        }
    }, [tournament.roundNumber]);

    return {
        randomizedNames, selectedOption, setSelectedOption, isTransitioning, setIsTransitioning,
        isProcessing, setIsProcessing, lastMatchResult, setLastMatchResult, showMatchResult, setShowMatchResult,
        showBracket, setShowBracket, showKeyboardHelp, setShowKeyboardHelp, showRoundTransition, nextRoundNumber, votingError, setVotingError,
        handleVote: async (option: "left" | "right" | "both" | "neither") => {
            if (!tournament.handleVote) return;
            const winnerMap = { left: "left", right: "right", both: "both", neither: "neither" };
            const typeMap = { left: "normal", right: "normal", both: "both", neither: "neither" };
            return tournament.handleVote(winnerMap[option], typeMap[option]);
        },
        tournament
    };
}

/* =========================================================================
   TOURNAMENT MANAGER HOOK
   ========================================================================= */

export function useTournamentManager({
    userName,
    onNameChange,
    enableAnalysisMode,
    existingRatings = {},
    onComplete,
    audioManager,
}: {
    userName: string;
    onNameChange?: (name: string) => void;
    enableAnalysisMode?: boolean;
    existingRatings?: Record<string, number> | null;
    onComplete?: (ratings: Record<string, number>) => void;
    audioManager?: { handleVolumeChange: (type: "music" | "effects", value: number) => void };
}) {
    const [currentView, setCurrentView] = useState<"tournament" | "photos">("tournament");
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(userName);
    const [selectedOption, setSelectedOption] = useState<"left" | "right" | "both" | "neither" | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [votingError, setVotingError] = useState<unknown>(null);
    const [showBracket, setShowBracket] = useState(false);
    const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
    const [showCatPictures, setShowCatPictures] = useState(false);
    const [showAllPhotos, setShowAllPhotos] = useState(false);

    const { galleryImages, addImages } = useImageGallery();
    const { isOpen: lightboxOpen, currentIndex: lightboxIndex, handleOpen: handleImageOpen, handleNavigate: handleLightboxNavigate, handleClose: handleLightboxClose, preloadImages } = useLightboxState({ galleryImages: galleryImages || [] });
    const { isAdmin } = useAdminStatus(userName);
    const { showSuccess, showError, showToast, ToastContainer } = useProfileNotifications();
    const { isAdmin: profileIsAdmin, activeUser, canManageActiveUser, userOptions, userFilter, setUserFilter, stats, selectionStats, fetchSelectionStats } = useProfile(userName, { showSuccess, showError });

    const shouldEnableAnalysisMode = useMemo(() => {
        if (typeof window === "undefined") return !!enableAnalysisMode;
        return !!enableAnalysisMode || new URLSearchParams(window.location.search).get("analysis") === "true";
    }, [enableAnalysisMode]);

    const handleNameSubmit = useCallback((e?: React.FormEvent) => {
        e?.preventDefault();
        if (tempName.trim()) {
            onNameChange?.(tempName.trim());
            setIsEditingName(false);
        }
    }, [tempName, onNameChange]);

    return {
        currentView, setCurrentView, isEditingName, tempName, setTempName, selectedOption, isTransitioning, isProcessing, votingError,
        showBracket, setShowBracket, showKeyboardHelp, setShowKeyboardHelp, showCatPictures, showAllPhotos, setShowAllPhotos,
        lightboxOpen, lightboxIndex, galleryImages, isAdmin, profileIsAdmin, activeUser, canManageActiveUser, userOptions, userFilter,
        setUserFilter, stats, selectionStats, shouldEnableAnalysisMode, preloadImages, handleNameSubmit, toggleEditingName: setIsEditingName,
        handleImageOpen, handleImagesUploaded: addImages, handleLightboxNavigate, handleLightboxClose, fetchSelectionStats,
        showSuccess, showError, showToast, handleEndEarly: async () => {
            setIsProcessing(true);
            await onComplete?.(existingRatings || {});
            setIsProcessing(false);
        },
        handleVoteRetry: () => setVotingError(null),
        handleDismissError: () => setVotingError(null),
        handleToggleBracket: () => setShowBracket(p => !p),
        handleToggleKeyboardHelp: () => setShowKeyboardHelp(p => !p),
        handleToggleCatPictures: () => setShowCatPictures(p => !p),
        handleVolumeChange: (type: "music" | "effects", value: number) => audioManager?.handleVolumeChange(type, value),
        ToastContainer
    };
}

/* =========================================================================
   INTERACTION HOOKS
   ========================================================================= */

export function useAudioManager() {
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(0.2);
    return {
        playAudioTrack: () => { },
        isMuted, handleToggleMute: () => setIsMuted(p => !p),
        handleNextTrack: () => { },
        isShuffle: false, handleToggleShuffle: () => { },
        currentTrack: null, trackInfo: null, audioError: null, retryAudio: () => { },
        volume, handleVolumeChange: (_: any, v: number) => setVolume(Math.min(1, Math.max(0, v)))
    };
}

export function useKeyboardControls(
    selectedOption: string | null,
    isProcessing: boolean,
    isTransitioning: boolean,
    isMuted: boolean | undefined,
    handleVoteWithAnimation: ((option: "left" | "right" | "both" | "neither") => void) | undefined,
    options: { onSelectLeft?: () => void; onSelectRight?: () => void; onClearSelection?: () => void; onToggleHelp?: () => void; onUndo?: () => void; onToggleCatPictures?: () => void; onToggleMute?: () => void } = {}
) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isProcessing || isTransitioning) return;
            const { key } = e;
            if (key === "ArrowLeft") { e.preventDefault(); options.onSelectLeft?.(); }
            else if (key === "ArrowRight") { e.preventDefault(); options.onSelectRight?.(); }
            else if (key === "ArrowUp") { e.preventDefault(); handleVoteWithAnimation?.("both"); }
            else if (key === "ArrowDown") { e.preventDefault(); handleVoteWithAnimation?.("neither"); }
            else if (key === "Enter" && selectedOption) handleVoteWithAnimation?.(selectedOption as any);
            else if (key === "Escape") options.onClearSelection?.();
            else if (key === "h" || key === "H") options.onToggleHelp?.();
            else if (key === "u" || key === "U") options.onUndo?.();
            else if (key === "c" || key === "C") options.onToggleCatPictures?.();
            else if ((key === "m" || key === "M") && typeof isMuted === "boolean") options.onToggleMute?.();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedOption, isProcessing, isTransitioning, isMuted, handleVoteWithAnimation, options]);
}

export function useMagneticPull(
    leftOrbRef: React.RefObject<HTMLElement | null>,
    rightOrbRef: React.RefObject<HTMLElement | null>,
    enabled = true
) {
    const transformRef = useRef({ left: "", right: "" });
    useEffect(() => {
        if (!enabled) {
            if (leftOrbRef.current) leftOrbRef.current.style.transform = "";
            if (rightOrbRef.current) rightOrbRef.current.style.transform = "";
            return;
        }
        const handleMouseMove = (e: MouseEvent) => {
            const xAxis = (window.innerWidth / 2 - e.pageX) / 40;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 40;
            transformRef.current.left = `translate(${-xAxis}px, ${-yAxis}px)`;
            transformRef.current.right = `translate(${xAxis}px, ${yAxis}px)`;
            if (leftOrbRef.current) leftOrbRef.current.style.transform = transformRef.current.left;
            if (rightOrbRef.current) rightOrbRef.current.style.transform = transformRef.current.right;
        };
        document.addEventListener("mousemove", handleMouseMove);
        return () => document.removeEventListener("mousemove", handleMouseMove);
    }, [enabled, leftOrbRef, rightOrbRef]);
}

/* =========================================================================
   VOTING LOGIC HOOK
   ========================================================================= */

export function useTournamentVote({
    isProcessing, isTransitioning, isError, currentMatch, handleVote, onVote, audioManager, setIsProcessing, setIsTransitioning,
    setSelectedOption, setVotingError, setLastMatchResult, setShowMatchResult, setUndoExpiresAt, showSuccess, showError
}: any) {
    const lastVoteTimeRef = useRef(0);

    const handleVoteWithAnimation = useCallback(async (option: "left" | "right" | "both" | "neither") => {
        if (isProcessing || isTransitioning || isError || (Date.now() - lastVoteTimeRef.current < TOURNAMENT_TIMING.VOTE_COOLDOWN)) return;
        lastVoteTimeRef.current = Date.now();
        try {
            setIsProcessing(true);
            setIsTransitioning(true);
            audioManager.playAudioTrack();

            const rawRatings = await handleVote(option);
            if (!rawRatings) {
                setIsProcessing(false); setIsTransitioning(false); return;
            }

            if (onVote && currentMatch) {
                await onVote({
                    match: {
                        left: { name: currentMatch.left?.name || currentMatch.left, outcome: option === "left" || option === "both" ? "win" : "loss" },
                        right: { name: currentMatch.right?.name || currentMatch.right, outcome: option === "right" || option === "both" ? "win" : "loss" }
                    },
                    result: option === "left" ? -1 : option === "right" ? 1 : 0.5,
                    timestamp: new Date().toISOString()
                });
            }

            setSelectedOption(null);
            setTimeout(() => { setIsProcessing(false); setIsTransitioning(false); }, 800);
        } catch (e) {
            setIsProcessing(false); setIsTransitioning(false); setVotingError(e);
        }
    }, [isProcessing, isTransitioning, isError, handleVote, audioManager, onVote, currentMatch, setIsProcessing, setIsTransitioning, setSelectedOption, setVotingError]);

    return { handleVoteWithAnimation };
}

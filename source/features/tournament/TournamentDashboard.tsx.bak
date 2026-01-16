import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Plus, Calendar } from "lucide-react";
import { TabContainer } from "../../shared/components/TabContainer";
import { Toast } from "../../shared/components/Toast";
import { useToast } from "../../shared/hooks/useAppHooks";
import { AnalysisDashboard } from "../analytics/AnalysisDashboard";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import Bracket from "../../../shared/components/Bracket";
import { CollapsibleHeader, CollapsibleContent } from "../../../shared/components/CollapsibleHeader";
import { devError } from "../../../shared/utils";
import type { NameItem } from "../../../types/components";
import { RankingAdjustment } from "./TournamentViews";
import styles from "./tournament.module.css";

/* =========================================================================
   COMPONENTS
   ========================================================================= */

const PersonalResults = ({ personalRatings, currentTournamentNames, voteHistory, onStartNew, onUpdateRatings, userName }: any) => {
    const [rankings, setRankings] = useState<any[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        if (!personalRatings) return;
        const processed = Object.entries(personalRatings).map(([name, rating]: any) => ({
            name,
            rating: Math.round(typeof rating === "number" ? rating : rating?.rating || 1500),
            wins: rating?.wins || 0,
            losses: rating?.losses || 0,
            id: currentTournamentNames.find((n: any) => n.name === name)?.id
        })).sort((a, b) => b.rating - a.rating);
        setRankings(processed);
    }, [personalRatings]);

    return (
        <div className={styles.personalResults}>
            <div className={styles.statsGrid}>
                <Card.Stats title="Winner" value={rankings[0]?.name || "-"} emoji="🏆" />
                <Card.Stats title="Top Score" value={rankings[0]?.rating || 1500} emoji="⭐" />
                <Card.Stats title="Total Names" value={rankings.length} emoji="📝" />
            </div>

            <RankingAdjustment rankings={rankings} onSave={async (r: any) => { await onUpdateRatings(r); showToast({ message: "Updated!", type: "success" }); }} onCancel={onStartNew} />

            <div className={styles.actions} style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
                <Button onClick={onStartNew} startIcon={<Plus />}>Start New</Button>
                <Button variant="secondary" startIcon={<Calendar />} onClick={() => window.alert("Calendar export coming soon!")}>Export</Button>
            </div>
        </div>
    );
};

export default function TournamentDashboard({ personalRatings, currentTournamentNames, voteHistory, onStartNew, onUpdateRatings, userName, mode = "both" }: any) {
    const { toasts, removeToast } = useToast({ maxToasts: 1 });
    const hasPersonalData = personalRatings && Object.keys(personalRatings).length > 0;

    const tabs = useMemo(() => [
        {
            key: "personal",
            label: "My Results",
            icon: <span>🏆</span>,
            content: <PersonalResults personalRatings={personalRatings} currentTournamentNames={currentTournamentNames} voteHistory={voteHistory} onStartNew={onStartNew} onUpdateRatings={onUpdateRatings} userName={userName} />,
            disabled: !hasPersonalData && mode !== "personal"
        },
        {
            key: "global",
            label: "Global",
            icon: <span>🌍</span>,
            content: <AnalysisDashboard userName={userName} showGlobalLeaderboard />
        }
    ].filter(t => mode === "both" || t.key === mode), [mode, hasPersonalData, personalRatings, currentTournamentNames, userName]);

    return (
        <>
            <TabContainer tabs={tabs} defaultActiveTab={hasPersonalData ? "personal" : "global"} title="Tournament Dashboard" subtitle={`Welcome, ${userName}`} />
            <Toast variant="container" toasts={toasts} removeToast={removeToast} position="bottom-right" />
        </>
    );
}

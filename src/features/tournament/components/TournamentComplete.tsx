import { LogOut, Trophy } from "@/shared/lib/icons";

interface TournamentCompleteProps {
        totalMatches: number;
        participantCount: number;
        onNewTournament: () => void;
}

export function TournamentComplete({
        totalMatches,
        participantCount,
        onNewTournament,
}: TournamentCompleteProps) {
        return (
                <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-16 text-foreground selection:bg-primary/30 sm:px-8 lg:px-10">
                        <div
                                className="pointer-events-none absolute inset-0"
                                aria-hidden="true"
                                style={{
                                        background: `
                                                radial-gradient(ellipse 60% 45% at 25% 20%, hsl(142 50% 14% / 0.22) 0%, transparent 60%),
                                                radial-gradient(ellipse 50% 40% at 75% 75%, hsl(190 55% 16% / 0.18) 0%, transparent 55%)
                                        `,
                                }}
                        />
                        <div
                                className="pointer-events-none absolute inset-0 opacity-70"
                                aria-hidden="true"
                                style={{
                                        background: `
                                                radial-gradient(circle at 50% 24%, hsl(180 45% 12% / 0.28) 0%, transparent 42%),
                                                radial-gradient(circle at 18% 78%, hsl(142 42% 11% / 0.16) 0%, transparent 30%),
                                                radial-gradient(circle at 82% 72%, hsl(24 48% 14% / 0.12) 0%, transparent 28%)
                                        `,
                                }}
                        />

                        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
                                <div className="mb-8 flex size-20 items-center justify-center rounded-[1.75rem] border border-primary/20 bg-primary/10 shadow-[0_0_48px_rgba(45,212,191,0.14)] backdrop-blur-xl">
                                        <Trophy className="size-9 text-primary" />
                                </div>

                                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35">
                                        Tournament finished
                                </p>

                                <h1 className="mt-4 max-w-4xl text-pretty font-display text-[clamp(3rem,10vw,6.5rem)] font-black uppercase leading-[0.9] tracking-[-0.05em] text-white">
                                        Tournament Complete
                                </h1>

                                <p className="mt-5 max-w-xl text-balance text-sm leading-relaxed text-white/48 sm:text-base">
                                        Your results are ready to review in the analysis section below.
                                </p>

                                <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-6 py-5 text-left shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Total matches</p>
                                                <p className="mt-3 text-4xl font-black leading-none text-white">{totalMatches}</p>
                                        </div>
                                        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-6 py-5 text-left shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">Participants</p>
                                                <p className="mt-3 text-4xl font-black leading-none text-white">{participantCount}</p>
                                        </div>
                                </div>

                                <div className="mt-10 flex w-full max-w-2xl flex-col gap-3">
                                        <button
                                                type="button"
                                                onClick={() => document.getElementById("analysis")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                                                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-primary/25 bg-primary/12 px-6 py-4 text-sm font-semibold text-primary transition-all hover:border-primary/35 hover:bg-primary/18 active:scale-[0.98]"
                                        >
                                                <Trophy size={15} />
                                                View Analysis
                                        </button>

                                        <button
                                                type="button"
                                                onClick={onNewTournament}
                                                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-medium text-white/60 transition-all hover:border-white/15 hover:bg-white/[0.05] hover:text-white/80 active:scale-[0.98]"
                                        >
                                                <LogOut size={15} />
                                                Start New Tournament
                                        </button>
                                </div>
                        </div>
                </div>
        );
}

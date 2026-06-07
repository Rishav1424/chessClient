import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy } from "lucide-react";
import { type UserStats } from "@/types";
import { cn } from "@/lib/utils";

interface MobileStatisticsCardProps {
    stats: UserStats;
    isLoadingData: boolean;
    className?: string;
}

export const MobileStatisticsCard: React.FC<MobileStatisticsCardProps> = ({ stats, isLoadingData, className }) => {
    const winAsWhite = stats?.winAsWhite ?? 0;
    const winAsBlack = stats?.winAsBlack ?? 0;
    const loseAsWhite = stats?.loseAsWhite ?? 0;
    const loseAsBlack = stats?.loseAsBlack ?? 0;
    const drawAsWhite = stats?.drawAsWhite ?? 0;
    const drawAsBlack = stats?.drawAsBlack ?? 0;

    const totalWins = winAsWhite + winAsBlack;
    const totalLosses = loseAsWhite + loseAsBlack;
    const totalDraws = drawAsWhite + drawAsBlack;
    const totalGames = totalWins + totalLosses + totalDraws;

    const winPercent = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
    const drawPercent = totalGames > 0 ? Math.round((totalDraws / totalGames) * 100) : 0;
    const lossPercent = totalGames > 0 ? Math.round((totalLosses / totalGames) * 100) : 0;

    return (
        <Card className={cn("shadow-md bg-card/50", className)}>
            <CardHeader className="bg-muted/50 py-4">
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="text-primary" /> Stats Overview
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoadingData ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex flex-col w-full gap-2">
                        {/* Win Rate & Total Games Info */}
                        <div className="flex justify-between items-baseline">
                            <div>
                                <span className="text-2xl font-black text-foreground">{winPercent}%</span>
                                <span className="text-xs text-muted-foreground font-bold uppercase ml-1.5">Win Rate</span>
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground">{totalGames} games</span>
                        </div>

                        {/* Proportional Horizontal Bar */}
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
                            {totalGames === 0 ? (
                                <div className="w-full h-full bg-muted-foreground/20" />
                            ) : (
                                <>
                                    {totalWins > 0 && (
                                        <div
                                            style={{
                                                width: `${(totalWins / totalGames) * 100}%`,
                                                "--theme": "var(--win)"
                                            } as React.CSSProperties}
                                            className="h-full bg-[hsl(from_var(--theme)_h_s_15/0.25)] border last:border-r-0 border-[hsl(from_var(--theme)_h_100_l/0.5)] transition-all duration-500"
                                            title={`Wins: ${totalWins} (${winPercent}%)`}
                                        />
                                    )}
                                    {totalDraws > 0 && (
                                        <div
                                            style={{
                                                width: `${(totalDraws / totalGames) * 100}%`,
                                                "--theme": "var(--draw)"
                                            } as React.CSSProperties}
                                            className="h-full bg-[hsl(from_var(--theme)_h_s_15/0.25)] border last:border-r-0 border-[hsl(from_var(--theme)_h_100_l/0.5)] transition-all duration-500"
                                            title={`Draws: ${totalDraws} (${drawPercent}%)`}
                                        />
                                    )}
                                    {totalLosses > 0 && (
                                        <div
                                            style={{
                                                width: `${(totalLosses / totalGames) * 100}%`,
                                                "--theme": "var(--loss)"
                                            } as React.CSSProperties}
                                            className="h-full bg-[hsl(from_var(--theme)_h_s_15/0.25)] border last:border-r-0 border-[hsl(from_var(--theme)_h_100_l/0.5)] transition-all duration-500"
                                            title={`Losses: ${totalLosses} (${lossPercent}%)`}
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        {/* Custom Row Labels */}
                        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mt-0.5">
                            <div className="flex items-center gap-1.5" style={{ "--theme": "var(--win)" } as React.CSSProperties}>
                                <span className="w-2 h-2 rounded-full bg-[hsl(from_var(--theme)_h_s_50)] shrink-0" />
                                <span>Wins: <strong className="text-foreground font-bold">{totalWins}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5" style={{ "--theme": "var(--draw)" } as React.CSSProperties}>
                                <span className="w-2 h-2 rounded-full bg-[hsl(from_var(--theme)_h_s_50)] shrink-0" />
                                <span>Draws: <strong className="text-foreground font-bold">{totalDraws}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5" style={{ "--theme": "var(--loss)" } as React.CSSProperties}>
                                <span className="w-2 h-2 rounded-full bg-[hsl(from_var(--theme)_h_s_50)] shrink-0" />
                                <span>Losses: <strong className="text-foreground font-bold">{totalLosses}</strong></span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

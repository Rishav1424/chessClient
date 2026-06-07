import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, Gamepad2, Frown, Handshake } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { type UserStats } from "@/types";
import { cn } from "@/lib/utils";

interface StatisticsCardProps {
    stats: UserStats;
    isLoadingData: boolean;
    className?: string;
}

interface StatBoxProps {
    label: string;
    color: string;
    value: number;
    subValue1: number;
    subValue2: number;
    icon: React.ReactNode;
}

const StatBox: React.FC<StatBoxProps> = ({ label, color, value, subValue1, subValue2, icon }) => {
    const style = {
        "--theme": `var(--${color})`,
    } as React.CSSProperties;

    return (
        <div
            style={style}
            className="border rounded-lg py-2 px-4 flex flex-col gap-2 justify-between transition-all min-w-32 shadow-2xs duration-200 bg-[hsl(from_var(--theme)_h_s_25/0.15)] border-[hsl(from_var(--theme)_h_s_l/0.5)] hover:bg-[hsl(from_var(--theme)_h_s_15/0.4)] hover:border-[hsl(from_var(--theme)_h_s_l/0.45)] text-[hsl(from_var(--theme)_h_s_75)]"
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider uppercase opacity-85">{label}</span>
                <div className="p-1.5 rounded-lg text-current bg-[hsl(from_var(--theme)_h_s_l/0.2)]">
                    {icon}
                </div>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-4xl font-extrabold tracking-tight">{value}</span>
                <div className="text-xs flex flex-col items-end opacity-25">
                    <span>as White: {subValue1}</span>
                    <span>as Black: {subValue2}</span>
                </div>
            </div>
        </div>
    );
};

export const StatisticsCard: React.FC<StatisticsCardProps> = ({ stats, isLoadingData, className }) => {
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
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

    return (
        <Card className={cn("shadow-md bg-card/50", className)}>
            <CardHeader className="bg-muted/50 py-4">
                <CardTitle className="flex items-center gap-4">
                    <Trophy className="text-primary" /> Lifetime Statistics
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoadingData ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 w-full">
                        {/* Left Side: Circular Win Rate & Compact Side Stats */}
                        <div className="flex items-center aspect-square rounded-2xl bg-muted/10 border border-border/30 shrink-0">
                            <div className="relative flex items-center justify-center md:size-48 size-32 shrink-0">
                                <ChartContainer className="size-full" config={{
                                    win: {
                                        label: "Win",
                                        color: "var(--win)",
                                    },
                                    loss: {
                                        label: "Loss",
                                        color: "var(--loss)",
                                    },
                                    draw: {
                                        label: "Draw",
                                        color: "var(--draw)",
                                    }
                                }}>
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Pie data={[{
                                            label: "win",
                                            value: stats.winAsWhite + stats.winAsBlack,
                                            fill: "hsl(from var(--win) h s 25 / 0.15)",
                                            stroke: "var(--win)",
                                        }, {
                                            label: "loss",
                                            value: stats.loseAsWhite + stats.loseAsBlack,
                                            fill: "hsl(from var(--loss) h s 25 / 0.15)",
                                            stroke: "var(--loss)",
                                        }, {
                                            label: "draw",
                                            value: stats.drawAsWhite + stats.drawAsBlack,
                                            fill: "hsl(from var(--draw) h s 25 / 0.15)",
                                            stroke: "var(--draw)",
                                        }]}
                                            dataKey="value"
                                            nameKey="label"
                                            innerRadius={40}
                                            outerRadius={80}
                                            strokeWidth={0.5}
                                        />
                                    </PieChart>
                                </ChartContainer>
                                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-extrabold text-foreground">{winRate}%</span>
                                    <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Win Rate</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: 2x2 Grid of Key Stats */}
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <StatBox
                                label="Played"
                                value={totalGames}
                                subValue1={winAsWhite}
                                subValue2={winAsBlack}
                                icon={<Gamepad2 className="w-4 h-4" />}
                                color="muted"
                            />
                            <StatBox
                                label="Wins"
                                value={totalWins}
                                subValue1={winAsWhite}
                                subValue2={winAsBlack}
                                icon={<Trophy className="w-4 h-4" />}
                                color="win"
                            />
                            <StatBox
                                label="Losses"
                                value={totalLosses}
                                subValue1={loseAsWhite}
                                subValue2={loseAsBlack}
                                icon={<Frown className="w-4 h-4" />}
                                color="loss"
                            />
                            <StatBox
                                label="Draws"
                                value={totalDraws}
                                subValue1={drawAsWhite}
                                subValue2={drawAsBlack}
                                icon={<Handshake className="w-4 h-4" />}
                                color="draw"
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

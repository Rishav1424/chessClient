import React from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Swords, Calendar, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import GeneratedAvatar from "@/components/ui/generatedAvatar";
import { type PastGame } from "@/types";
import { cn } from "@/lib/utils";

interface GameHistoryCardProps {
    games: PastGame[];
    isLoadingData: boolean;
    className?: string;
}

export const GameHistoryCard: React.FC<GameHistoryCardProps> = ({ games, isLoadingData, className }) => {
    const navigate = useNavigate();
    const { username } = useAuthStore();

    const getGameResult = (game: PastGame) => {
        if (game.status === "ONGOING" || game.status === null) return "ONGOING";

        const whitePlayer = game.whitePlayerName || (game as any).whitePlayer;
        const isWhitePlayer = whitePlayer === username;
        const status = game?.status.toUpperCase();

        if (status.includes("DRAW") || status.includes("STALEMATE") || status.includes("AGREEMENT")) {
            return "DRAW";
        }

        if (status.includes("WHITE")) {
            return isWhitePlayer ? "WON" : "LOST";
        }

        if (status.includes("BLACK")) {
            return isWhitePlayer ? "LOST" : "WON";
        }

        return "FINISHED";
    };

    return (
        <Card className={cn("shadow-md bg-card/50", className)}>
            <CardHeader className="bg-muted/50 py-4 gap-y-0">
                <CardTitle className="flex items-center gap-4">
                    <Swords className="text-primary" /> Battle History
                </CardTitle>
                {games.length > 0 && (
                    <CardAction>
                        <Badge variant="outline">Last {games.length} Games</Badge>
                    </CardAction>
                )}
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                {isLoadingData ? (
                    <div className="flex items-center justify-center py-20 flex-1">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : games.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-4 gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-bold text-foreground text-sm">No matches found</p>
                            <p className="text-xs text-muted-foreground mt-0.5 mx-auto">
                                Start matchmaking to play your very first battle!
                            </p>
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="h-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/12"></TableHead>
                                    <TableHead className="w-5/12">Opponent</TableHead>
                                    <TableHead className="w-3/12">Duration</TableHead>
                                    <TableHead className="w-1/12">Result</TableHead>
                                    <TableHead className="w-2/12">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {games.map((game) => {
                                    const result = getGameResult(game);
                                    const whitePlayer = game.whitePlayerName || (game as any).whitePlayer;
                                    const blackPlayer = game.blackPlayerName || (game as any).blackPlayer;
                                    const isWhite = whitePlayer === username;
                                    const opponent = isWhite ? blackPlayer : whitePlayer;
                                    const duration = new Date(game.finished).getTime() - new Date(game.started).getTime();
                                    return (
                                        <TableRow key={game.id} className="group">
                                            <TableCell className="px-0 md:px-2">
                                                {/* Side color indicator */}
                                                <div
                                                    className={`w-3 h-3 rounded-full border shadow-sm shrink-0 mx-auto ${isWhite
                                                        ? "bg-white border-slate-300"
                                                        : "bg-slate-900 border-slate-800"
                                                        }`}
                                                    title={isWhite ? "Played as White" : "Played as Black"}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 md:gap-4">
                                                    <GeneratedAvatar seed={opponent} className="size-8 shrink-0" />
                                                    <div className="text-left">
                                                        <span className="truncate font-bold block max-w-[120px] md:max-w-none">{opponent}</span>
                                                        <span className="text-muted-foreground/50 text-[10px] block"> {new Date(game.started).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="flex items-center gap-1 text-muted-foreground text-[10px] md:text-xs tracking-tighter">
                                                    <Clock className="w-3 h-3" />
                                                    {`${(duration / 60000).toFixed(0)}m ${((duration % 60000) / 1000).toFixed(0)}s`}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {result === "WON" && (
                                                    <Badge
                                                        className="bg-[hsl(from_var(--win)_h_s_25/0.15)] text-[hsl(from_var(--win)_h_s_75)] border border-[hsl(from_var(--win)_h_s_l/0.5)] shadow-xs tracking-wide"
                                                    >
                                                        WON
                                                    </Badge>
                                                )}
                                                {result === "LOST" && (
                                                    <Badge
                                                        className="bg-[hsl(from_var(--loss)_h_s_25/0.15)] text-[hsl(from_var(--loss)_h_s_75)] border border-[hsl(from_var(--loss)_h_s_l/0.5)] shadow-xs tracking-wide"
                                                    >
                                                        LOST
                                                    </Badge>
                                                )}
                                                {result === "DRAW" && (
                                                    <Badge
                                                        className="bg-[hsl(from_var(--draw)_h_s_25/0.15)] text-[hsl(from_var(--draw)_h_s_75)] border border-[hsl(from_var(--draw)_h_s_l/0.5)] shadow-xs tracking-wide"
                                                    >
                                                        DRAW
                                                    </Badge>
                                                )}
                                                {result === "ONGOING" && (
                                                    <Badge
                                                        className="bg-[hsl(from_var(--primary)_h_s_25/0.15)] text-[hsl(from_var(--primary)_h_s_75)] border border-[hsl(from_var(--primary)_h_s_l/0.5)] shadow-xs tracking-wide animate-pulse"
                                                    >
                                                        LIVE
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant={result === "ONGOING" ? "default" : "outline"}
                                                    onClick={() => navigate(result === "ONGOING" ? `/game/${game.id}` : `/review/${game.id}`)}
                                                    className="text-[10px]  p-2 rounded-lg group-hover:border-primary/50 group-hover:text-primary transition-all duration-300 cursor-pointer font-normal tracking-tighter"
                                                >
                                                    {result === "ONGOING" ? "Resume" : "Review"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
};

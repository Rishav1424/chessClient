import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHead, TableBody, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Swords, Milestone } from "lucide-react";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface GameHistoryTableProps {
    moves: string[];
    activeMoveIndex?: number;
    onMoveClick?: (index: number) => void;
}

export default function GameHistoryTable({
    moves,
    activeMoveIndex,
    onMoveClick,
}: GameHistoryTableProps) {
    const movesCount = moves.length;
    const lastIndex = movesCount - 1;

    return (
        <Card className="flex-1 bg-card/40 border-border/30 shadow-md flex flex-col min-h-0 overflow-hidden">
            <CardHeader className="py-3.5 bg-muted/30 border-b border-border/20 shrink-0">
                <CardTitle className="flex items-center justify-between text-sm font-bold">
                    <span className="flex items-center gap-2">
                        <Swords className="w-4 h-4 text-primary" /> Match Timeline
                    </span>
                    {movesCount > 0 && (
                        <span className="text-[10px] text-muted-foreground bg-muted-foreground/10 px-2 py-0.5 rounded-full font-mono">
                            {Math.ceil(movesCount / 2)} Full Moves
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-2 min-h-0 flex flex-col">
                {movesCount === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-2 opacity-50">
                        <Milestone className="w-8 h-8 text-muted-foreground/40" />
                        <span className="text-xs text-muted-foreground font-semibold">Match started. Make your first move!</span>
                    </div>
                ) : (
                    <ScrollArea className="flex-1 min-h-0">
                        <Table className="w-full text-center">
                            <TableHeader className="sticky top-0 bg-card z-10 shadow-xs border-b border-border/40">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-12 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">#</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">White</TableHead>
                                    <TableHead className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Black</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {moves.reduce((acc: string[][], _, i) => {
                                    if (i % 2 === 0) acc.push(moves.slice(i, i + 2));
                                    return acc;
                                }, []).map((movePair, index) => {
                                    const wIndex = index * 2;
                                    const bIndex = index * 2 + 1;
                                    const isWhiteActive = activeMoveIndex !== undefined
                                        ? wIndex === activeMoveIndex
                                        : wIndex === lastIndex;
                                    const isBlackActive = activeMoveIndex !== undefined
                                        ? bIndex === activeMoveIndex
                                        : bIndex === lastIndex;

                                    return (
                                        <TableRow key={index} className="hover:bg-muted/5 border-b border-border/10 last:border-0 transition-colors">
                                            <TableCell className="font-mono text-[10px] text-muted-foreground/40 font-bold">{index + 1}.</TableCell>
                                            <TableCell className="py-1.5 px-2">
                                                <Badge
                                                    onClick={() => onMoveClick?.(wIndex)}
                                                    className={cn(
                                                        "font-mono text-xs tracking-tight px-2.5 py-0.5 rounded-md transition-all border-0",
                                                        onMoveClick ? "cursor-pointer hover:bg-primary/30" : "",
                                                        isWhiteActive
                                                            ? "bg-primary/20 text-primary border border-primary/45 shadow-sm font-extrabold scale-105"
                                                            : "bg-muted/30 text-foreground border border-border/30 font-medium"
                                                    )}
                                                >
                                                    {movePair[0]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-1.5 px-2">
                                                {movePair[1] && (
                                                    <Badge
                                                        onClick={() => onMoveClick?.(bIndex)}
                                                        className={cn(
                                                            "font-mono text-xs tracking-tight px-2.5 py-0.5 rounded-md transition-all border-0",
                                                            onMoveClick ? "cursor-pointer hover:bg-primary/30" : "",
                                                            isBlackActive
                                                                ? "bg-primary/20 text-primary border border-primary/45 shadow-sm font-extrabold scale-105"
                                                                : "bg-muted/10 text-muted-foreground border border-border/10 font-medium"
                                                        )}
                                                    >
                                                        {movePair[1]}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        <ScrollBar />
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}

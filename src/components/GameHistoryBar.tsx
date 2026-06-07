import { Badge } from "@/components/ui/badge";
import { Swords } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameHistoryBarProps {
    moves: string[];
    activeMoveIndex?: number;
    onMoveClick?: (index: number) => void;
}

export default function GameHistoryBar({
    moves,
    activeMoveIndex,
    onMoveClick,
}: GameHistoryBarProps) {
    return (
        <div className="w-full flex items-center gap-2 overflow-hidden px-2">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground shrink-0 select-none">
                <Swords className="w-3.5 h-3.5 text-primary" /> Moves
            </div>
            <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                <div className="flex gap-2 items-center">
                    {moves.map((move, index) => {
                        const isActive = activeMoveIndex !== undefined && index === activeMoveIndex;
                        return (
                            <div key={index} className="flex items-center gap-1 font-mono text-xs shrink-0">
                                {index % 2 === 0 && (
                                    <span className="text-[10px] text-muted-foreground/85 font-bold">
                                        {Math.floor(index / 2) + 1}.
                                    </span>
                                )}
                                <Badge
                                    onClick={() => onMoveClick?.(index)}
                                    className={cn(
                                        "font-mono text-xs tracking-tight shadow-xs shrink-0 px-2.5 py-0.5 rounded-md border transition-all select-none",
                                        onMoveClick ? "cursor-pointer" : "",
                                        isActive
                                            ? "bg-primary text-primary-foreground border-primary scale-105 font-bold animate-pulse"
                                            : index % 2 === 0
                                                ? "bg-primary/15 text-primary border-primary/20 hover:bg-primary/25"
                                                : "bg-muted text-muted-foreground border-muted-foreground/15 hover:bg-muted/80"
                                    )}
                                >
                                    {move}
                                </Badge>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
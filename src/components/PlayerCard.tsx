import {
    ChessPawn,
    ChessKnight,
    ChessBishop,
    ChessRook,
    ChessQueen,
    Timer
} from "lucide-react";
import GeneratedAvatar from "@/components/ui/generatedAvatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
    name: string;
    side: "White" | "Black";
    turn: boolean;
    formattedTime?: string;
    isSelf?: boolean;
    capturedPieces?: string[];
    advantage?: number;
}

export default function PlayerCard({
    name,
    side,
    turn,
    formattedTime,
    isSelf = false,
    capturedPieces,
    advantage,
}: PlayerCardProps) {
    const isWhiteCard = side === "White";

    const pieceIcons: Record<string, React.ComponentType<{ className?: string; title?: string }>> = {
        p: ChessPawn,
        n: ChessKnight,
        b: ChessBishop,
        r: ChessRook,
        q: ChessQueen
    };

    return (
        <div className={`flex items-center justify-between p-2 md:p-3.5 rounded-lg border bg-card/50 backdrop-blur-md border-border/40 transition-all duration-300 relative overflow-hidden
            ${isSelf ? "border-l-2 border-l-primary/60" : ""}
            ${turn ? "shadow-md bg-card/85 animate-glow-pulse" : ""}
        `}>
            <div className="flex items-center gap-2.5 md:gap-4 min-w-0 flex-1">
                <GeneratedAvatar seed={name} className="size-9 md:size-11 border border-border/60 rounded-lg shrink-0" />

                <div className="flex flex-col justify-center min-w-0 flex-1">
                    {/* Row 1: Name + You Badge */}
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-sm md:text-base truncate max-w-[120px] sm:max-w-[160px] md:max-w-[190px] shrink-0">
                            {name}
                        </span>
                        {isSelf && (
                            <Badge variant="outline" className="text-[9px] md:text-[10px] h-3.5 md:h-4 px-1 md:px-1.5 shrink-0 select-none">You</Badge>
                        )}
                    </div>

                    {/* Row 2: Side Subtext + Captured Pieces + Advantage */}
                    <div className="flex items-center gap-2 select-none min-w-0 flex-wrap">
                        <span className="text-[9px] md:text-[10px] text-muted-foreground/60 font-black uppercase tracking-wider shrink-0">
                            {side}
                        </span>
                        {capturedPieces && capturedPieces.length > 0 && (
                            <div className="flex items-center -space-x-1 select-none shrink-0 px-2 py-0.5 rounded-md bg-neutral-500 dark:bg-neutral-600">
                                {capturedPieces.map((p, idx) => {
                                    const PieceIcon = pieceIcons[p];
                                    return PieceIcon ? (
                                        <PieceIcon
                                            key={idx}
                                            className={cn(
                                                "size-3 transition-all duration-200 select-none",
                                                isWhiteCard
                                                    ? "text-neutral-950"
                                                    : "text-neutral-50"
                                            )}
                                            title={isWhiteCard ? "Captured Black piece" : "Captured White piece"}
                                        />
                                    ) : null;
                                })}
                            </div>
                        )}

                        {advantage !== undefined && advantage > 0 && (
                            <span className="text-[10px] font-bold text-emerald-500 select-none">
                                +{advantage}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {formattedTime !== undefined && (
                <div
                    className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-md font-mono text-sm md:text-lg font-bold transition-all border duration-300 select-none shrink-0
                        ${turn
                            ? "bg-primary/80 text-foreground border-primary shadow-sm"
                            : "bg-muted/20 text-muted-foreground/40 border-border/20 shadow-inner opacity-65"
                        }
                `}>
                    <Timer className="w-3.5 h-3.5 md:w-5 md:h-5" />
                    <span>{formattedTime}</span>
                </div>
            )}
        </div>
    );
}

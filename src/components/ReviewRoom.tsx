import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { Chess } from "chess.js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuthStore } from "@/store/useAuthStore";
import useApi from "@/hooks/useApi";
import {
    Loader2,
    ArrowLeft,
    RefreshCw,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
    Swords,
} from "lucide-react";
import PlayerCard from "./PlayerCard";
import MoveHistoryTable from "./MoveHistoryTable";
import MoveHistoryBar from "./MoveHistoryBar";
import GameChessboard from "./GameChessboard";
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from "@/lib/audio";
import { calculateCapturedPieces } from "@/lib/chess";

export default function ReviewRoom() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const { username } = useAuthStore();
    const { get } = useApi();

    // The game object used to step through moves

    const [loading, setLoading] = useState<boolean>(true);
    const [moveList, setMoveList] = useState<string[]>([]);
    const [fens, setFens] = useState<string[]>([]);

    // Active Move Index (0 = Starting position, N = Last move played)
    const [activeMoveIndex, setActiveMoveIndex] = useState<number>(0);

    // Settings
    const [isFlipped, setIsFlipped] = useState<boolean>(false);

    const [whitePlayerName, setWhitePlayerName] = useState("White");
    const [blackPlayerName, setBlackPlayerName] = useState("Black");

    const isMobile = useIsMobile();

    useEffect(() => {
        const fetchGameData = async () => {
            if (!gameId) return;
            try {
                const status: any = await get(
                    `/games/${gameId}`,
                );

                console.log("Review room: Game history loaded:", status);

                if (status) {
                    setWhitePlayerName(status.whitePlayerName || status.whitePlayer || "White");
                    setBlackPlayerName(status.blackPlayerName || status.blackPlayer || "Black");

                    const moves = [...(status.moves || [])];
                    setMoveList(moves);

                    // Reconstruct all FENs sequentially
                    const tempGame = new Chess();
                    const generatedFens = [tempGame.fen()];

                    for (const m of moves) {
                        try {
                            tempGame.move(m);
                            generatedFens.push(tempGame.fen());
                        } catch (err) {
                            console.error("Error generating FEN for move", m, err);
                            generatedFens.push(tempGame.fen());
                        }
                    }

                    setFens(generatedFens);
                    setActiveMoveIndex(moves.length); // Start at final position
                    setLoading(false);
                } else {
                    toast.error("Game not found or has expired.");
                    navigate("/dashboard");
                }
            } catch (err) {
                console.error("Error loading review room data", err);
                navigate("/dashboard");
            }
        };
        fetchGameData();
    }, [gameId, get, navigate]);

    // Keyboard Arrow Keys Navigation
    useEffect(() => {
        if (loading || fens.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                setActiveMoveIndex((prev) => Math.max(0, prev - 1));
            } else if (e.key === "ArrowRight") {
                setActiveMoveIndex((prev) => Math.min(fens.length - 1, prev + 1));
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [loading, fens.length]);

    // Audio effects when navigating forward
    const prevIndexRef = useRef(activeMoveIndex);
    useEffect(() => {
        const prev = prevIndexRef.current;
        prevIndexRef.current = activeMoveIndex;

        if (activeMoveIndex === prev + 1 && activeMoveIndex > 0) {
            const move = moveList[activeMoveIndex - 1];
            if (move) {
                if (move.includes("#")) {
                    playGameOverSound("draw"); // Standard game over sound
                } else if (move.includes("+")) {
                    playCheckSound();
                } else if (move.includes("x")) {
                    playCaptureSound();
                } else {
                    playMoveSound();
                }
            }
        }
    }, [activeMoveIndex, moveList]);

    if (loading || fens.length === 0)
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );

    const displayChessGame = useMemo(() => {
        const g = new Chess();
        const fen = fens[activeMoveIndex];
        if (fen) {
            g.load(fen);
        }
        return g;
    }, [activeMoveIndex, fens]);

    const currentPosition = fens[activeMoveIndex];

    const { whiteCaptured, blackCaptured, whiteAdvantage, blackAdvantage } = calculateCapturedPieces(displayChessGame);

    const topPlayerName = isFlipped ? whitePlayerName : blackPlayerName;
    const bottomPlayerName = isFlipped ? blackPlayerName : whitePlayerName;

    return (
        <div className="flex-1 min-h-0 p-2 md:p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 bg-background">
            {/* LEFT SIDE: Chess Board Area (Desktop Only) */}
            {!isMobile && (
                <div className="flex-1 flex items-center justify-center h-full min-h-0">
                    <div className="max-h-full max-w-full aspect-square rounded-lg border-2 border-border/80 shadow-2xl dark:shadow-primary/5 relative overflow-hidden">
                        <GameChessboard
                            id="ReviewMatch"
                            position={currentPosition}
                            boardOrientation={isFlipped ? "black" : "white"}
                            onPieceDrop={() => false}
                            onSquareClick={() => { }}
                            optionSquares={{}}
                            game={displayChessGame}
                        />
                    </div>
                </div>
            )}

            {/* RIGHT SIDE / SIDEBAR (Moves History & Review Controls) */}
            {isMobile ? (
                <div className="w-full h-full flex flex-col gap-2.5 justify-between max-w-md mx-auto py-1">
                    {/* Game Info Bar (Match Details) */}
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-border/40 bg-muted/20 backdrop-blur-md select-none shrink-0">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Swords className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                                Review
                            </span>
                        </div>
                        <div className="font-bold text-[11px] text-foreground truncate px-2 text-center grow">
                            {whitePlayerName} vs {blackPlayerName}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground/80 font-mono shrink-0">
                            Move {activeMoveIndex}/{moveList.length}
                        </div>
                    </div>

                    {/* Top Player */}
                    <PlayerCard
                        name={topPlayerName}
                        side={isFlipped ? "White" : "Black"}
                        turn={isFlipped ? activeMoveIndex % 2 === 0 : activeMoveIndex % 2 === 1}
                        isSelf={topPlayerName === username}
                        capturedPieces={isFlipped ? whiteCaptured : blackCaptured}
                        advantage={isFlipped ? whiteAdvantage : blackAdvantage}
                    />

                    {/* Compact Moves Ribbon */}
                    <MoveHistoryBar
                        moves={moveList}
                        activeMoveIndex={activeMoveIndex - 1}
                        onMoveClick={(flatIndex) => setActiveMoveIndex(flatIndex + 1)}
                    />

                    {/* Board container */}
                    <div className="w-full aspect-square rounded-lg border-2 border-border/80 shadow-xl dark:shadow-primary/5 relative overflow-hidden">
                        <GameChessboard
                            id="ReviewMatchMobile"
                            position={currentPosition}
                            boardOrientation={isFlipped ? "black" : "white"}
                            onPieceDrop={() => false}
                            onSquareClick={() => { }}
                            optionSquares={{}}
                            game={displayChessGame}
                        />
                    </div>

                    {/* Navigation controls */}
                    <div className="flex flex-col gap-2 shrink-0">
                        <div className="flex gap-1.5 w-full">
                            <Button
                                onClick={() => setActiveMoveIndex(0)}
                                variant="outline"
                                className="flex-1 font-bold rounded-lg cursor-pointer py-3 flex items-center justify-center text-xs"
                                disabled={activeMoveIndex === 0}
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={() => setActiveMoveIndex(prev => Math.max(0, prev - 1))}
                                variant="outline"
                                className="flex-1 font-bold rounded-lg cursor-pointer py-3 flex items-center justify-center text-xs"
                                disabled={activeMoveIndex === 0}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={() => setActiveMoveIndex(prev => Math.min(moveList.length, prev + 1))}
                                variant="outline"
                                className="flex-1 font-bold rounded-lg cursor-pointer py-3 flex items-center justify-center text-xs"
                                disabled={activeMoveIndex === moveList.length}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={() => setActiveMoveIndex(moveList.length)}
                                variant="outline"
                                className="flex-1 font-bold rounded-lg cursor-pointer py-3 flex items-center justify-center text-xs"
                                disabled={activeMoveIndex === moveList.length}
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setIsFlipped(prev => !prev)}
                                variant="outline"
                                className="flex-1 font-bold rounded-lg cursor-pointer py-3.5 flex items-center justify-center gap-1 text-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Flip
                            </Button>
                            <Button
                                onClick={() => navigate("/dashboard")}
                                variant="secondary"
                                className="flex-1 font-bold rounded-lg cursor-pointer py-3.5 flex items-center justify-center gap-1 text-xs"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" /> Exit
                            </Button>
                        </div>
                    </div>

                    {/* Bottom Player */}
                    <PlayerCard
                        name={bottomPlayerName}
                        side={isFlipped ? "Black" : "White"}
                        turn={isFlipped ? activeMoveIndex % 2 === 1 : activeMoveIndex % 2 === 0}
                        isSelf={bottomPlayerName === username}
                        capturedPieces={isFlipped ? blackCaptured : whiteCaptured}
                        advantage={isFlipped ? blackAdvantage : whiteAdvantage}
                    />
                </div>
            ) : (
                <div className="w-full lg:w-96 flex flex-col justify-between gap-4 shrink-0 min-h-0 h-full py-2">
                    {/* Top Player */}
                    <PlayerCard
                        name={topPlayerName}
                        side={isFlipped ? "White" : "Black"}
                        turn={isFlipped ? activeMoveIndex % 2 === 0 : activeMoveIndex % 2 === 1}
                        isSelf={topPlayerName === username}
                        capturedPieces={isFlipped ? whiteCaptured : blackCaptured}
                        advantage={isFlipped ? whiteAdvantage : blackAdvantage}
                    />

                    {/* Game Info Bar (Details & Progress) */}
                    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-border/40 bg-muted/20 backdrop-blur-md select-none shrink-0">
                        <div className="flex items-center gap-2">
                            <Swords className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
                                Game Analysis
                            </span>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground/80 font-bold">
                            Move {activeMoveIndex} of {moveList.length}
                        </div>
                    </div>

                    {/* Match Timeline Card */}
                    <MoveHistoryTable
                        moves={moveList}
                        activeMoveIndex={activeMoveIndex - 1}
                        onMoveClick={(flatIndex) => setActiveMoveIndex(flatIndex + 1)}
                    />

                    {/* Navigation Controls */}
                    <div className="flex flex-col gap-2 shrink-0">
                        <div className="flex gap-1.5 w-full">
                            <Button
                                onClick={() => setActiveMoveIndex(0)}
                                variant="outline"
                                className="flex-1 font-bold cursor-pointer"
                                title="Start Position"
                                disabled={activeMoveIndex === 0}
                            >
                                <ChevronsLeft className="w-5 h-5" />
                            </Button>
                            <Button
                                onClick={() => setActiveMoveIndex(prev => Math.max(0, prev - 1))}
                                variant="outline"
                                className="flex-1 font-bold cursor-pointer"
                                title="Previous Move (Left Arrow)"
                                disabled={activeMoveIndex === 0}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <Button
                                onClick={() => setActiveMoveIndex(prev => Math.min(moveList.length, prev + 1))}
                                variant="outline"
                                className="flex-1 font-bold cursor-pointer"
                                title="Next Move (Right Arrow)"
                                disabled={activeMoveIndex === moveList.length}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                            <Button
                                onClick={() => setActiveMoveIndex(moveList.length)}
                                variant="outline"
                                className="flex-1 font-bold cursor-pointer"
                                title="Final Position"
                                disabled={activeMoveIndex === moveList.length}
                            >
                                <ChevronsRight className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setIsFlipped(prev => !prev)}
                                variant="outline"
                                className="flex-1 font-bold cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <RefreshCw className="w-4 h-4" /> Flip Board
                            </Button>
                            <Button
                                onClick={() => navigate("/dashboard")}
                                variant="secondary"
                                className="flex-1 font-bold cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <ArrowLeft className="w-4 h-4" /> Exit Review
                            </Button>
                        </div>
                    </div>

                    {/* Bottom Player */}
                    <PlayerCard
                        name={bottomPlayerName}
                        side={isFlipped ? "Black" : "White"}
                        turn={isFlipped ? activeMoveIndex % 2 === 1 : activeMoveIndex % 2 === 0}
                        isSelf={bottomPlayerName === username}
                        capturedPieces={isFlipped ? blackCaptured : whiteCaptured}
                        advantage={isFlipped ? blackAdvantage : whiteAdvantage}
                    />
                </div>
            )}
        </div>
    );
}

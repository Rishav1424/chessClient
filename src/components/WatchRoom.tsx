import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Chess } from "chess.js";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSocketStore } from "@/store/useSocketStore";
import useApi from "@/hooks/useApi";
import { Loader2, ArrowLeft, Share2, RefreshCw, Eye, Trophy, Swords } from "lucide-react";
import PlayerCard from "./PlayerCard";
import MoveHistoryTable from "./MoveHistoryTable";
import MoveHistoryBar from "./MoveHistoryBar";
import GameChessboard from "./GameChessboard";
import { playGameOverSound } from "@/lib/audio";
import { calculateCapturedPieces } from "@/lib/chess";
import { useGameMoves } from "@/hooks/useGameMoves";
import { useCallback } from "react";

interface GameStatus {
    fen: string;
    whitePlayerName: string;
    blackPlayerName: string;
    whiteTime: string;
    blackTime: string;
    moves: string[];
}

const parseISODuration = (duration: string): number => {
    if (!duration) return 0;
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:.\d+)?)S)?/;
    const matches = duration.match(regex);
    if (!matches) return 0;

    let seconds = 0;
    if (matches[1]) seconds += parseInt(matches[1], 10) * 3600;
    if (matches[2]) seconds += parseInt(matches[2], 10) * 60;
    if (matches[3]) seconds += parseFloat(matches[3]);
    return seconds;
};

const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatEventString = (eventStr: string | null | undefined) => {
    if (!eventStr) return "";
    return eventStr
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function WatchRoom() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const client = useSocketStore((state) => state.client);
    const isConnected: boolean = useSocketStore((state) => state.isConnected);
    const { get } = useApi();

    const chessGameRef = useRef(new Chess());
    const game: Chess = chessGameRef.current;

    const [position, setPosition] = useState<string>(game.fen());
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [turn, setTurn] = useState<"w" | "b">("w");
    const [moveList, setMoveList] = useState<string[]>([]);

    // Spectator settings
    const [isFlipped, setIsFlipped] = useState<boolean>(false);

    const [whitePlayerName, setWhitePlayerName] = useState("White");
    const [blackPlayerName, setBlackPlayerName] = useState("Black");

    const [whiteTime, setWhiteTime] = useState(0);
    const [blackTime, setBlackTime] = useState(0);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogDescription, setDialogDescription] = useState("");

    const isMobile = useIsMobile();
    const gameOverSoundPlayedRef = useRef(false);

    useEffect(() => {
        const fetchGameData = async () => {
            if (!gameId) return;
            try {
                const status: GameStatus | null = await get(
                    `/games/${gameId}/live`,
                );

                console.log("Watch room: Game status loaded:", status);

                if (status) {
                    game.load(status.fen);
                    setPosition(game.fen());
                    setTurn(game.turn() as "w" | "b");

                    setWhitePlayerName(status.whitePlayerName);
                    setBlackPlayerName(status.blackPlayerName);

                    setWhiteTime(parseISODuration(status.whiteTime));
                    setBlackTime(parseISODuration(status.blackTime));
                    setMoveList(status.moves || []);

                    // Check if game is over based on loaded FEN
                    if (game.isGameOver()) {
                        setGameOver(true);
                        gameOverSoundPlayedRef.current = true;
                        if (game.isCheckmate()) {
                            const winner = game.turn() === "w" ? "Black" : "White";
                            setDialogDescription(`Checkmate! Winner: ${winner}`);
                        } else if (game.isDraw()) {
                            setDialogDescription("Draw!");
                        } else {
                            setDialogDescription("Game Over");
                        }
                        setDialogOpen(true);
                    } else {
                        gameOverSoundPlayedRef.current = false;
                    }
                    setLoading(false);
                } else {
                    toast.error("Game not found or has expired.");
                    navigate("/dashboard");
                }
            } catch (err) {
                console.error("Error fetching game data for watch room", err);
                navigate("/dashboard");
            }
        };
        fetchGameData();
    }, [gameId, game, get, navigate]);

    useEffect(() => {
        if (gameOver || loading) return;
        const intervalId = setInterval(() => {
            if (turn === "w") setWhiteTime((prev) => Math.max(0, prev - 1));
            else setBlackTime((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(intervalId);
    }, [turn, gameOver, loading]);

    const handleRemoteMove = useCallback((result: any) => {
        setPosition(game.fen());
        setTurn(game.turn() as "w" | "b");
        setMoveList((prev) => [...prev, result.san]);
    }, [game]);

    useGameMoves(gameId, game, handleRemoteMove);

    useEffect(() => {
        if (!client || !isConnected || !gameId) return;

        const eventSub = client.subscribe(
            `/topic/games/${gameId}/events`,
            (message: { body: string }) => {
                try {
                    const event = JSON.parse(message.body);
                    switch (event.type) {
                        case "GAME_OVER":
                            setGameOver(true);
                            setDialogDescription(formatEventString(event.status));
                            setDialogOpen(true);

                            // Play game over sound based on event outcome
                            if (!gameOverSoundPlayedRef.current) {
                                playGameOverSound("draw");
                                gameOverSoundPlayedRef.current = true;
                            }
                            break;
                        case "DRAW_OFFERED":
                            toast.info(`Draw offered by ${formatEventString(event.by)}.`);
                            break;
                        case "DRAW_DECLINED":
                            toast.info(`Draw offer declined by ${formatEventString(event.by)}.`);
                            break;
                        case "DRAW_EXPIRED":
                            toast.info("Draw offer expired.");
                            break;
                    }
                } catch (err) {
                    console.error("Error parsing game event in WatchRoom:", err);
                }
            },
        );

        return () => {
            eventSub.unsubscribe();
        };
    }, [client, isConnected, gameId]);

    if (loading)
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );

    const { whiteCaptured, blackCaptured, whiteAdvantage, blackAdvantage } = calculateCapturedPieces(game);

    // Map time variables to side
    const topPlayerTimer = isFlipped ? whiteTime : blackTime;
    const bottomPlayerTimer = isFlipped ? blackTime : whiteTime;

    return (
        <div className="flex-1 min-h-0 p-2 md:p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 bg-background">
            {/* LEFT SIDE: Chess Board Area (Desktop Only) */}
            {!isMobile && (
                <div className="flex-1 flex items-center justify-center h-full min-h-0">
                    <div className="max-h-full max-w-full aspect-square rounded-lg border-2 border-border/80 shadow-2xl dark:shadow-primary/5 relative overflow-hidden">
                        <GameChessboard
                            id="WatchMatch"
                            position={position}
                            boardOrientation={isFlipped ? "black" : "white"}
                            onPieceDrop={() => false}
                            onSquareClick={() => { }}
                            optionSquares={{}}
                            game={game}
                        />
                    </div>
                </div>
            )}

            {/* RIGHT SIDE / SIDEBAR (Moves History & Spectator Actions) */}
            {isMobile ? (
                <div className="w-full h-full flex flex-col gap-2.5 justify-between max-w-md mx-auto py-1">
                    {/* Game Info Bar (Connection Status & Watch Room Details) */}
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-border/40 bg-muted/20 backdrop-blur-md select-none shrink-0">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? "bg-emerald-400" : "bg-destructive"}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-emerald-500" : "bg-destructive"}`}></span>
                            </span>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-0.5">
                                <Eye className="w-3 h-3 text-primary animate-pulse" /> Watch
                            </span>
                        </div>
                        <div className="font-bold text-[11px] text-foreground truncate px-2 text-center grow">
                            {whitePlayerName} vs {blackPlayerName}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                title="Copy Watch Link"
                                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/85 transition-colors uppercase cursor-pointer"
                                onClick={() => {
                                    const watchLink = `${window.location.origin}/watch/${gameId}`;
                                    navigator.clipboard.writeText(watchLink);
                                    toast.success("Watch link copied!");
                                }}
                            >
                                <Share2 className="w-3.5 h-3.5" /> Share
                            </button>
                        </div>
                    </div>

                    {/* Top Player */}
                    <PlayerCard
                        name={isFlipped ? whitePlayerName : blackPlayerName}
                        side={isFlipped ? "White" : "Black"}
                        turn={isFlipped ? turn === "w" : turn === "b"}
                        formattedTime={formatTime(topPlayerTimer)}
                        isSelf={false}
                        capturedPieces={isFlipped ? whiteCaptured : blackCaptured}
                        advantage={isFlipped ? whiteAdvantage : blackAdvantage}
                    />

                    {/* Compact Moves Ribbon */}
                    <MoveHistoryBar moves={moveList} />

                    {/* Board container */}
                    <div className="w-full aspect-square rounded-lg border-2 border-border/80 shadow-xl dark:shadow-primary/5 relative overflow-hidden">
                        <GameChessboard
                            id="WatchMatchMobile"
                            position={position}
                            boardOrientation={isFlipped ? "black" : "white"}
                            onPieceDrop={() => false}
                            onSquareClick={() => { }}
                            optionSquares={{}}
                            game={game}
                        />
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <Button
                            onClick={() => setIsFlipped(prev => !prev)}
                            variant="outline"
                            className="flex-1 font-bold rounded-lg cursor-pointer py-3.5 flex items-center justify-center gap-1.5 text-xs"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Flip Board
                        </Button>
                        <Button
                            onClick={() => navigate("/dashboard")}
                            variant="secondary"
                            className="flex-1 font-bold rounded-lg cursor-pointer py-3.5 flex items-center justify-center gap-1.5 text-xs"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Exit Watch
                        </Button>
                    </div>

                    {/* Bottom Player */}
                    <PlayerCard
                        name={isFlipped ? blackPlayerName : whitePlayerName}
                        side={isFlipped ? "Black" : "White"}
                        turn={isFlipped ? turn === "b" : turn === "w"}
                        formattedTime={formatTime(bottomPlayerTimer)}
                        isSelf={false}
                        capturedPieces={isFlipped ? blackCaptured : whiteCaptured}
                        advantage={isFlipped ? blackAdvantage : whiteAdvantage}
                    />
                </div>
            ) : (
                <div className="w-full lg:w-96 flex flex-col justify-between gap-4 shrink-0 min-h-0 h-full py-2">
                    {/* Top Player */}
                    <PlayerCard
                        name={isFlipped ? whitePlayerName : blackPlayerName}
                        side={isFlipped ? "White" : "Black"}
                        turn={isFlipped ? turn === "w" : turn === "b"}
                        formattedTime={formatTime(topPlayerTimer)}
                        isSelf={false}
                        capturedPieces={isFlipped ? whiteCaptured : blackCaptured}
                        advantage={isFlipped ? whiteAdvantage : blackAdvantage}
                    />

                    {/* Game Info Bar (Connection Status & Watch Room Details) */}
                    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-border/40 bg-muted/20 backdrop-blur-md select-none shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? "bg-emerald-400" : "bg-destructive"}`}></span>
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? "bg-emerald-500" : "bg-destructive"}`}></span>
                            </span>
                            <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-primary" /> Spectating
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-muted-foreground/80 font-semibold select-all">
                                ID: {gameId}
                            </span>
                            <div className="h-4 w-px bg-border/40" />
                            <button
                                title="Copy Watch Link"
                                className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors uppercase cursor-pointer"
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.href);
                                    toast.success("Watch link copied to clipboard!");
                                }}
                            >
                                <Share2 className="w-3.5 h-3.5" /> Share
                            </button>
                        </div>
                    </div>

                    {/* Match Timeline Card */}
                    <MoveHistoryTable moves={moveList} />

                    {/* Spectator Controls */}
                    <div className="flex gap-2 shrink-0">
                        <Button
                            onClick={() => setIsFlipped(prev => !prev)}
                            variant="outline"
                            size="lg"
                            className="flex-1 font-bold cursor-pointer flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> Flip Board
                        </Button>
                        <Button
                            onClick={() => navigate("/dashboard")}
                            variant="secondary"
                            size="lg"
                            className="flex-1 font-bold cursor-pointer flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Exit Watch
                        </Button>
                    </div>

                    {/* Bottom Player */}
                    <PlayerCard
                        name={isFlipped ? blackPlayerName : whitePlayerName}
                        side={isFlipped ? "Black" : "White"}
                        turn={isFlipped ? turn === "b" : turn === "w"}
                        formattedTime={formatTime(bottomPlayerTimer)}
                        isSelf={false}
                        capturedPieces={isFlipped ? blackCaptured : whiteCaptured}
                        advantage={isFlipped ? blackAdvantage : whiteAdvantage}
                    />
                </div>
            )}

            {/* Dialogs */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md border border-border/50 bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 overflow-hidden relative">
                    <div className="absolute -inset-10 bg-radial from-amber-500/15 to-transparent blur-3xl pointer-events-none" />

                    <div className="flex flex-col items-center text-center gap-5 relative z-10">
                        {/* Dynamic Icon Header */}
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border animate-bounce bg-amber-500/10 border-amber-500/30 text-amber-500">
                            {dialogDescription.toLowerCase().includes("checkmate") ? (
                                <Trophy className="w-8 h-8" />
                            ) : (
                                <Swords className="w-8 h-8" />
                            )}
                        </div>

                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-wider text-amber-500">
                                Match Finished
                            </h2>
                            <p className="text-muted-foreground text-sm font-semibold mt-1 font-sans">
                                {dialogDescription}
                            </p>
                        </div>

                        {/* Game Statistics Panel */}
                        <div className="w-full bg-muted/40 rounded-xl p-4 border border-border/40 text-left flex flex-col gap-2">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-muted-foreground">Total Moves Played:</span>
                                <span className="text-foreground font-mono">{moveList.length}</span>
                            </div>
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-muted-foreground">White Player:</span>
                                <span className="text-foreground truncate max-w-[150px]">{whitePlayerName}</span>
                            </div>
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-muted-foreground">Black Player:</span>
                                <span className="text-foreground truncate max-w-[150px]">{blackPlayerName}</span>
                            </div>
                        </div>

                        {/* Navigation Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                            <Button
                                size="lg"
                                className="flex-1 font-bold cursor-pointer"
                                onClick={() => navigate(`/review/${gameId}`)}
                            >
                                Analyze Game
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="flex-1 font-bold cursor-pointer"
                                onClick={() => navigate("/dashboard")}
                            >
                                <ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

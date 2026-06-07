import { useEffect, useState, useRef, useCallback, type CSSProperties } from "react";
import { useParams, useNavigate } from "react-router";
import { type PieceDropHandlerArgs, type SquareHandlerArgs } from "react-chessboard";
import { Chess, type Square } from "chess.js";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSocketStore } from "@/store/useSocketStore";
import { useAuthStore } from "@/store/useAuthStore";
import useApi from "@/hooks/useApi";
import { Loader2, Flag, Handshake, ArrowLeft, Share2 } from "lucide-react";
import PlayerCard from "./PlayerCard";
import MoveHistoryTable from "./MoveHistoryTable";
import MoveHistoryBar from "./MoveHistoryBar";
import GameChessboard from "./GameChessboard";
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from "@/lib/audio";
import { calculateCapturedPieces } from "@/lib/chess";
import { useGameMoves } from "@/hooks/useGameMoves";

interface GameStatus {
    fen: string;
    whitePlayer: string;
    blackPlayer: string;
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

export default function GameRoom() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const client = useSocketStore((state) => state.client);
    const isConnected: boolean = useSocketStore((state) => state.isConnected);
    const { username } = useAuthStore();
    const { get } = useApi();

    const chessGameRef = useRef(new Chess());
    const game: Chess = chessGameRef.current;

    const [position, setPosition] = useState<string>(game.fen());
    const [isWhite, setIsWhite] = useState<boolean>(true);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [turn, setTurn] = useState<"w" | "b">("w");
    const [moveList, setMoveList] = useState<string[]>([]);
    const historyEndRef = useRef<HTMLDivElement>(null);

    // Advanced Board Interactions
    const [moveFrom, setMoveFrom] = useState<string>("");
    const [optionSquares, setOptionSquares] = useState<
        Record<string, CSSProperties>
    >({});

    const [opponentName, setOpponentName] = useState("Opponent");

    const [whiteTime, setWhiteTime] = useState(0);
    const [blackTime, setBlackTime] = useState(0);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState("");
    const [dialogDescription, setDialogDescription] = useState("");
    const [drawOfferOpen, setDrawOfferOpen] = useState(false);

    const isMobile = useIsMobile();
    const gameOverSoundPlayedRef = useRef(false);

    useEffect(() => {
        const fetchGameData = async () => {
            if (!gameId) return;
            try {
                const status: GameStatus | null = await get(
                    `/game/${gameId}/status`,
                );

                console.log("Game status loaded:", status);

                if (status) {
                    game.load(status.fen);
                    setPosition(game.fen());
                    setTurn(game.turn() as "w" | "b");

                    setIsWhite(status.whitePlayer === username);
                    setOpponentName(
                        status.whitePlayer === username
                            ? status.blackPlayer
                            : status.whitePlayer,
                    );

                    setWhiteTime(parseISODuration(status.whiteTime));
                    setBlackTime(parseISODuration(status.blackTime));
                    setMoveList(status.moves || []);

                    // Check if game is over based on loaded FEN
                    if (game.isGameOver()) {
                        setGameOver(true);
                        gameOverSoundPlayedRef.current = true;
                        setDialogTitle("Game Over");
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
                console.error("Error fetching game data", err);
                navigate("/dashboard");
            }
        };
        fetchGameData();
    }, [gameId, game, username, get, navigate]);

    useEffect(() => {
        if (gameOver || loading) return;
        const intervalId = setInterval(() => {
            if (turn === "w") setWhiteTime((prev) => Math.max(0, prev - 1));
            else setBlackTime((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(intervalId);
    }, [turn, gameOver, loading]);

    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [moveList]);

    const handleRemoteMove = useCallback((result: any) => {
        setPosition(game.fen());
        setTurn(game.turn() as "w" | "b");
        setMoveList((prev) => [...prev, result.san]);
        setMoveFrom("");
        setOptionSquares({});
    }, [game]);

    useGameMoves(gameId, game, handleRemoteMove, isWhite);

    useEffect(() => {
        if (!client || !isConnected || !gameId) return;

        const eventSub = client.subscribe(
            `/topic/game/${gameId}/event`,
            (message: { body: string }) => {
                setGameOver(true);
                setDialogTitle("Game Over");
                setDialogDescription(formatEventString(message.body));
                setDialogOpen(true);

                // Play game over sound based on event outcome
                if (!gameOverSoundPlayedRef.current) {
                    const eventStr = message.body.toUpperCase();
                    if (eventStr.includes("DRAW")) {
                        playGameOverSound("draw");
                    } else if (eventStr.includes("WHITE_WON")) {
                        playGameOverSound(isWhite ? "win" : "lose");
                    } else if (eventStr.includes("BLACK_WON")) {
                        playGameOverSound(!isWhite ? "win" : "lose");
                    } else {
                        playGameOverSound("draw");
                    }
                    gameOverSoundPlayedRef.current = true;
                }
            },
        );

        const drawSub = client.subscribe(
            `/user/queue/game/${gameId}/draw-offer`,
            () => {
                setDrawOfferOpen(true);
                toast.success("Your opponent has offered a draw.");
            },
        );

        return () => {
            eventSub.unsubscribe();
            drawSub.unsubscribe();
        };
    }, [client, isConnected, gameId, isWhite]);

    const isPlayerTurn = () => {
        const currentTurn = game.turn();
        return !(
            (currentTurn === "w" && !isWhite) ||
            (currentTurn === "b" && isWhite)
        );
    };

    const handleValidMove = (moveConfig: {
        from: string;
        to: string;
        promotion?: string;
    }) => {
        try {
            const move = game.move(moveConfig);
            if (move === null) return false;

            setPosition(game.fen());
            setTurn(game.turn() as "w" | "b");
            setMoveList((prev) => [...prev, move.san]);
            setMoveFrom("");
            setOptionSquares({});

            // Play sound locally
            if (game.isGameOver()) {
                if (game.isCheckmate()) {
                    if (!gameOverSoundPlayedRef.current) {
                        playGameOverSound("win"); // We checkmated the opponent
                        gameOverSoundPlayedRef.current = true;
                    }
                } else {
                    if (!gameOverSoundPlayedRef.current) {
                        playGameOverSound("draw");
                        gameOverSoundPlayedRef.current = true;
                    }
                }
            } else if (game.inCheck()) {
                playCheckSound();
            } else if (move.captured) {
                playCaptureSound();
            } else {
                playMoveSound();
            }

            if (client && gameId) {
                client.publish({
                    destination: `/app/game/${gameId}/move`,
                    body: move.from + move.to + (move.promotion || ""),
                });
            }
            return true;
        } catch (e) {
            // Invalid move caught by chess.js
            console.error("Invalid move attempted:", e);
            return false;
        }
    };

    const getMoveOptions = (square: Square) => {
        const moves = game.moves({ square, verbose: true });
        if (moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        const newSquares: Record<string, React.CSSProperties> = {};
        moves.map((move) => {
            const isCapture =
                game.get(move.to) &&
                game.get(move.to)?.color !== game.get(square)?.color;

            newSquares[move.to] = {
                background: isCapture
                    ? "radial-gradient(circle, transparent 55%, hsl(from var(--destructive) h s 50 / 0.6) 57%, hsl(from var(--destructive) h s 50 / 0.6) 68%, transparent 70%)"
                    : "radial-gradient(circle, hsl(from var(--foreground) h s 50 / 0.22) 19%, transparent 22%)",
            };
        });
        newSquares[square] = {
            background: "hsl(from var(--foreground) h s 50 / 0.15)",
        };
        setOptionSquares(newSquares);
        return true;
    };

    const onPieceDrop = ({
        sourceSquare,
        targetSquare,
    }: PieceDropHandlerArgs) => {
        console.log("Piece dropped from", sourceSquare, "to", targetSquare);
        if (gameOver || !isPlayerTurn() || !targetSquare) return false;
        return handleValidMove({
            from: sourceSquare,
            to: targetSquare,
            promotion: "q",
        });
    };

    const onSquareClick = ({ square, piece }: SquareHandlerArgs) => {
        console.log(
            "Square clicked:",
            square,
            "Piece on square:",
            piece,
            "gameOver:",
            gameOver,
            "isPlayerTurn:",
            isPlayerTurn(),
        );
        if (gameOver || !isPlayerTurn()) return;

        // Select a piece if none is selected
        if (!moveFrom) {
            const hasMoveOptions = getMoveOptions(square as Square);
            if (hasMoveOptions) setMoveFrom(square);
            return;
        }

        // Deselect if clicking the same square
        if (square === moveFrom) {
            setMoveFrom("");
            setOptionSquares({});
            return;
        }

        // Try to move
        const moveObj = { from: moveFrom, to: square, promotion: "q" };
        const moveSuccess = handleValidMove(moveObj);

        // If move invalid, check if we clicked another piece of ours to select it instead
        if (!moveSuccess) {
            const hasMoveOptions = getMoveOptions(square as Square);
            if (hasMoveOptions) setMoveFrom(square);
            else {
                setMoveFrom("");
                setOptionSquares({});
            }
        }
    };

    const handleResign = () => {
        console.log("Resign button clicked");
        if (client && gameId)
            client.publish({
                destination: `/app/game/${gameId}/action`,
                body: "RESIGN",
            });
    };

    const handleOfferDraw = () => {
        if (client && gameId) {
            client.publish({
                destination: `/app/game/${gameId}/action`,
                body: "DRAW",
            });
            toast.success("Draw offer sent");
        }
    };

    const handleAcceptDraw = () => {
        setDrawOfferOpen(false);
        if (client && gameId) {
            client.publish({
                destination: `/app/game/${gameId}/action`,
                body: "DRAW",
            });
            toast.success("Draw offer accepted");
        }
    };

    if (loading)
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );

    const { whiteCaptured, blackCaptured, whiteAdvantage, blackAdvantage } = calculateCapturedPieces(game);

    const topPlayerTimer = isWhite ? blackTime : whiteTime;
    const bottomPlayerTimer = isWhite ? whiteTime : blackTime;
    const bottomPlayerName = username || "You";

    return (
        <div className="flex-1 min-h-0 p-2 md:p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 bg-background">
            {/* LEFT SIDE: Chess Board Area (Desktop Only) */}
            {!isMobile && (
                <div className="flex-1 flex items-center justify-center h-full min-h-0">
                    <div className="max-h-full max-w-full aspect-square rounded-lg border-2 border-border/80 shadow-2xl dark:shadow-primary/5 relative overflow-hidden">
                        <GameChessboard
                            id="PlayVsOpponent"
                            position={position}
                            boardOrientation={isWhite ? "white" : "black"}
                            onPieceDrop={onPieceDrop}
                            onSquareClick={onSquareClick}
                            optionSquares={optionSquares}
                            game={game}
                        />
                    </div>
                </div>
            )}

            {/* RIGHT SIDE / SIDEBAR (Moves History & Game Actions) */}
            {isMobile ? (
                <div className="w-full h-full flex flex-col gap-2.5 justify-between max-w-md mx-auto py-1">
                    {/* Game Info Bar (Connection Status & Room Details) */}
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-border/40 bg-muted/20 backdrop-blur-md select-none shrink-0">
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? "bg-emerald-400" : "bg-destructive"}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-emerald-500" : "bg-destructive"}`}></span>
                            </span>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                                {isConnected ? "Live" : "Offline"}
                            </span>
                        </div>
                        <div className="font-bold text-[11px] text-foreground truncate px-2 text-center grow">
                            {isWhite ? `${bottomPlayerName} vs ${opponentName}` : `${opponentName} vs ${bottomPlayerName}`}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                title="Copy Watch Link"
                                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/85 transition-colors uppercase cursor-pointer"
                                onClick={() => {
                                    const watchLink = `${window.location.origin}/watch/${gameId}`;
                                    navigator.clipboard.writeText(watchLink);
                                    toast.success("Spectator watch link copied!");
                                }}
                            >
                                <Share2 className="w-3.5 h-3.5" /> Share
                            </button>
                        </div>
                    </div>

                    {/* Top Player (Opponent) */}
                    <PlayerCard
                        name={opponentName}
                        side={isWhite ? "Black" : "White"}
                        turn={isWhite ? turn === "b" : turn === "w"}
                        formattedTime={formatTime(topPlayerTimer)}
                        isSelf={false}
                        capturedPieces={isWhite ? blackCaptured : whiteCaptured}
                        advantage={isWhite ? blackAdvantage : whiteAdvantage}
                    />

                    {/* Compact Moves Ribbon */}
                    <MoveHistoryBar moves={moveList} />

                    {/* Board container */}
                    <div className="w-full aspect-square rounded-lg border-2 border-border/80 shadow-xl dark:shadow-primary/5 relative overflow-hidden">
                        <GameChessboard
                            id="PlayVsOpponentMobile"
                            position={position}
                            boardOrientation={isWhite ? "white" : "black"}
                            onPieceDrop={onPieceDrop}
                            onSquareClick={onSquareClick}
                            optionSquares={optionSquares}
                            game={game}
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2 shrink-0">
                        <Button
                            onClick={handleResign}
                            variant="destructive"
                            className="flex-1 font-bold rounded-lg cursor-pointer py-3.5 flex items-center justify-center gap-1.5 text-xs"
                            disabled={gameOver}>
                            <Flag className="w-3.5 h-3.5" /> Resign
                        </Button>
                        <Button
                            onClick={handleOfferDraw}
                            variant="outline"
                            className="flex-1 font-bold rounded-lg cursor-pointer py-3.5 flex items-center justify-center gap-1.5 border-primary/20 hover:bg-primary/10 text-xs"
                            disabled={gameOver}>
                            <Handshake className="w-3.5 h-3.5 text-primary" /> Offer Draw
                        </Button>
                    </div>

                    {/* Bottom Player (You) */}
                    <PlayerCard
                        name={bottomPlayerName}
                        side={isWhite ? "White" : "Black"}
                        turn={isWhite ? turn === "w" : turn === "b"}
                        formattedTime={formatTime(bottomPlayerTimer)}
                        isSelf={true}
                        capturedPieces={isWhite ? whiteCaptured : blackCaptured}
                        advantage={isWhite ? whiteAdvantage : blackAdvantage}
                    />
                </div>
            ) : (
                <div className="w-full lg:w-96 flex flex-col justify-between gap-4 shrink-0 min-h-0 h-full py-2">
                    {/* Top Player (Opponent) */}
                    <PlayerCard
                        name={opponentName}
                        side={isWhite ? "Black" : "White"}
                        turn={isWhite ? turn === "b" : turn === "w"}
                        formattedTime={formatTime(topPlayerTimer)}
                        isSelf={false}
                        capturedPieces={isWhite ? blackCaptured : whiteCaptured}
                        advantage={isWhite ? blackAdvantage : whiteAdvantage}
                    />

                    {/* Game Info Bar (Connection Status & Room Details) */}
                    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-border/40 bg-muted/20 backdrop-blur-md select-none shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? "bg-emerald-400" : "bg-destructive"}`}></span>
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? "bg-emerald-500" : "bg-destructive"}`}></span>
                            </span>
                            <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
                                {isConnected ? "Live Connection" : "Offline"}
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
                                    const watchLink = `${window.location.origin}/watch/${gameId}`;
                                    navigator.clipboard.writeText(watchLink);
                                    toast.success("Spectator watch link copied!");
                                }}
                            >
                                <Share2 className="w-3.5 h-3.5" /> Share
                            </button>
                        </div>
                    </div>

                    {/* Match Timeline Card */}
                    <MoveHistoryTable moves={moveList} historyEndRef={historyEndRef} />

                    {/* Compact Controls */}
                    <div className="flex gap-2 shrink-0">
                        <Button
                            onClick={handleResign}
                            variant="destructive"
                            size="lg"
                            className="flex-1"
                            disabled={gameOver}>
                            <Flag /> Resign
                        </Button>
                        <Button
                            onClick={handleOfferDraw}
                            variant="outline"
                            size="lg"
                            className="flex-1"
                            disabled={gameOver}>
                            <Handshake /> Offer Draw
                        </Button>
                    </div>

                    {/* Bottom Player (You) */}
                    <PlayerCard
                        name={bottomPlayerName}
                        side={isWhite ? "White" : "Black"}
                        turn={isWhite ? turn === "w" : turn === "b"}
                        formattedTime={formatTime(bottomPlayerTimer)}
                        isSelf={true}
                        capturedPieces={isWhite ? whiteCaptured : blackCaptured}
                        advantage={isWhite ? whiteAdvantage : blackAdvantage}
                    />
                </div>
            )}

            {/* Dialogs */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                        <DialogDescription>
                            {dialogDescription}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            size="lg"
                            onClick={() => navigate("/dashboard")}>
                            <ArrowLeft className="w-5 h-5 ml-2" />
                            Exit to Dashboard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={drawOfferOpen} onOpenChange={setDrawOfferOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            <Handshake /> Draw Offered
                        </DialogTitle>
                        <DialogDescription>
                            Your opponent has offered a draw. How would you like
                            to proceed?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 mt-6">
                        <Button
                            size="lg"
                            onClick={handleAcceptDraw}
                            className="flex-1 font-bold">
                            Accept Draw
                        </Button>
                        <Button
                            size="lg"
                            onClick={() => setDrawOfferOpen(false)}
                            variant="secondary"
                            className="flex-1 font-bold">
                            Decline
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

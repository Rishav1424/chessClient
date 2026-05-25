import { useEffect, useState, useRef, type CSSProperties } from "react";
import { useParams, useNavigate } from "react-router";
import {
    Chessboard,
    type PieceDropHandlerArgs,
    type SquareHandlerArgs,
} from "react-chessboard";
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
import { Loader2, Flag, Handshake, ArrowLeft } from "lucide-react";
import SelfCard from "./SelfCard";
import OpponentCard from "./OpponentCard";
import GameHistoryTable from "./GameHistoryTable";
import GameHistoryBar from "./GameHistoryBar";

interface GameStatus {
    fen: string;
    whitePlayer: string;
    blackPlayer: string;
    whiteTime: string;
    blackTime: string;
    moves: string[];
}

interface GameHistory {
    id: number;
    whitePlayer: { username: string };
    blackPlayer: { username: string };
    status: string;
    moves: string[];
    timestamp: string;
    updated: string;
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

const formatEventString = (eventStr: string) => {
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

    useEffect(() => {
        const fetchGameData = async () => {
            if (!gameId) return;
            try {
                const status: GameStatus | null = await get(
                    `/game/${gameId}/status`,
                );
                const history: GameHistory | null = await get(
                    `/game/${gameId}/history`,
                );

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

                    console.log("Game status loaded:", status);
                    console.log("Game history loaded:", history);

                    // if (history) {
                    //     setMoveList(history.moves || []);
                    //     // if (history.status !== "ONGOING") setGameOver(true);
                    // }
                    setLoading(false);
                } else {
                    toast.error("Game not found or has expired.");
                    navigate(-1);
                }
            } catch (err) {
                console.error("Error fetching game data", err);
                navigate(-1);
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

    useEffect(() => {
        if (!client || !isConnected || !gameId) return;

        const moveSub = client.subscribe(
            `/topic/game/${gameId}/move`,
            (message: { body: string }) => {
                try {
                    const incomingMove = message.body;
                    const result = game.move(incomingMove);
                    if (result) {
                        setPosition(game.fen());
                        setTurn(game.turn() as "w" | "b");
                        setMoveList((prev) => [...prev, result.san]);
                        setMoveFrom("");
                        setOptionSquares({});
                    }
                } catch (e) {
                    console.error("Move application error:", e);
                }
            },
        );

        const eventSub = client.subscribe(
            `/topic/game/${gameId}/event`,
            (message: { body: string }) => {
                setGameOver(true);
                setDialogTitle("Game Over");
                setDialogDescription(formatEventString(message.body));
                setDialogOpen(true);
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
            moveSub.unsubscribe();
            eventSub.unsubscribe();
            drawSub.unsubscribe();
        };
    }, [client, isConnected, gameId, game]);

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
                    ? "rgba(0, 255, 0, 0.5)"
                    : "radial-gradient(circle, rgba(0,0,0,.5) 25%, transparent 25%)",
            };
        });
        newSquares[square] = {
            background: "rgb(from var(--primary) r g b / 0.75)",
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

    const movePairs = [];
    for (let i = 0; i < moveList.length; i += 2)
        movePairs.push({ w: moveList[i], b: moveList[i + 1] });

    const topPlayerTimer = isWhite ? blackTime : whiteTime;
    const bottomPlayerTimer = isWhite ? whiteTime : blackTime;
    const bottomPlayerName = username || "You";

    return (
        <div className="flex-1 lg:overflow-hidden p-4 lg:p-6 flex flex-col lg:flex-row gap-6">
            {/* LEFT SIDE: Chess Board Area */}
            {!isMobile && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="max-h-full max-w-full aspect-square  rounded-sm border-4 border-primary/20 relative">
                        <Chessboard
                            options={{
                                id: "PlayVsOpponent",
                                animationDurationInMs: 200,
                                position: position,
                                boardOrientation: isWhite ? "white" : "black",
                                onPieceDrop: onPieceDrop,
                                onSquareClick: onSquareClick,
                                squareStyles: optionSquares,
                                darkSquareStyle: {
                                    backgroundColor: "var(--accent)",
                                },
                                lightSquareStyle: {
                                    backgroundColor: "var(--secondary)",
                                },
                            }}
                        />
                    </div>
                </div>
            )}

            {/* RIGHT SIDE: Sidebar (Profiles, History, Controls) */}
            <div className="w-full lg:w-100 flex flex-col h-full justify-between gap-4 self-center">
                {/* Top Player (Opponent) */}
                <OpponentCard
                    opponentName={opponentName}
                    turn={isWhite ? turn === "b" : turn === "w"}
                    formattedTime={formatTime(topPlayerTimer)}
                />
                {/* Middle Section: Compacted Moves & Controls */}
                <div className="flex-1 flex justify-center flex-col gap-2">
                    {/* Compact Moves Ribbon */}
                    {isMobile ? (
                        <>
                            <GameHistoryBar moves={moveList} />
                            <div className="w-full mt-2 aspect-square rounded-sm border-4 border-primary/20 relative">
                                <Chessboard
                                    options={{
                                        id: "PlayVsOpponentMobile",
                                        animationDurationInMs: 200,
                                        position: position,
                                        boardOrientation: isWhite
                                            ? "white"
                                            : "black",
                                        onPieceDrop: onPieceDrop,
                                        onSquareClick: onSquareClick,
                                        squareStyles: optionSquares,
                                        darkSquareStyle: {
                                            backgroundColor: "var(--accent)",
                                        },
                                        lightSquareStyle: {
                                            backgroundColor: "var(--secondary)",
                                        },
                                    }}
                                />
                            </div>
                        </>
                    ) : (
                        <GameHistoryTable moves={moveList} />
                    )}
                </div>

                {/* Compact Controls */}
                <div className="flex gap-3 mb-4">
                    <Button
                        onClick={handleResign}
                        variant="destructive"
                        className="flex-1"
                        disabled={gameOver}>
                        <Flag /> Resign
                    </Button>
                    <Button
                        onClick={handleOfferDraw}
                        variant="outline"
                        className="flex-1 "
                        disabled={gameOver}>
                        <Handshake /> Offer Draw
                    </Button>
                </div>

                {/* Bottom Player (You) */}
                <SelfCard
                    ownName={bottomPlayerName}
                    turn={isWhite ? turn === "w" : turn === "b"}
                    formattedTime={formatTime(bottomPlayerTimer)}
                />
            </div>

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

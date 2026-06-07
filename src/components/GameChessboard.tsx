import { Chess, type Square } from "chess.js";
import { Chessboard, type PieceDropHandlerArgs, type SquareHandlerArgs } from "react-chessboard";
import { type CSSProperties } from "react";

interface GameChessboardProps {
    id: string;
    position: string;
    boardOrientation: "white" | "black";
    onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
    onSquareClick: (args: SquareHandlerArgs) => void;
    optionSquares: Record<string, CSSProperties>;
    game: Chess;
}

// Helper to find the king's square for a given color
const findKingSquare = (chessGame: Chess, color: "w" | "b"): Square | null => {
    const board = chessGame.board();
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.type === "k" && piece.color === color) {
                return piece.square;
            }
        }
    }
    return null;
};

export default function GameChessboard({
    id,
    position,
    boardOrientation,
    onPieceDrop,
    onSquareClick,
    optionSquares,
    game,
}: GameChessboardProps) {
    
    // Calculate final merged square styles dynamically
    const getBoardStyles = (): Record<string, CSSProperties> => {
        const styles: Record<string, CSSProperties> = {};

        // 1. Last Move Highlighting (Soft ambient yellow tint)
        const history = game.history({ verbose: true });
        if (history.length > 0) {
            const lastMove = history[history.length - 1];
            styles[lastMove.from] = {
                backgroundColor: "rgba(250, 204, 21, 0.15)",
                borderRadius: "4px",
            };
            styles[lastMove.to] = {
                backgroundColor: "rgba(250, 204, 21, 0.22)",
                borderRadius: "4px",
            };
        }

        // 2. King in Check Highlighting (Soft warning red radial glow)
        if (game.inCheck()) {
            const activeColor = game.turn();
            const kingSquare = findKingSquare(game, activeColor);
            if (kingSquare) {
                styles[kingSquare] = {
                    background: "radial-gradient(circle, rgba(239, 68, 68, 0.45) 0%, rgba(239, 68, 68, 0.1) 70%, transparent 100%)",
                };
            }
        }

        // 3. Selected Piece Options (dots/captures)
        Object.assign(styles, optionSquares);

        return styles;
    };

    return (
        <Chessboard
            options={{
                id,
                position,
                boardOrientation,
                onPieceDrop,
                onSquareClick,
                squareStyles: getBoardStyles(),
                animationDurationInMs: 200,
                darkSquareStyle: {
                    backgroundColor: "var(--board-dark)",
                },
                lightSquareStyle: {
                    backgroundColor: "var(--board-light)",
                },
            }}
        />
    );
}

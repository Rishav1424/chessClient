import { Chess } from "chess.js";

export interface CapturedPiecesResult {
    whiteCaptured: string[];
    blackCaptured: string[];
    whiteAdvantage: number;
    blackAdvantage: number;
}

/**
 * Calculates the captured pieces and material advantages from a given Chess instance.
 */
export function calculateCapturedPieces(game: Chess): CapturedPiecesResult {
    const initial: Record<"w" | "b", Record<"p" | "n" | "b" | "r" | "q" | "k", number>> = {
        w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
        b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 }
    };
    const current: Record<"w" | "b", Record<"p" | "n" | "b" | "r" | "q" | "k", number>> = {
        w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
        b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
    };

    game.board().forEach(row => {
        row.forEach(piece => {
            if (piece) {
                current[piece.color][piece.type]++;
            }
        });
    });

    const capturedByWhite: string[] = [];
    const capturedByBlack: string[] = [];

    let whiteValue = 0;
    let blackValue = 0;

    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

    // White captured Black pieces (these are Black pieces missing from board)
    Object.keys(initial.b).forEach(t => {
        const type = t as keyof typeof initial.b;
        const diff = initial.b[type] - current.b[type];
        for (let i = 0; i < diff; i++) {
            capturedByWhite.push(type);
            whiteValue += pieceValues[type];
        }
    });

    // Black captured White pieces (these are White pieces missing from board)
    Object.keys(initial.w).forEach(t => {
        const type = t as keyof typeof initial.w;
        const diff = initial.w[type] - current.w[type];
        for (let i = 0; i < diff; i++) {
            capturedByBlack.push(type);
            blackValue += pieceValues[type];
        }
    });

    // Sort captured pieces by value
    const sortOrder = { p: 1, n: 2, b: 3, r: 4, q: 5, k: 6 };
    capturedByWhite.sort((a, b) => sortOrder[a as keyof typeof sortOrder] - sortOrder[b as keyof typeof sortOrder]);
    capturedByBlack.sort((a, b) => sortOrder[a as keyof typeof sortOrder] - sortOrder[b as keyof typeof sortOrder]);

    return {
        whiteCaptured: capturedByWhite,
        blackCaptured: capturedByBlack,
        whiteAdvantage: whiteValue > blackValue ? whiteValue - blackValue : 0,
        blackAdvantage: blackValue > whiteValue ? blackValue - whiteValue : 0
    };
}

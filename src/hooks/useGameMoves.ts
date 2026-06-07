import { useEffect, useRef } from "react";
import { useSocketStore } from "@/store/useSocketStore";
import { Chess, type Move } from "chess.js";
import {
    playMoveSound,
    playCaptureSound,
    playCheckSound,
    playGameOverSound,
} from "@/lib/audio";

export function useGameMoves(
    gameId: string | undefined,
    game: Chess,
    onMove: (result: Move) => void,
    isWhite?: boolean
) {
    const { client, isConnected } = useSocketStore();
    const gameOverSoundPlayedRef = useRef(false);

    useEffect(() => {
        if (!client || !isConnected || !gameId) return;

        const moveSub = client.subscribe(
            `/topic/game/${gameId}/move`,
            (message: { body: string }) => {
                try {
                    const incomingMove = message.body;

                    // Defensive parsing of UCI strings and serialized JSON objects
                    let targetMove: any = incomingMove;
                    if (typeof incomingMove === "string" && incomingMove.trim().startsWith("{")) {
                        try {
                            const obj = JSON.parse(incomingMove);
                            if (obj.from && obj.to) {
                                targetMove = {
                                    from: obj.from,
                                    to: obj.to,
                                    promotion: obj.promotion || undefined
                                };
                            }
                        } catch (err) {
                            console.error("Defensive move JSON parse error:", err);
                        }
                    }

                    // Prevent duplicate move application by comparing with local history
                    const movesHistory = game.history({ verbose: true });
                    const lastMove = movesHistory[movesHistory.length - 1];
                    if (lastMove) {
                        const lastUciMove = lastMove.from + lastMove.to + (lastMove.promotion || "");
                        const incomingUciString = typeof targetMove === "string"
                            ? targetMove
                            : (targetMove.from + targetMove.to + (targetMove.promotion || ""));

                        if (lastUciMove === incomingUciString) {
                            return; // Already applied locally!
                        }
                    }

                    const result = game.move(targetMove);
                    if (result) {
                        onMove(result);

                        // Play sound for incoming remote move
                        if (game.isGameOver()) {
                            if (game.isCheckmate()) {
                                if (!gameOverSoundPlayedRef.current) {
                                    if (isWhite !== undefined) {
                                        playGameOverSound("lose"); // Opponent checkmated us
                                    } else {
                                        playGameOverSound("draw"); // WatchRoom default
                                    }
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
                        } else if (result.captured) {
                            playCaptureSound();
                        } else {
                            playMoveSound();
                        }
                    }
                } catch (e) {
                    console.error("Move application error in useGameMoves hook:", e);
                }
            }
        );

        return () => {
            moveSub.unsubscribe();
        };
    }, [client, isConnected, gameId, game, onMove, isWhite]);
}

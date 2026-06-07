export interface UserStats {
    winAsWhite: number;
    winAsBlack: number;
    loseAsWhite: number;
    loseAsBlack: number;
    drawAsWhite: number;
    drawAsBlack: number;
}

export interface PastGame {
    id: number;
    whitePlayerName: string;
    blackPlayerName: string;
    status: string;
    moves: string[];
    started: Date | string;
    finished: Date | string;
}

import { User, Timer } from "lucide-react";

export default function OpponentCard({
    opponentName,
    turn,
    formattedTime,
}: {
    opponentName: string;
    turn: boolean;
    formattedTime: string;
}) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl shadow-sm border bg-card">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center border ">
                    <User className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-lg">{opponentName}</span>
                    <span className="text-xs text-accent font-medium tracking-wider">
                        OPPONENT
                    </span>
                </div>
            </div>
            <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold transition-all shadow-inner
                    ${turn ? "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/50" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}
            `}>
                <Timer className="w-5 h-5" />
                {formattedTime}
            </div>
        </div>
    );
}

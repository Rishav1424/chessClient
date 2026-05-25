import { Badge } from "@/components/ui/badge";
export default function GameHistoryBar({moves}: {moves: string[]}) {
    return (
        <div className="w-full flex gap-2">
            <div>Moves</div>
            <div className="flex-1 overflow-scroll">
                <div className="flex gap-2">
                    {moves.map((move, index) => (
                        <Badge variant={index % 2 === 0 ? "default" : "secondary"} key={index}>{move}</Badge>
                    ))}
                </div>
            </div>
        </div>
    );
}
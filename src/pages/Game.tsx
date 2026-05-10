import Header from "@/components/Header";
import { Separator } from "@/components/ui/separator";
import GameRoom from "./GameRoom";

const Game = () => {
    return (
        <div className="h-screen w-screen relative">
            <Header />
            <Separator/>
            <GameRoom />
        </div>
    );
};

export default Game;

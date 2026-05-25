import Header from "@/components/Header";
import { Separator } from "@/components/ui/separator";
import GameRoom from "@/components/GameRoom";

const Game = () => {
    return (
        <div className="h-screen w-screen flex flex-col">
            <Header />
            <Separator/>
            <GameRoom />
        </div>
    );
};

export default Game;

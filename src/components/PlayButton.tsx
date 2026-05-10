import { ChessQueen, Play } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { Spinner } from "./ui/spinner";

interface PlayButtonProps {
    onJoin?: () => void;
    onCancel?: () => void;
}

const PlayButton = ({ onJoin, onCancel }: PlayButtonProps) => {
    return (
        <div className="flex items-center ">
            <div className="p-px relative overflow-hidden rounded-xl group hover:scale-105 transition">
                <div className="absolute h-24 bg-linear-to-b from-transparent via-primary/25 group-hover:via-primary to-transparent top-1/2 left-1/2 origin-top-left w-full z-0 animate-spin animation-duration-5000"></div>
                <Card className="h-auto w-72 gap-2 shadow-2xl relative z-10 overflow-hidden">
                    <div className="absolute top-0 bg-linear-to-bl from-transparent from-40% scale-125 translate-y-1/6 via-border/50 to-transparent to-60% size-full z-20 animate-bounce animation-duration-5000"></div>
                    <CardHeader className="flex items-center gap-6 justify-between">
                        <div className="text-4xl font-black text-primary">
                            3+2 Blitz
                        </div>
                        <ChessQueen
                            className="size-24 rotate-12"
                            strokeWidth={0.5}
                            stroke="var(--primary)"
                        />
                    </CardHeader>
                    <CardContent className="text-muted-foreground font-light relative z-50">
                        3 minutes total 2 seconds bonus per move
                    </CardContent>
                    <CardFooter className="relative z-50">
                        <Dialog
                            onOpenChange={(open) => {
                                if (open && onJoin) {
                                    onJoin();
                                }
                            }}>
                            <DialogTrigger asChild>
                                <Button className="w-full gap-2">
                                    <Play />
                                    <span>Play</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Finding Opponent</DialogTitle>
                                </DialogHeader>
                                <div className="flex px-4 gap-12 items-center">
                                    <Spinner />
                                    <div>
                                        Please wait for sometime while we are
                                        looking for Opponent
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button
                                            variant="ghost"
                                            className="w-full"
                                            onClick={() => onCancel && onCancel()}>
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default PlayButton;

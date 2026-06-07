import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSocketStore } from "@/store/useSocketStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, Sparkles, AlertCircle, Tv } from "lucide-react";
import Header from "@/components/Header";
import useApi from "@/hooks/useApi";
import { Badge } from "@/components/ui/badge";
import { StatisticsCard } from "@/components/StatisticsCard";
import { MobileStatisticsCard } from "@/components/MobileStatisticsCard";
import { GameHistoryCard } from "@/components/GameHistoryCard";
import { type UserStats, type PastGame } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Dashboard() {
    const [isFindingMatch, setIsFindingMatch] = useState(false);
    const [watchId, setWatchId] = useState("");
    const [stats, setStats] = useState<UserStats>({
        winAsWhite: 10,
        winAsBlack: 10,
        loseAsWhite: 2,
        loseAsBlack: 2,
        drawAsWhite: 3,
        drawAsBlack: 3,
    });
    const [games, setGames] = useState<PastGame[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const navigate = useNavigate();
    const client = useSocketStore((state) => state.client);
    const isConnected = useSocketStore((state) => state.isConnected);
    const { username } = useAuthStore();
    const { get } = useApi();
    const isMobile = useIsMobile();

    // Fetch stats and recent games
    const loadDashboardData = async () => {
        setIsLoadingData(true);
        try {
            const fetchedStats = await get<UserStats>("/users/me/stats");
            const fetchedGames = await get<PastGame[]>("/users/me/games");
            if (fetchedStats) setStats(fetchedStats);
            if (fetchedGames) setGames(fetchedGames);
        } catch (err) {
            console.error("Error loading dashboard data:", err);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    useEffect(() => {
        console.log("STOMP Client connected:", isConnected);
        if (!client || !isConnected || !isFindingMatch) return;

        const subscription = client.subscribe(
            "/user/queue/match-making",
            (message: { body: string }) => {
                const data = JSON.parse(message.body);
                setIsFindingMatch(false);
                toast.success("Match Found!", {
                    description: `Playing against ${data.opponentId}`,
                });
                navigate(`/game/${data.gameId}`);
            },
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, [client, isConnected, isFindingMatch, navigate]);

    const handleFindMatch = () => {
        if (!isConnected) {
            toast.error("Connection Error", {
                description: "Unable to connect to server",
            });
            return;
        }
        setIsFindingMatch(true);
        client?.publish({
            destination: "/app/match-making/join",
        });
    };

    const handleCancelMatch = () => {
        setIsFindingMatch(false);
        if (!client) return;

        client.publish({
            destination: "/app/match-making/cancel",
        });
    };

    const handleWatchMatch = () => {
        if (!watchId.trim()) {
            toast.error("Please enter a Game ID or URL");
            return;
        }

        let extractedId = watchId.trim();
        const gameUrlMatch = extractedId.match(/\/game\/([a-zA-Z0-9-]+)/);
        const watchUrlMatch = extractedId.match(/\/watch\/([a-zA-Z0-9-]+)/);

        if (gameUrlMatch && gameUrlMatch[1]) {
            extractedId = gameUrlMatch[1];
        } else if (watchUrlMatch && watchUrlMatch[1]) {
            extractedId = watchUrlMatch[1];
        }

        navigate(`/watch/${extractedId}`);
    };

    return (
        <div className="bg-background h-screen w-full flex flex-col">
            <Header />

            <div className="flex-1 w-full mx-auto p-4 md:py-6 sm:px-16 xl:px-32 flex flex-col gap-6 justify-between min-h-0">

                {/* Unified Welcome & Matchmaking Top Bar Card */}
                <Card className="shadow-xl bg-linear-to-r from-card via-card/75 to-primary/50 dark:to-primary/25 rounded-2xl shrink-0 relative overflow-hidden group animate-fade-in py-2 md:py-6 md:px-2">
                    {/* Decorative abstract glowing blur circle */}
                    <div className="absolute right-0 top-0 -mt-10 -mr-10 w-56 h-56 rounded-full bg-linear-to-br from-primary/15 to-amber-500/50 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />

                    <CardContent className="flex flex-col sm:flex-row justify-between items-center p-5 md:p-6 gap-4 w-full h-full relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                <Sparkles className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-2">
                                    Welcome, {username}!
                                </h1>
                                <p className="text-muted-foreground text-sm mt-0.5 font-medium">
                                    Challenge players online, solve daily puzzles, and track your progress.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto shrink-0 justify-end">
                            {!isConnected && (
                                <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold animate-pulse rounded-lg">
                                    <AlertCircle className="w-3.5 h-3.5" /> Reconnecting
                                </Badge>
                            )}

                            {isFindingMatch ? (
                                <div className="flex items-center gap-3 justify-between w-full md:w-auto bg-muted/40 p-2 rounded-xl border border-primary/20 shrink-0">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    </div>
                                    <span className="text-sm font-bold text-foreground">Finding opponent...</span>
                                    <Button
                                        onClick={handleCancelMatch}
                                        variant="destructive"
                                        size="lg"
                                        className="h-8 text-xs font-black px-4 rounded-lg cursor-pointer">
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleFindMatch}
                                    disabled={!isConnected}
                                    size="lg"
                                    className="font-black text-sm uppercase tracking-wider rounded-xl bg-linear-to-r from-primary to-amber-500 hover:from-primary/95 hover:to-amber-500/95 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] px-10 h-12 w-full sm:w-auto shrink-0 cursor-pointer">
                                    Find Match
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Watch a Live Match Card */}
                <Card className="shadow-lg bg-card/50 backdrop-blur-md border-border/40 rounded-2xl p-5 md:p-6 shrink-0 relative overflow-hidden animate-fade-in">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Tv className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-foreground">Watch a Live Match</h3>
                                <p className="text-xs text-muted-foreground">Enter a Game ID or paste a Game URL to spectate the match in real-time.</p>
                            </div>
                        </div>
                        <div className="flex w-full md:w-auto items-center gap-2 max-w-md grow">
                            <Input
                                placeholder="Paste Game URL or Enter Game ID..."
                                value={watchId}
                                onChange={(e) => setWatchId(e.target.value)}
                                className="h-10 text-sm font-medium"
                            />
                            <Button
                                onClick={handleWatchMatch}
                                className="h-10 px-5 font-bold shrink-0 cursor-pointer"
                            >
                                Watch
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Dashboard Main Grid */}
                <div className="flex flex-wrap gap-6 md:gap-12 items-stretch min-h-0">

                    {/* LEFT COLUMN: Lifetime Stats */}
                    {/* Player Statistics Panel */}
                    {!isMobile ? (
                        <StatisticsCard stats={stats} isLoadingData={isLoadingData} className="grow h-auto" />
                    ) : (
                        <MobileStatisticsCard stats={stats} isLoadingData={isLoadingData} className="w-full" />
                    )}


                    {/* RIGHT COLUMN: Recent Games List (5 cols) - locked and scrollable */}
                    <GameHistoryCard games={games} isLoadingData={isLoadingData} className="grow h-full" />
                </div>
            </div>
        </div>
    );
}

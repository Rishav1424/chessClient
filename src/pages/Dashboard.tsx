import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { useStompClient } from "./SocketProvider";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";

export default function Dashboard() {
  const [isFindingMatch, setIsFindingMatch] = useState(false);
  const navigate = useNavigate();
  const {client, isConnected} = useStompClient();
  const { username } = useAuthStore();

  useEffect(() => {
    console.log("STOMP Client:", client?.connected);
    if (isConnected && isFindingMatch) {
      const subscription = client.subscribe("/user/queue/match-making", (message : { body: string }) => {
        const data = JSON.parse(message.body);
        setIsFindingMatch(false);
        toast("Match Found!",{
          description: `Playing against ${data.opponentId}`,
        });
        navigate(`/game/${data.gameId}`);
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, [isConnected, isFindingMatch, navigate]);

  const handleFindMatch = () => {
    console.log("STOMP Client:", client?.connected);
    if (!isConnected) {
      toast.error("Connection Error", {
        description: "Unable to connect to server",
      });
      return;
    }
    setIsFindingMatch(true);
    client.publish({
      destination: "/app/match-making/join",
    });
  };

  const handleCancelMatch = () => {
    setIsFindingMatch(false);
    client?.publish({
      destination: "/app/match-making/cancel",
    });
  };

  return (
    <div className="bg-background min-h-screen flex flex-col items-center">
      <Header />
      <div className="w-full px-4">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {username}!
          </h1>
        </div>
        <Card className="bg-card/45 bg-[url('/Gemini_Generated_Image.png')] bg-blend-overlay justify-around md:mx-16 h-48 bg-cover bg-center backdrop-blur-sm">
          <CardContent className="text-center text-4xl">
            Want to Play some chess?
          </CardContent>
          <CardFooter>
            <Button
              onClick={isFindingMatch ? handleCancelMatch : handleFindMatch}
              disabled={!isConnected}
              size="lg"
              className="text-lg md:text-2xl font-bold py-4 w-full md:w-auto md:py-8 md:px-12 rounded-2xl mx-auto border-2"
            >
              {isFindingMatch ? (
                <>
                  <Loader2 className="mr-2 size-4 md:size-8 animate-spin" />
                  Cancel Matchmaking
                </>
              ) : (
                "Find Match"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
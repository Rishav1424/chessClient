import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Chessboard, type PieceDropHandlerArgs } from "react-chessboard";
import { Chess } from "chess.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useStompClient } from "./SocketProvider";
import { useAuthStore } from "@/store/useAuthStore";
import useApi from "@/hooks/useApi";
import { Loader2 } from "lucide-react";

interface GameStatus {
  fen: string;
  whitePlayer: string;
  blackPlayer: string;
  whiteTime: number;
  blackTime: number;
  lastMoveTime: number;
}

interface GameHistory {
  id: number;
  whitePlayer: { username: string };
  blackPlayer: { username: string };
  status: string;
  moves: string[];
  timestamp: string;
  updated: string;
}

export default function GameRoom() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const {client, isConnected} = useStompClient();
  const { username } = useAuthStore();
  const { get } = useApi();

  // Create a stable reference to the chess game logic
  const chessGameRef = useRef(new Chess());
  const game = chessGameRef.current;

  // Track the current FEN string in state to trigger re-renders of the UI
  const [position, setPosition] = useState(game.fen());
  
  const [isWhite, setIsWhite] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle] = useState("");
  const [dialogDescription] = useState("");
  const [drawOfferOpen, setDrawOfferOpen] = useState(false);
  const [history] = useState<GameHistory | null>(null);

  // FETCH INITIAL DATA
  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;
      const status: GameStatus | null = await get(`/game/${gameId}/status`);
      
      if (status) {
        // Use .load() to update the existing game ref rather than creating a new instance.
        // This ensures all closures referencing 'game' stay up to date.
        game.load(status.fen); 
        setPosition(game.fen());
        setIsWhite(status.whitePlayer === username);
        setLoading(false);
      } else {
        navigate("/dashboard");
      }
    };
    fetchGameData();
  }, [gameId, username, get, navigate, game]); 

  // SUBSCRIPTIONS
  useEffect(() => {
    // Only subscribe if we have a client AND it is connected
    if (!isConnected || !gameId) return;

    const moveSub = client.subscribe(`/topic/game/${gameId}/move`, (message) => {
      const incomingMove = message.body;
      
      try {
        // Apply the opponent's move to our game reference
        game.move(incomingMove);
        // Trigger a re-render
        setPosition(game.fen());
      } catch (e) {
        console.error("Invalid move received from socket:", incomingMove);
      }
    });

    const eventSub = client.subscribe(`/topic/game/${gameId}/event`, (message) => {
      const event = message.body;
      setGameOver(true);
      setDialogOpen(true);
      toast.info("Got game event: " + event);
      // You can add your switch logic here based on the event string
    });

    const drawSub = client.subscribe(`/user/queue/game/${gameId}/draw-offer`, () => {
      setDrawOfferOpen(true);
    });

    return () => {
      moveSub.unsubscribe();
      eventSub.unsubscribe();
      drawSub.unsubscribe();
    };
  }, [client, gameId, game]);

  // HANDLE PIECE MOVEMENT
  const onPieceDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    if (gameOver || !targetSquare) return false;
    
    // Check if it's the player's turn
    const currentTurn = game.turn();
    if ((currentTurn === 'w' && !isWhite) || (currentTurn === 'b' && isWhite)) {
      return false;
    }

    try {
      // Try to make the move in the game logic
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // always promote to a queen for simplicity
      });

      // If successful, update the position state to re-render the board
      setPosition(game.fen());

      // Broadcast the move to the opponent
      if (client && gameId) {
        client.publish({
          destination: `/app/game/${gameId}/move`,
          // Make sure this matches what your backend expects (e.g., standard SAN notation or raw coordinates)
          body: move.from + move.to + (move.promotion || ''),
        });
      }

      return true;
    } catch (e) {
      // If chess.js throws an error (illegal move), snap the piece back
      return false;
    }
  };

  const handleResign = () => {
    if (client && gameId) {
      client.publish({
        destination: `/app/game/${gameId}/action`,
        body: "RESIGN",
      });
    }
  };

  const handleOfferDraw = () => {
    if (client && gameId) {
      client.publish({
        destination: `/app/game/${gameId}/action`,
        body: "DRAW",
      });
    }
  };

  const handleAcceptDraw = () => {
    setDrawOfferOpen(false);
    if (client && gameId) {
      client.publish({
        destination: `/app/game/${gameId}/action`,
        body: "DRAW",
      });
    }
  };

  const handleDeclineDraw = () => {
    setDrawOfferOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <Chessboard 
                options={{
                  position: position,
                  boardOrientation: isWhite ? 'white' : 'black',
                  // @ts-ignore
                  arePiecesDraggable: !gameOver,
                  onPieceDrop: onPieceDrop,
                }}
              />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Game Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleResign}
                variant="destructive"
                className="w-full"
                disabled={gameOver}
              >
                Resign
              </Button>
              <Button
                onClick={handleOfferDraw}
                variant="outline"
                className="w-full"
                disabled={gameOver}
              >
                Offer Draw
              </Button>
            </CardContent>
          </Card>
          {history && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Move History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  {history.moves?.map((move, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'}</span>
                      <span>{move}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            Back to Dashboard
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={drawOfferOpen} onOpenChange={setDrawOfferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Draw Offer</DialogTitle>
            <DialogDescription>Your opponent has offered a draw. Do you accept?</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button onClick={handleAcceptDraw} className="flex-1">
              Accept
            </Button>
            <Button onClick={handleDeclineDraw} variant="outline" className="flex-1">
              Decline
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
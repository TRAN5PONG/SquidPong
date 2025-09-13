import Zeroact, { useEffect, useRef } from "@/lib/Zeroact";
import { Game } from "./Scenes/GameScene";
import { Match } from "@/types/game";

interface GameCanvasProps {
  match: Match | null;
}
const GameCanvas = (props: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const game = new Game(canvasRef.current!);
      game.start(1);
    }
  }, []);

  return <canvas ref={canvasRef} className="game-canvas"></canvas>;
};

export default GameCanvas;

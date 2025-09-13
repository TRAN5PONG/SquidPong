import Zeroact, { useRef } from "@/lib/Zeroact";
import { useGameScene } from "./scenes/GameScene";
import { Match } from "@/types/game";

interface GameCanvasProps {
  match: Match | null;
}
const GameCanvas = (props: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scene } = useGameScene(canvasRef, props.match);


  if (!props.match || !scene) {
	console.log("waiting for match or scene")
  }
  return <canvas ref={canvasRef} className="game-canvas"></canvas>;
};

export default GameCanvas;

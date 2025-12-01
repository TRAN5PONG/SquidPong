import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { BounceGameScene } from "./Scenes/BounceGameScene";
import { BounceGameUI } from "./ui/BounceGameUI";
import { useNavigate } from "@/contexts/RouterProvider";

const StyledBounceGame = styled("div")`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
`;

const GameCanvas = styled("canvas")`
  width: 100%;
  height: 100%;
  display: block;
  outline: none;
`;

const BounceGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<BounceGameScene | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const navigate = useNavigate()
  // Start game once
  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      gameRef.current = new BounceGameScene(canvasRef.current);
      
      // Setup game over callback
      gameRef.current.onGameOver = () => {
        setIsGameOver(true);
        setScore(gameRef.current?.getScore() || 0);
      };
      
      gameRef.current.start();
    }

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.dispose();
        gameRef.current = null;
      }
    };
  }, []);

  // Update score periodically while playing
  useEffect(() => {
    if (!gameRef.current || isGameOver) return;

    const interval = setInterval(() => {
      if (gameRef.current) {
        setScore(gameRef.current.getScore());
      }
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isGameOver]);

  // Handle go home

  const handleRetry = () => {
    if (gameRef.current) {
      gameRef.current.restart();
      setIsGameOver(false);
      setScore(0);
    }
  };

  return (
    <StyledBounceGame>
      <GameCanvas ref={canvasRef} />
      <BounceGameUI
        score={score}
        onGoHome={() => navigate("/lobby")}
        onRetry={handleRetry}
        showControls={isGameOver}
      />
    </StyledBounceGame>
  );
};

export default BounceGame;

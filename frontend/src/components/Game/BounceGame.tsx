import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { BounceGameScene } from "./Scenes/BounceGameScene";
import { BounceGameUI } from "./ui/BounceGameUI";

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
  const [showWelcome, setShowWelcome] = useState(true);

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
      
      // Hide welcome message after 3 seconds
      setTimeout(() => {
        setShowWelcome(false);
      }, 3000);
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

  // Handle restart
  const handleRestart = () => {
    if (gameRef.current) {
      setIsGameOver(false);
      setScore(0);
      setShowWelcome(false);
      
      // Setup game over callback again
      gameRef.current.onGameOver = () => {
        setIsGameOver(true);
        setScore(gameRef.current?.getScore() || 0);
      };
      
      gameRef.current.restart();
    }
  };

  // Handle go home
  const handleGoHome = () => {
    // Navigate to home - adjust this based on your routing setup
    window.location.href = "/";
  };

  return (
    <StyledBounceGame>
      <GameCanvas ref={canvasRef} />
      <BounceGameUI
        isGameOver={isGameOver}
        score={score}
        onRestart={handleRestart}
        onGoHome={handleGoHome}
        showWelcome={showWelcome}
      />
    </StyledBounceGame>
  );
};

export default BounceGame;

import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { BounceGameScene } from "./Scenes/BounceGameScene";
import { useNavigate } from "@/contexts/RouterProvider";
import { useAppContext } from "@/contexts/AppProviders";
import Avatar from "../Tournament/Avatar";
import { getRankMetaData } from "@/utils/game";

const StyledBounceGame = styled("div")`
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  .GameProf {
    position: absolute;
    left: 5px;
    top: 5px;
    padding: 10px;
    height: 100px;
    width: 300px;
    gap: 10px;
    display: flex;
    align-items: center;
    border-radius: 5px;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0) 100%
    );
    .MaxScore {
      display: flex;
      flex-direction: column;
      flex: 1;
      span {
        font-size: 1rem;
        font-family: var(--squid_font);
        color: white;
      }
    }
  }
  .BackToLobby {
    position: absolute;
    right: 10px;
    bottom: 10px;
    height: 40px;
    padding: 0px 10px;
    border-radius: 5px;
  }
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
  const { user } = useAppContext();

  const navigate = useNavigate();
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
      <div className="GameProf">
        <Avatar
          avatarUrl={user?.avatar}
          rank={
            getRankMetaData(user?.rankDivision!, user?.rankTier!) || undefined
          }
        />
        <div className="MaxScore">
          <span>Your Best : 15</span>
          <span>Top Score : 100</span>
        </div>
      </div>

      <button
        className="BackToLobby BtnSecondary"
        onClick={() => navigate("/lobby")}
      >
        Back to Lobby
      </button>
      <GameCanvas ref={canvasRef} />
    </StyledBounceGame>
  );
};

export default BounceGame;

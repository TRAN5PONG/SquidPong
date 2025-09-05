import Zeroact, { useEffect } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";

import ScoreBoard from "./Elements/ScoreBoard";
import { db } from "@/db";
import CountDown from "./Elements/CountDown";
import { useGameScene } from "./scenes/GameScene";
import { useSound } from "@/hooks/useSound";
import Loader from "../Loader/Loader";
import { GiveUpIcon, PauseIcon } from "../Svg/Svg";
import { MatchResultOverlay } from "./Elements/MatchResultOverlay";
import { GamePowerUps } from "@/types/game";

import { Client } from "colyseus.js";
import { useSounds } from "@/contexts/SoundProvider";

const StyledGame = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
  .GameSettings {
    .GiveUpButton {
      width: 120px;
      height: 40px;
      position: absolute;
      bottom: 10px;
      right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      border-radius: 3px;
    }
    .PauseButton {
      width: 40px;
      height: 40px;
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
      background-color: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.4);
      }
    }
    .PowerUps {
      position: absolute;
      left: 50%;
      bottom: 10px;
      transform: translateX(-50%);
      display: flex;
      width: fit-content;
      gap: 2px;
      background-color: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(5px);
      padding: 2px;
      border-radius: 5px;
      .PowerUp {
        width: 60px;
        height: 60px;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        img {
          height: 100%;
          width: 100%;
          filter: grayscale(1);
          cursor: pointer;
          &:hover {
            filter: grayscale(0);
          }
        }
      }
    }
  }

  .game-canvas {
    width: 100%;
    height: 100%;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    outline: none;
  }
`;

const Game = () => {
  const canvasRef = Zeroact.useRef<HTMLCanvasElement>(null);
  const { camera } = useGameScene(canvasRef);
  const { ambianceSound } = useSounds();

  const [userGameRes, setUserGameRes] = Zeroact.useState<boolean | null>(null); // null = game ongoing, true = user won, false = user lost

  const onPause = () => {
    ambianceSound.play();
    camera.cameraRotate();
  };
  const onGiveUp = () => {};
  const onGameStart = () => {};

  useEffect(() => {
    const connect = async () => {
      const client = new Client("ws://localhost:3000");

      try {
        console.log("🔄 Trying to connect to Colyseus...");
        const room = await client.joinOrCreate("ping-pong");
        console.log("✅ Connected to Colyseus server!");
        console.log("🎮 Joined room:", room);
      } catch (err) {
        console.error("❌ Failed to connect to Colyseus:", err);
      }
    };

    setTimeout(() => {
      setUserGameRes(true);
    }, 1000);

    connect();
  }, []);

  return (
    <StyledGame>
      <ScoreBoard oponent1={db.users[0]} oponent2={db.users[1]} />
      <div className="GameSettings">
        <button className="GiveUpButton BtnSecondary" onClick={onGiveUp}>
          <GiveUpIcon size={20} fill="var(--main_color)" />
          Give up
        </button>

        <button className="PauseButton" onClick={onPause} title="Pause">
          <PauseIcon size={20} fill="rgba(255,255,255,0.5)" />
        </button>

        <div className="PowerUps">
          {GamePowerUps.map((p) => (
            <div key={p.type} className="PowerUp">
              <img src={p.image} alt={p.type} title={p.type} />
            </div>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} className="game-canvas"></canvas>
      {/* {userGameRes && (
        <MatchResultOverlay isWinner={false} opponentName={"Opponent"} />
      )} */}
    </StyledGame>
  );
};

export default Game;

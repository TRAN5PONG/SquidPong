import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";

import ScoreBoard from "./Elements/ScoreBoard";
import { GiveUpIcon, PauseIcon } from "../Svg/Svg";
import { MatchResultOverlay } from "./Elements/MatchResultOverlay";
import { GamePowerUps, Match, MatchPlayer } from "@/types/game/game";

import { useRouteParam } from "@/hooks/useParam";
import { getMatchById } from "@/api/match";
import NotFound from "../NotFound/NotFound";
import { useAppContext } from "@/contexts/AppProviders";
import { MatchPhase, MatchState } from "./network/GameState";
import { Network } from "./network/network";
import { Game } from "./Scenes/GameScene";
import { db } from "@/db";
import { useNavigate } from "@/contexts/RouterProvider";
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
    .ReadyBtn {
      width: 120px;
      height: 40px;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      border-radius: 5px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background-color: var(--main_color2);
      font-size: 1.2rem;
      font-family: var(--squid_font);
      color: white;
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

const GameContiner = () => {
  // Context
  const { user } = useAppContext();

  // Get Match
  const matchId = useRouteParam("/game/:id", "id");
  const [match, setMatch] = useState<Match | null>(null);
  const [notFound, setNotFound] = useState(false);
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const netRef = useRef<Network | null>(null);
  // Game States
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("waiting");
  const [winnerId, setWinnerId] = useState<string | null>(null);
  // Sounds
  const { entranceSound } = useSounds();

  // InGame callbacks
  const inGameOnReadyHover = (isMuffled: boolean) => {
    entranceSound.setMuffled(isMuffled);
  };
  const inGameOnReadyClick = () => {
    if (!gameRef.current) return;
    gameRef.current.arena.stopTableEdgesPulse();
    gameRef.current.camera.setupPosition();
    gameRef.current.net.sendMessage("player:ready");
    entranceSound.stop();
  };

  // == Get Match
  useEffect(() => {
    if (!matchId) return;

    const getMatch = async () => {
      try {
        const res = await getMatchById(matchId);
        if (res) {
          setMatch(res.data);
        } else setNotFound(true);
      } catch (err) {
        setNotFound(true);
        console.error(err);
      }
    };

    getMatch();
  }, [matchId]);

  // == Init Game
  useEffect(() => {
    if (!match || !user?.id || !canvasRef.current || gameRef.current) return;

    gameRef.current = new Game(canvasRef.current, match, user.id, false);
    gameRef.current.start();
    setTimeout(() => {
      entranceSound.play();
    }, 500);
    netRef.current = gameRef.current.net;

    return () => {
      gameRef.current?.dispose();
      netRef.current = null;
    };
  }, [match, user?.id, canvasRef.current]);
  useEffect(() => {
    if (gameRef.current?.arena) {
      gameRef.current.arena.setOnReadyHover(inGameOnReadyHover);
      gameRef.current.arena.setOnReadyClick(inGameOnReadyClick);
    }
  }, [gameRef.current?.arena]);
  // == Network Listeners
  useEffect(() => {
    if (!netRef.current) return;
    netRef.current.on("phase:changed", setMatchPhase);
    netRef.current.on("winner:declared", setWinnerId);
    netRef.current.on("game:ended", (data) => setWinnerId(data.winnerId));

    netRef.current.on("score:update", (data) => {
      Object.entries(data.scores).forEach(([playerId, score]) => {
        if (playerId === match?.opponent1.id) {
          gameRef.current?.arena.setOpponent1Score(Number(score));
        } else if (playerId === match?.opponent2.id) {
          gameRef.current?.arena.setOpponent2Score(Number(score));
        }
      });
    });
  }, [gameRef.current]);

  const navigate = useNavigate();

  const onPause = () => {
    if (!netRef.current) return;

    netRef.current.sendMessage("game:pause");
  };
  const onGiveUp = () => {
    if (!netRef.current) return;
    netRef.current.sendMessage("player:give-up");
  };
  const onReady = () => {
    if (!netRef.current) return;

    gameRef.current?.arena.stopTableEdgesPulse();
    gameRef.current?.camera.setupPosition();
    netRef.current.sendMessage("player:ready");
  };
  const onReset = () => {
    if (!netRef.current) return;

    gameRef.current?.camera.playCameraAnimations();

    // netRef.current.sendMessage("game:reset");
  };

  // if (notFound) return <NotFound />;
  // if (!match) return <LoaderSpinner />;

  return (
    <StyledGame>
      <MatchResultOverlay
        isWinner={
          winnerId ? winnerId === gameRef.current?.getUserPlayerId() : null
        }
      />
      <ScoreBoard
        net={netRef.current}
        match={match}
        startCinematicCamera={() => {}}
        resetCamera={() => {}}
      />
      <div className="GameSettings">
        {matchPhase === "playing" ||
        matchPhase === "paused" ||
        matchPhase === "waiting" ? (
          <button className="GiveUpButton BtnSecondary" onClick={onGiveUp}>
            <GiveUpIcon size={20} fill="var(--main_color)" />
            Give up
          </button>
        ) : (
          <button
            className="GiveUpButton BtnSecondary"
            onClick={() => navigate("/lobby")}
          >
            Back to lobby
          </button>
        )}

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

        {/* {matchPhase === "waiting" && (
          <button className="ReadyBtn" onClick={onReady}>
            Ready
          </button>
        )} */}
      </div>
      <canvas ref={canvasRef} className="game-canvas"></canvas>;
    </StyledGame>
  );
};

export default GameContiner;

import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";

import ScoreBoard from "./Elements/ScoreBoard";
import { db } from "@/db";
import CountDown from "./Elements/CountDown";
import { useGameScene } from "./scenes/GameScene";
import { useSound } from "@/hooks/useSound";
import { LoaderSpinner } from "../Loader/Loader";
import { GiveUpIcon, PauseIcon } from "../Svg/Svg";
import { MatchResultOverlay } from "./Elements/MatchResultOverlay";
import { GamePowerUps, Match, MatchPlayer } from "@/types/game";

import { Client, Room } from "colyseus.js";
import { useSounds } from "@/contexts/SoundProvider";
import { useRouteParam } from "@/hooks/useParam";
import { getMatchById } from "@/api/match";
import NotFound from "../NotFound/NotFound";
import { useAppContext } from "@/contexts/AppProviders";

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

interface Spectator {
  id: string;
  username: string;
}
export interface SocketPlayer {
  id: string; // MatchPlayer.id
  isConnected: boolean;
  pauseRequests: number;
  remainingPauseTime: number;
}
interface MatchState {
  players: Map<string, SocketPlayer>;
  spectators: Map<string, Spectator>;
  phase: "waiting" | "countdown" | "playing" | "paused" | "ended";
  countdown: number;
  winnerId: string | null;
  pauseBy: string | null;
}

const Game = () => {
  // Game Scene
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { camera, cinematicCamera, resetGamePlayCamera } =
    useGameScene(canvasRef);

  // Context
  const { ambianceSound } = useSounds();
  const { user, toasts } = useAppContext();

  // GetMacth
  const matchId = useRouteParam("/game/:id", "id");
  const [match, setMatch] = useState<Match | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [room, setRoom] = useState<Room<MatchState> | null>(null);

  // Game States
  const [matchPhase, setMatchPhase] = useState<
    "waiting" | "countdown" | "playing" | "paused" | "ended"
  >("waiting");
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [pauseCountdown, setPauseCountdown] = useState<number | null>(null);


  // Players setup
  const hostId = match?.opponent1.isHost ? match.opponent1.id : match?.opponent2.id;
  const guestId = match?.opponent1.isHost ? match.opponent2.id : match?.opponent1.id;
  const [socketPlayers, setSocketPlayers] = useState<SocketPlayer[]>([]);
  const [players, setPlayers] = useState<
    Record<string, MatchPlayer & SocketPlayer>
  >({});

  useEffect(() => {
    if (matchId) {
      setTimeout(() => {
        const getMatch = async () => {
          try {
            const res = await getMatchById(matchId);

            if (res) setMatch(res.data);
            else setNotFound(true);
          } catch (err) {
            setNotFound(true);
            console.error(err);
          }
        };
        getMatch();
      }, 500);
    }
  }, [matchId]);

  useEffect(() => {
    if (!match || !match.roomId) return;

    const setupRoom = async () => {
      const client = new Client("ws://localhost:3000");
      let room;

      try {
        room = (await client.joinById(match.roomId, {
          userId: user?.id,
        })) as Room<MatchState>;

        setRoom(room);
      } catch (err) {
        console.error("❌ Failed to join room:", err);
      }
    };

    setupRoom();

    return () => {
      room?.leave();
      setRoom(null);
    };
  }, [match, user?.id]);

  useEffect(() => {
    if (!room || !match) return;

    const matchPlayers = {
      [match.opponent1.id]: match.opponent1,
      [match.opponent2.id]: match.opponent2,
    };

    room.onStateChange((state) => {
      // console.log("Room state changed:", state);
      setMatchPhase(state.phase);

      // Update players
      const updated = {} as Record<string, MatchPlayer & SocketPlayer>;
      for (const [id, live] of state.players.entries()) {
        updated[id] = {
          ...matchPlayers[id], // static info
          ...live, // live state
        };
      }
      setPlayers(updated);
      setSocketPlayers(Array.from(state.players.values()));

      // Set countdown value
      if (state.phase === "countdown") setCountdownValue(state.countdown);
      else setCountdownValue(null);
    });

    room.onMessage("game:paused", (message) => {
      setPauseCountdown(message.remainingPauseTime || null);
    });
    room.onMessage("game:resumed", (message) => {
      console.log("Game resumed by opponent", message);
    });
    room.onMessage("game:pause-tick", (message) => {
      setPauseCountdown(message.remainingPauseTime || null);
    });
    room.onMessage("game:resume-denied", (message) => {
      toasts.addToastToQueue({
        type: "error",
        message: `Resume denied: ${message.reason}`,
      });
    });
    room.onMessage("game:pause-denied", (message) => {
      toasts.addToastToQueue({
        type: "error",
        message: `Pause denied: ${message.reason}`,
      });
    });
  }, [room, match]);

  const onPause = () => {
    room?.send("game:pause");
  };
  const onGiveUp = () => {};
  const onGameStart = () => {};

  if (notFound) return <NotFound />;
  // if (!match) return <LoaderSpinner />;

  return (
    <StyledGame>
      <ScoreBoard
        host={hostId ? players[hostId] : null}
        guest={guestId ? players[guestId] : null}
        isPaused={matchPhase === "paused"}
        isCountingDown={matchPhase === "countdown"}
        countdown={countdownValue || 0}
        pauseCountdown={pauseCountdown || 0}
        pauseBy={room?.state.pauseBy || null}
        startCinematicCamera={cinematicCamera.playCinematic}
        resetCamera={resetGamePlayCamera}
      />

      <button
        onClick={() => room?.send("player:ready", { isReady: true })}
        style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}
      >
        Ready
      </button>
      <h1
        style={{
          position: "absolute",
          top: "160px",
          left: 60,
          zIndex: 10,
          color: "white",
        }}
      >
        GAME STATUS :{matchPhase}
      </h1>

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

      {/* 
      {matchPhase === "countdown" && countdownValue && (
        <CountDown value={countdownValue} onComplete={onGameStart} />
      )} */}
      {/* {userGameRes && (
        <MatchResultOverlay isWinner={false} opponentName={"Opponent"} />
      )} */}

      <canvas ref={canvasRef} className="game-canvas"></canvas>
    </StyledGame>
  );
};

export default Game;

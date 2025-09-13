import Zeroact, { useEffect, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";

import ScoreBoard from "./Elements/ScoreBoard";
import { GiveUpIcon, PauseIcon } from "../Svg/Svg";
import { MatchResultOverlay } from "./Elements/MatchResultOverlay";
import { GamePowerUps, Match, MatchPlayer } from "@/types/game";

import { Client, Room, getStateCallbacks } from "colyseus.js";
import { Schema } from "@colyseus/schema";

import { useRouteParam } from "@/hooks/useParam";
import { getMatchById } from "@/api/match";
import NotFound from "../NotFound/NotFound";
import { useAppContext } from "@/contexts/AppProviders";
import GameCanvas from "./GameCanvas";

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
interface MatchState extends Schema {
  players: Map<string, SocketPlayer>;
  spectators: Map<string, Spectator>;
  phase: "waiting" | "countdown" | "playing" | "paused" | "ended";
  countdown: number;
  winnerId: string | null;
  pauseBy: string | null;
}

const GameContiner = () => {
  // Context
  const { user, toasts } = useAppContext();

  // Get Match
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
  const hostId = match?.opponent1.isHost
    ? match.opponent1.id
    : match?.opponent2.id;
  const guestId = match?.opponent1.isHost
    ? match.opponent2.id
    : match?.opponent1.id;
  const userPlayerId =
    match?.opponent1.userId === user?.id
      ? match?.opponent1.id
      : match?.opponent2.id;

  const [players, setPlayers] = useState<
    Record<string, MatchPlayer & SocketPlayer>
  >({});
  const [winnerId, setWinnerId] = useState<string | null>(null);

  // // Fetch match data
  // useEffect(() => {
  //   if (!matchId) return;

  //   const getMatch = async () => {
  //     try {
  //       const res = await getMatchById(matchId);
  //       if (res) setMatch(res.data);
  //       else setNotFound(true);
  //     } catch (err) {
  //       setNotFound(true);
  //       console.error(err);
  //     }
  //   };

  //   // Remove unnecessary timeout
  //   getMatch();
  // }, [matchId]);

  // // Setup room connection
  // useEffect(() => {
  //   if (!match?.roomId || !user?.id) return;

  //   const setupRoom = async () => {
  //     const client = new Client("ws://10.13.2.6:3000");

  //     try {
  //       const room = (await client.joinById(match.roomId, {
  //         userId: user.id,
  //       })) as Room<MatchState>;

  //       setRoom(room);
  //     } catch (err) {
  //       console.error("❌ Failed to join room:", err);
  //     }
  //   };

  //   setupRoom();

  //   // Cleanup on unmount or dependency change
  //   return () => {
  //     room?.leave();
  //     setRoom(null);
  //   };
  // }, [match?.roomId, user?.id]);

  // // Setup room listeners
  // useEffect(() => {
  //   if (!room || !match) return;

  //   const matchPlayers = {
  //     [match.opponent1.id]: match.opponent1,
  //     [match.opponent2.id]: match.opponent2,
  //   };

  //   // Get state callbacks helper
  //   const $ = getStateCallbacks(room as any);

  //   // players management
  //   $(room.state as any).players.onAdd(
  //     (player: SocketPlayer, playerId: string) => {
  //       // Add player to state
  //       setPlayers((prev) => ({
  //         ...prev,
  //         [playerId]: {
  //           ...matchPlayers[playerId],
  //           ...player,
  //         },
  //       }));

  //       $(player as any).listen("isConnected", (isConnected: boolean) => {
  //         setPlayers((prev) => ({
  //           ...prev,
  //           [playerId]: {
  //             ...prev[playerId],
  //             isConnected,
  //           },
  //         }));
  //       });
  //     }
  //   );
  //   $(room.state as any).players.onRemove(
  //     (player: SocketPlayer, playerId: string) => {
  //       console.log("Player left:", player, playerId);

  //       setPlayers((prev) => {
  //         const newPlayers = { ...prev };
  //         delete newPlayers[playerId];
  //         return newPlayers;
  //       });
  //     }
  //   );

  //   // Event listeners
  //   $(room.state as any).listen("phase", (phase: string) => {
  //     setMatchPhase(phase as any);
  //   });
  //   $(room.state as any).listen("winnerId", (newWinnerId: string | null) => {
  //     setWinnerId(newWinnerId);
  //   });
  //   $(room.state as any).listen("countdown", (countdown: number) => {
  //     if (room.state.phase === "countdown") {
  //       setCountdownValue(countdown);
  //     } else {
  //       setCountdownValue(null);
  //     }
  //   });

  //   // Setup message handlers
  //   const messageHandlers = {
  //     "game:paused": (message: any) => {
  //       setPauseCountdown(message.remainingPauseTime || null);
  //     },

  //     "game:resumed": (message: any) => {
  //       console.log("Game resumed by opponent", message);
  //       setPauseCountdown(null);
  //     },

  //     "game:pause-tick": (message: any) => {
  //       setPauseCountdown(message.remainingPauseTime || null);
  //     },

  //     "game:resume-denied": (message: any) => {
  //       toasts.addToastToQueue({
  //         type: "error",
  //         message: `Resume denied: ${message.reason}`,
  //       });
  //     },

  //     "game:pause-denied": (message: any) => {
  //       toasts.addToastToQueue({
  //         type: "error",
  //         message: `Pause denied: ${message.reason}`,
  //       });
  //     },

  //     "game:give-up-denied": (message: any) => {
  //       toasts.addToastToQueue({
  //         type: "error",
  //         message: `Give up denied: ${message.reason}`,
  //       });
  //     },
  //   };

  //   // Register all message handlers
  //   Object.entries(messageHandlers).forEach(([type, handler]) => {
  //     room.onMessage(type, handler);
  //   });

  //   // Cleanup function
  //   return () => {
  //     // Remove specific listeners if needed
  //     // Note: Colyseus automatically cleans up when room disconnects
  //   };
  // }, [room, match]);

  const onPause = () => {
    room?.send("game:pause");
  };
  const onGiveUp = () => {
    room?.send("player:give-up");
  };

  // if (notFound) return <NotFound />;
  // if (!match) return <LoaderSpinner />;

  return (
    <StyledGame>
      <MatchResultOverlay
        isWinner={winnerId ? winnerId === userPlayerId : null}
      />

      <ScoreBoard
        host={hostId ? players[hostId] : null}
        guest={guestId ? players[guestId] : null}
        isPaused={matchPhase === "paused"}
        isCountingDown={matchPhase === "countdown"}
        isEnded={matchPhase === "ended"}
        winnerId={winnerId}
        countdown={countdownValue || 0}
        pauseCountdown={pauseCountdown || 0}
        pauseBy={room?.state.pauseBy || null}
        startCinematicCamera={() => {}}
        resetCamera={() => {}}
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
        {matchPhase === "playing" ||
        matchPhase === "paused" ||
        matchPhase === "waiting" ? (
          <button className="GiveUpButton BtnSecondary" onClick={onGiveUp}>
            <GiveUpIcon size={20} fill="var(--main_color)" />
            Give up
          </button>
        ) : (
          <button className="GiveUpButton BtnSecondary">Back to lobby</button>
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
      </div>

      <GameCanvas match={match}/>
    </StyledGame>
  );
};

export default GameContiner;

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
import { MatchPhase, MatchState } from "./network/GameState";
import { Network } from "./network/network";

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

const GameContiner = () => {
  // Context
  const { user, toasts } = useAppContext();

  // Get Match
  const matchId = useRouteParam("/game/:id", "id");
  const [match, setMatch] = useState<Match | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [room, setRoom] = useState<Room<MatchState> | null>(null);

  // Game States
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("waiting");
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

  const [players, setPlayers] = useState<Record<string, MatchPlayer>>({});
  const [winnerId, setWinnerId] = useState<string | null>(null);

  // Fetch match data
  useEffect(() => {
    if (!matchId) return;

    const getMatch = async () => {
      try {
        const res = await getMatchById(matchId);
        if (res) {
          setMatch(res.data);
          setPlayers({
            [res.data.opponent1.id]: res.data.opponent1,
            [res.data.opponent2.id]: res.data.opponent2,
          });
        } else setNotFound(true);
      } catch (err) {
        setNotFound(true);
        console.error(err);
      }
    };

    getMatch();
  }, [matchId]);

  // Setup room connection
  useEffect(() => {
    if (!match?.roomId || !user?.id) return;

    const net = new Network("ws://10.13.2.6:3000", match);
    net.join(user.id).then((room) => {
      setRoom(room);

      // state listeners
      net.on("players", (data) => {
        setPlayers((prev) => ({
          ...prev,
          ...data,
        }));
      });
      net.on("phase", setMatchPhase);
      net.on("countdown", setCountdownValue);
      net.on("winner", setWinnerId);
    });

    // register handlers
    net.registerMessageHandlers({
      "game:paused": (message: any) => {
        setPauseCountdown(message.remainingPauseTime || null);
      },
      "game:resumed": (message: any) => {
        console.log("Game resumed by opponent", message);
        setPauseCountdown(null);
      },
      "game:pause-tick": (message: any) => {
        setPauseCountdown(message.remainingPauseTime || null);
      },
      "game:resume-denied": (message: any) => {
        toasts.addToastToQueue({
          type: "error",
          message: `Resume denied: ${message.reason}`,
        });
      },
      "game:pause-denied": (message: any) => {
        toasts.addToastToQueue({
          type: "error",
          message: `Pause denied: ${message.reason}`,
        });
      },
      "game:give-up-denied": (message: any) => {
        toasts.addToastToQueue({
          type: "error",
          message: `Give up denied: ${message.reason}`,
        });
      },
    });
    return () => net.leave();
  }, [match?.roomId, user?.id]);

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

      {/* <GameCanvas match={match} /> */}
    </StyledGame>
  );
};

export default GameContiner;

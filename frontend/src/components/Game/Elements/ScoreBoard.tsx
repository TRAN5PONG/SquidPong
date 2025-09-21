import {
  DisconnectedIcon,
  PaddleIcon,
  PauseIcon,
  WinnerIcon,
} from "@/components/Svg/Svg";
import { useSounds } from "@/contexts/SoundProvider";
import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { Match, MatchPlayer } from "@/types/game/game";
import { MatchPhase, MatchState } from "../network/GameState";
import { Room } from "colyseus.js";
import { Network } from "../network/network";
import { useAppContext } from "@/contexts/AppProviders";
import { formatTime } from "@/utils/time";

const StyledScoreBoard = styled("div")`
  width: 80%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
  background: linear-gradient(
    90deg,
    rgba(224, 189, 47, 0) 0%,
    rgba(153, 128, 26, 0.6) 50%,
    rgba(224, 189, 47, 0) 100%
  );
  &:after {
    width: 100%;
    height: 1px;
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    background: linear-gradient(
      90deg,
      rgba(202, 47, 60, 0) 0%,
      rgba(153, 128, 26, 1) 50%,
      rgba(202, 47, 60, 0) 100%
    );
    z-index: 1;
  }
  &:before {
    width: 100%;
    height: 1px;
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    background: linear-gradient(
      90deg,
      rgba(202, 47, 60, 0) 0%,
      rgba(153, 128, 26, 1) 50%,
      rgba(202, 47, 60, 0) 100%
    );
    z-index: 1;
  }

  .CenterContent {
    width: 200px;
    height: 70px;
    display: flex;
    flex-direction: column;
    background: linear-gradient(30deg, #e0bd2f, rgba(255, 217, 68, 1), #e0bd2f);
    margin-top: 8px;
    clip-path: path("M 5,0 L 195,0 L 200,5 L 180,70 L 20,70 L 0,5 L 0,5 Z");
    z-index: 2;
    .Timer {
      height: 65%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      span {
        font-family: var(--span_font);
        font-weight: 100;
        font-size: 1.8rem;
        color: #887115;
      }
    }
    .RoundNumber {
      flex: 1;
      background: linear-gradient(0deg, #e0bd2f, #e0bd2f, #e0bd2f);
      border-top: 1px solid #f5d34c;
      display: flex;
      align-items: center;
      justify-content: center;
      span {
        font-family: var(--span_font);
        font-weight: 100;
        font-size: 1rem;
        color: #887115;
      }
    }
  }

  .OponentCard:first-child {
    /* transform: translate(-30px, 1px); */
  }
  .RoundNumber {
    background-color: var(--main_color);
    width: 100px;
    height: 30px;
    border-radius: 0px 0px 5px 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    h1 {
      font-family: var(--main_font);
      font-weight: 100;
      font-size: 1.3rem;
      color: white;
    }
  }
`;
interface ScoreBoardProps {
  net: Network | null;
  match: Match | null;
  startCinematicCamera: () => void;
  resetCamera: () => void;
}
const ScoreBoard = (props: ScoreBoardProps) => {
  const { toasts } = useAppContext();
  // Sounds
  const { countDownSound, countDownEndSound, ambianceSound } = useSounds();

  // Players
  const [host, setHost] = useState<MatchPlayer | null>(null);
  const [guest, setGuest] = useState<MatchPlayer | null>(null);

  // State
  const [gmaeStarteAt, setGameStartedAt] = useState<number | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [pauseBy, setPauseBy] = useState<string | null>(null);
  const [pauseCountdown, setPauseCountdown] = useState<number | null>(null);
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("waiting");

  // Time
  const [elapsed, setElapsed] = useState<number>(0);


  useEffect(() => {
    if (!props.match) return;
    setHost(
      props.match.opponent1.isHost
        ? props.match.opponent1
        : props.match.opponent2
    );
    setGuest(
      props.match.opponent1.isHost
        ? props.match.opponent2
        : props.match.opponent1
    );
  }, [props.match]);

  useEffect(() => {
    if (!props.net) return;
    props.net.on("phase:changed", setMatchPhase);
    props.net.on("countdown:updated", setCountdownValue);
    props.net.on("winner:declared", setWinnerId);
    props.net.on("gameStartAt", setGameStartedAt);

    props.net.on(
      "player:connected",
      (playerId: string, player: MatchPlayer) => {
        console.log("reachs");
        if (playerId === host?.id)
          setHost({
            ...host,
            isConnected: player.isConnected,
            pauseRequests: player.pauseRequests,
            remainingPauseTime: player.remainingPauseTime,
          });
        if (playerId === guest?.id)
          setGuest({
            ...guest,
            isConnected: player.isConnected,
            pauseRequests: player.pauseRequests,
            remainingPauseTime: player.remainingPauseTime,
          });
      }
    );
    props.net.on("player:disconnected", (playerId: string) => {
      if (playerId === host?.id && host)
        setHost({ ...host, isConnected: false, remainingPauseTime: 0 });
      if (playerId === guest?.id && guest)
        setGuest({ ...guest, isConnected: false, remainingPauseTime: 0 });
    });
    props.net.on("game:paused", (data) => {
      setPauseBy(data.by);
      console.log("Game paused", data.by);
    });
    props.net.on("game:pause-denied", (data) => {
      toasts?.addToastToQueue({
        type: "error",
        message: `Pause denied: ${data.reason}`,
        duration: 4000,
      });
    });
    props.net.on("game:pause-tick", (data) => {
      setPauseCountdown(data.remainingPauseTime);
    });

    // Time

  }, [props.net]);

  useEffect(() => {
    // todo : should be refactored
    const activeCountdown =
      matchPhase === "paused"
        ? pauseCountdown
        : matchPhase === "countdown"
        ? countdownValue
        : null;

    const lastPlayedRef = useRef<number | null>(null);
    const lastPausedRef = useRef<boolean>(false);

    // Handle pause sound — only play once when pause starts
    if (matchPhase === "paused" && !lastPausedRef.current) {
      if (ambianceSound.isMuffled) ambianceSound.setMuffled(false);
      ambianceSound.play();
      props.startCinematicCamera();
      lastPausedRef.current = true;
    } else if (matchPhase !== "paused") {
      ambianceSound.stop(2);
      props.resetCamera();
      lastPausedRef.current = false;
    }

    if (activeCountdown === 5 && matchPhase !== "paused") {
      ambianceSound.setMuffled(true);
      props.resetCamera();
    }

    // If no countdown, reset tracking and exit
    if (activeCountdown === null || activeCountdown === undefined) {
      lastPlayedRef.current = null;
      return;
    }

    // If countdown value hasn't changed, don't replay sounds
    if (lastPlayedRef.current === activeCountdown) return;

    // Play sounds based on countdown range
    if (activeCountdown > 1 && activeCountdown <= 4) {
      countDownSound.play();
    } else if (activeCountdown === 1) {
      countDownEndSound.play();
    }

    // Save last played value
    lastPlayedRef.current = activeCountdown;
  }, [countdownValue, pauseCountdown, matchPhase]);

  // Elapsed timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (matchPhase === "playing" && gmaeStarteAt) {
        setElapsed(Date.now() - gmaeStarteAt);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gmaeStarteAt]);

  return (
    <StyledScoreBoard>
      <OponentCard className="OponentCard">
        <div className="OponentScore">
          <span>10</span>
        </div>
        <img
          src={host?.avatarUrl || "/assets/avatar.jpg"}
          className="OponentCardAvatar"
        />
        <div className="OponentCardInfo">
          <h1 className="OponentCardUsername">
            {host?.username || "Player 1"}
            {!host?.isConnected && host && (
              <DisconnectedIcon fill="var(--red_color)" size={20} />
            )}
            {host?.id === pauseBy && matchPhase === "paused" && (
              <PauseIcon fill="var(--yellow_color)" size={20} />
            )}
            {matchPhase === "ended" && winnerId === host?.id && (
              <WinnerIcon size={30} />
            )}
          </h1>
        </div>
      </OponentCard>

      <div className="CenterContent">
        <div className="Timer">
          <span>
            {matchPhase === "playing"
              ? formatTime(elapsed)
              : matchPhase === "paused"
              ? pauseCountdown
              : matchPhase === "countdown"
              ? countdownValue
              : formatTime(elapsed)}
          </span>
        </div>

        <div className="RoundNumber">
          <span>
            {matchPhase === "countdown"
              ? "Get Ready!"
              : matchPhase === "paused"
              ? "Paused"
              : "Round 1"}
          </span>
        </div>
      </div>

      <OponentCard className="OponentCard" isRightSide={true}>
        <div className="OponentScore">
          <span>10</span>
        </div>
        <img
          src={guest?.avatarUrl || "/assets/avatar.jpg"}
          onError={(e: any) => console.log(e)}
          className="OponentCardAvatar"
        />
        <div className="OponentCardInfo">
          <h1 className="OponentCardUsername">
            {guest?.username || "Player 2"}
            {!guest?.isConnected && guest && (
              <DisconnectedIcon fill="var(--red_color)" size={20} />
            )}
            {guest?.id === pauseBy && matchPhase === "paused" && (
              <PauseIcon fill="var(--yellow_color)" size={20} />
            )}
            {matchPhase === "ended" && winnerId === guest?.id && (
              <WinnerIcon size={30} />
            )}
          </h1>
          <PaddleIcon size={20} fill="white" />
        </div>
      </OponentCard>
    </StyledScoreBoard>
  );
};

const OponentCard = styled("div")`
  height: 100%;
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: ${(props: any) =>
    props.isRightSide ? "row" : "row-reverse"};
  align-items: center;
  justify-content: ${(props: any) =>
    props.isRightSide ? "flex-start" : "flex-end"};
  .OponentCardAvatar {
    width: 40px;
    height: 40px;
    border-radius: 5px;
    z-index: 1;
  }
  .OponentCardInfo {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: ${(props: any) =>
      props.isRightSide ? "row" : "row-reverse"};
    align-items: center;
    gap: 10px;

    .OponentCardUsername {
      font-family: var(--squid_font);
      font-weight: 100;
      font-size: 1.3rem;
      color: #ffffff;
      display: flex;
      background: ${(props: any) =>
        props.isRightSide
          ? "linear-gradient(90deg, #e0bd2f, rgba(255, 217, 68, 0))"
          : "linear-gradient(90deg, rgba(255, 217, 68, 0), #e0bd2f)"};
      flex-direction: ${(props: any) =>
        props.isRightSide ? "row" : "row-reverse"};
      align-items: center;
      padding: 0px 5px;
      gap: 5px;
      justify-content: center;
    }
  }
  .OponentScore {
    background: ${(props: any) =>
      props.isRightSide
        ? "linear-gradient(90deg, #e0bd2f, rgba(255, 217, 68, 0))"
        : "linear-gradient(90deg, rgba(255, 217, 68, 0), #e0bd2f)"};

    width: 90px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: ${(props: any) => (props.isRightSide ? "0" : "10px")};
    padding-left: ${(props: any) => (props.isRightSide ? "10px" : "0")};
    margin-right: ${(props: any) => (props.isRightSide ? "0" : "-20px")};
    margin-left: ${(props: any) => (props.isRightSide ? "-20px" : "0")};

    span {
      font-family: var(--span_font);
      font-weight: 100;
      font-size: 1.4rem;
      color: white;
    }
  }
`;
export default ScoreBoard;

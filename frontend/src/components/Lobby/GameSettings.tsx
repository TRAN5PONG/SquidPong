import Zeroact, { useEffect, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import {
  AddIcon,
  CheckIcon,
  CoinIcon,
  GiveUpIcon,
  PauseIcon,
  PendingIcon,
  PowerUpsIcon,
  ScoreIcon,
} from "../Svg/Svg";
import { GameMode, Match, MatchPlayer } from "@/types/game/game";
import { GameSettings as GameSettingType } from "@/types/game/game";

import { useAppContext } from "@/contexts/AppProviders";

import { GameInvitation } from "@/types/game/game";
import { getRankMetaData } from "@/utils/game";
import { socketManager } from "@/utils/socket";
import { createAIMatch, getUserCurrentMatch } from "@/api/match";
import { useSounds } from "@/contexts/SoundProvider";
import Avatar from "../Tournament/Avatar";
import { InviteOponent } from "./InvitationModal";
import { useNavigate } from "@/contexts/RouterProvider";

const StyledGameSettings = styled("div")`
  width: 450px;
  min-height: 500px;
  z-index: 4;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  margin-left: -150px;
  .Container {
    z-index: 5;
    position: absolute;
    height: 100%;
    width: 100%;
    margin-left: 55px;
    display: flex;
    flex-direction: column;
    justify-content: center;

    select {
      width: 130px;
      height: 30px;
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      font-family: var(--main_font);
      outline: none;
      border: none;
      border-radius: 5px;
      padding: 5px;
      option {
        background-color: #262d41;
      }
      &:focus {
        outline: none;
      }
    }

    .GameSettings {
      flex: 1;
      padding-top: 60px;
      transform: skew(-10deg);
      .Option {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 25px;
        padding: 3px 10px;
        font-family: var(--main_font);
        .CoinsInput {
          outline: none;
          border: none;
          height: 30px;
          width: 130px;
          border-radius: 4px;
          font-family: var(--main_font);
          padding: 5px;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }
        span {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          .GameSettingsOptionCoinIcon {
            filter: grayscale(1);
            opacity: 0.7;
          }
        }
      }

      .ActionBtns {
        display: flex;
        gap: 5px;
      }
    }
    .MiniGameSettings {
      text-align: center;
      span {
        color: rgba(255, 255, 255, 0.5);
        font-family: var(--span_font);
        font-size: 1.1rem;
        text-align: center;
        margin-left: -45px;
      }
    }
    .TournamentModeSettings {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: var(--span_font);
      h2 {
        color: white;
        line-height: 1.2rem;
      }
      span {
        font-size: 1.2rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }
    .SelectedModeHeader {
      font-family: var(--main_font);
      color: rgba(255, 255, 255, 0.5);
      font-size: 1.2rem;
      text-align: center;
      display: block;
      width: 100%;
      background-image: linear-gradient(
        -90deg,
        rgba(141, 172, 245, 0) 3%,
        rgba(141, 172, 245, 0.3) 50%,
        rgba(141, 172, 245, 0) 90%
      );
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      line-height: 1rem;
      position: absolute;
      top: 0;
    }
    .GameCard {
      width: 100%;
      height: 100px;
      padding: 5px;
      margin-left: -60px;
      margin-bottom: 50px;
      padding: 10px;
      display: flex;
      gap: 5px;
      position: relative;
      transform: skew(0deg);
      align-items: center;
      justify-content: center;
      align-items: center;
      .GameStatus {
        color: rgba(255, 255, 255, 0.8);
        text-align: center;
        width: 100%;
        width: 80px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 3;
        position: relative;
        .VSText {
          width: 100%;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 2rem;
          font-family: var(--squid_font);
        }
        .MatchStatus {
          position: absolute;
          bottom: -15px;
          font-family: var(--main_font);
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
      }
      .Player {
        display: flex;
        align-items: center;
        flex: 1;
        gap: 10px;
        position: relative;
        .PlayerInfo {
          display: flex;
          gap: 5px;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          height: 100%;
          span {
            margin: 0;
          }
          .PlayerInfoName {
            display: flex;
            align-items: center;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            gap: 5px;
          }
          .PlayerInfoStatus {
            font-family: var(--main_font);
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.8rem;
            line-height: 1rem;
            margin-left: 10px;
          }
        }

        h2 {
          font-family: var(--squid_font);
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          font-size: 1.2rem;
          line-height: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
      }
      .Player.Opponent1 {
        flex-direction: row-reverse;
        justify-content: flex-end;
        align-items: center;
        .PlayerInfo {
          align-items: flex-end;
        }
      }
      .Player.Opponent2 .PlayerInfo .PlayerInfoStatus{
margin-left: 0px;
      }
      .Player.Opponent2 .InviteIcon {
        cursor: pointer;
        position: absolute;
        left: 10px;
      }
    }
    .GameCard.Hide {
      display: none;
    }
    .ActionBtns {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-right: 20px;
      .ResignBtn {
        width: 160px;
        height: 40px;
        gap: 5px;
        clip-path: path(
          "M 0,0 L 150,0 L 160,10 L 160,40 L 15,40 L 0,25 L 0,0 Z"
        );
        transform: skew(-10deg);
        background-color: var(--red_color);
        color: white;
        font-family: var(--squid_font);
        cursor: pointer;
        font-size: 1.1rem;
        outline: none;
        border: none;
        transition: 0.2s ease-in-out;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        &:hover {
          background-color: rgba(255, 0, 0, 1);
        }
      }
      .ReadyBtn {
        width: 160px;
        height: 40px;
        clip-path: path(
          "M 0,0 L 150,0 L 160,10 L 160,40 L 15,40 L 0,25 L 0,0 Z"
        );
        transform: skew(-10deg);
        background-color: rgba(45, 56, 82, 1);
        color: white;
        font-family: var(--squid_font);
        cursor: pointer;
        font-size: 1.1rem;
        outline: none;
        border: none;
        transition: 0.2s ease-in-out;
        display: flex;
        gap: 5px;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        &:hover {
          background-color: #8dacf5;
        }
      }
      .ReadyBtn.ready {
        background-color: rgb(141, 172, 245);
      }
    }
  }
  &:before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    clip-path: path(
      "M 0,0 L 420,0 L 450,30 L 450,500 L 60,500 L 0,440 L 0,0 Z"
    );
    transform: skew(-10deg);
    border: 1px solid rgba(101, 121, 168, 0.1);
    background: rgba(45, 56, 82, 0.7);
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
  }
`;
interface GameSettingsProps {
  selectedMode: GameMode | null;
  setSelectedMode: (mode: GameMode | null) => void;
}
const GameSettings = (props: GameSettingsProps) => {
  // Sounds
  const { errorSound, readySound, notificationSound } = useSounds();
  // Settings
  const [selectedGameSettings, setSelectedGameSettings] =
    Zeroact.useState<GameSettingType>({
      requiredCurrency: 0,
      rules: {
        maxScore: 5,
        pauseTime: 30,
        allowPowerUps: false,
      },
    });
  const [aiDifficulty, setAiDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    "EASY"
  );
  // Invitations
  const [SelectedInvitation, setSelectedInvitation] =
    useState<GameInvitation | null>(null);

  const { toasts, user, match, inviteModal } = useAppContext();
  const navigate = useNavigate();
  const { currentMatch, setCurrentMatch } = match;

  // Match Ready
  const [userPlayer, setUserPlayer] = useState<MatchPlayer | null>(null);
  const [OpponentPlayer, setOpponentPlayer] = useState<MatchPlayer | null>(
    null
  );

  /**
   * Ai
   */
  const handleCreateAIMatch = async () => {
    try {
      const resp = await createAIMatch(aiDifficulty);
      if (resp.data)
        toasts.addToastToQueue({ message: "match created!", type: "success" });
      else
        toasts.addToastToQueue({
          message: "failed to create match",
          type: "error",
        });
    } catch (err: any) {
      console.log(err);
    }
  };
  const OnReadyClick = () => {
    if (!props.selectedMode && !match) {
      toasts.addToastToQueue({
        type: "error",
        message: "Please select a game mode first.",
      });
      return;
    }
    if (!match && props.selectedMode === "ONE_VS_ONE") {
      toasts.addToastToQueue({
        type: "error",
        message: "Please invite an opponent first.",
      });
      return;
    }
    if (match.currentMatch?.status !== "WAITING") {
      toasts.addToastToQueue({
        type: "error",
        message: "Match is not in a ready state.",
      });
      return;
    }

    readySound.play();
    setUserPlayer((prev) => {
      if (!prev) return prev;
      return { ...prev, isReady: !prev.isReady };
    });
    if (props.selectedMode === "ONE_VS_AI")
      return;
    if (match.currentMatch?.opponent1.userId === user?.id) {
      socketManager.sendMessage({
        type: "game",
        data: {
          event: "match-player-update",
          matchId: match.currentMatch?.id,
          playerId: match.currentMatch?.opponent1.id,
        },
      });
    } else if (match.currentMatch?.opponent2.userId === user?.id) {
      socketManager.sendMessage({
        type: "game",
        data: {
          event: "match-player-update",
          matchId: match.currentMatch?.id,
          playerId: match.currentMatch?.opponent2.id,
        },
      });
    }
  };
  const onResignClick = () => {
    onReturnClick();
    socketManager.sendMessage({
      type: "game",
      data: {
        event: "match-give-up",
        matchId: match.currentMatch?.id,
        playerId: userPlayer?.id,
      },
    });
  };
  const onReturnClick = () => {
    setCurrentMatch(null);
    setUserPlayer(null);
    setOpponentPlayer(null);
    props.setSelectedMode(null);
  };

  // Set User/Opponent Player
  useEffect(() => {
    if (!currentMatch || !user) return;
    const userIsOpponent1 = currentMatch.opponent1.userId === user.id;
    setUserPlayer(
      userIsOpponent1 ? currentMatch.opponent1 : currentMatch.opponent2
    );
    setOpponentPlayer(
      userIsOpponent1 ? currentMatch.opponent2 : currentMatch.opponent1
    );
  }, [currentMatch, user]);

  // Check for pending match on load
  useEffect(() => {
    if (!user) return;

    // check if user already have a pending match
    const getIPMatch = async () => {
      try {
        const matchIP = await getUserCurrentMatch(user.userId);
        if (matchIP) {
          // if (matchIP.data.status === "IN_PROGRESS")
          // {
          //   toasts.addToastToQueue({
          //     type: "info",
          //     message:
          //       "You have a match in progress. Redirecting you to the game...",
          //     duration: 4000,
          //   });
          //   setTimeout(() => {
          //     window.location.href = "/game";
          //   }, 3000);
          // }
          setCurrentMatch(matchIP.data);
          props.setSelectedMode(matchIP.data.mode);
          setSelectedGameSettings({
            requiredCurrency: matchIP.data.matchSetting.requiredCurrency,
            rules: {
              maxScore: matchIP.data.matchSetting.scoreLimit,
              pauseTime: matchIP.data.matchSetting.pauseTime,
              allowPowerUps: matchIP.data.matchSetting.allowPowerUps,
            },
          });
          console.log("Pending match found:", matchIP);
        } else {
          console.log("No pending match found");
        }
      } catch (err) {
        // console.error("Error fetching pending match:", err);
      }
    };
    getIPMatch();
  }, [user]);

  useEffect(() => {
    const handleMatchUpdate = (data: { match: Match }) => {
      const { match } = data;
      if (match.status === "CANCELLED") {
        notificationSound.play();
        inviteModal.setSelectedInvitation(null);
        setCurrentMatch(match);
        toasts.addToastToQueue({
          type: "info",
          message: "The match has been cancelled.",
        });
        return;
      }

      setCurrentMatch(match);
    };
    const handleMatchPlayerUpdate = (data: { matchPlayer: MatchPlayer }) => {
      const { matchPlayer } = data;
      notificationSound.play();

      setOpponentPlayer(matchPlayer);
    };
    socketManager.subscribe("match-player-update", handleMatchPlayerUpdate);
    socketManager.subscribe("match-update", handleMatchUpdate);
    return () => {
      socketManager.unsubscribe("match-player-update", handleMatchPlayerUpdate);
      socketManager.unsubscribe("match-update", handleMatchUpdate);
    };
  }, []);

  useEffect(() => {
    console.log(aiDifficulty);
  }, [aiDifficulty]);

  return (
    <StyledGameSettings
      oponentOneAvatar={userPlayer?.avatarUrl || user?.avatar}
      oponentTwoAvatar={OpponentPlayer?.avatarUrl}
    >
      <div className="Container">
        <span className="SelectedModeHeader">
          {props.selectedMode ? `${props.selectedMode}` : "No mode selected"}
        </span>

        {props.selectedMode === "TOURNAMENT" ? (
          <div className="TournamentModeSettings GameSettings">
            {/* <h2>world cup</h2>
            // <span>Round 2</span> */}
            <span>you didn't join any tournament yet.</span>
          </div>
        ) : props.selectedMode === "ONE_VS_ONE" ? (
          <div className="GameSettings">
            <div className="Option">
              <span>
                <CoinIcon
                  fill="rgba(255, 255, 255, 0.5)"
                  size={20}
                  className="GameSettingsOptionCoinIcon"
                />
                Coins:
              </span>
              <input
                type="number"
                className="CoinsInput"
                placeholder="Coins"
                onChange={(e: any) =>
                  setSelectedGameSettings((prev) => ({
                    ...prev,
                    requiredCurrency: parseInt(e.target.value, 10) || 0,
                  }))
                }
                step="100"
                value={
                  SelectedInvitation
                    ? SelectedInvitation.requiredCurrency
                    : selectedGameSettings.requiredCurrency
                }
                min="0"
                max="10000"
                disabled={currentMatch}
              />
            </div>
            <div className="Option">
              <span>
                <ScoreIcon fill="rgba(255, 255, 255, 0.5)" size={20} />
                Max Score :
              </span>
              <select
                className="ScoreLimit"
                onChange={(e: any) => {
                  setSelectedGameSettings((prev: any) => ({
                    ...prev,
                    rules: {
                      ...prev.rules,
                      maxScore: Number(e.target.value),
                    },
                  }));
                }}
                value={
                  SelectedInvitation
                    ? SelectedInvitation.scoreLimit
                    : selectedGameSettings.rules.maxScore
                }
                disabled={currentMatch}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
            </div>
            <div className="Option">
              <span>
                <PauseIcon fill="rgba(255, 255, 255, 0.5)" size={20} />
                Pause Time :
              </span>
              <select
                className="PauseTime"
                onChange={(e: any) => {
                  setSelectedGameSettings((prev: any) => ({
                    ...prev,
                    rules: {
                      ...prev.rules,
                      pauseTime: Number(e.target.value),
                    },
                  }));
                }}
                value={
                  SelectedInvitation
                    ? SelectedInvitation.pauseTime
                    : selectedGameSettings.rules.pauseTime
                }
                disabled={currentMatch}
              >
                <option value="30">30 seconds</option>
                <option value="60">60 seconds</option>
                <option value="90">90 seconds</option>
              </select>
            </div>
            <div className="Option">
              <span>
                <PowerUpsIcon fill="rgba(255, 255, 255, 0.5)" size={20} />
                allow Power-Ups
              </span>
              <input
                type="checkbox"
                checked={
                  SelectedInvitation?.allowPowerUps ??
                  selectedGameSettings.rules.allowPowerUps
                }
                onChange={(e: any) => {
                  setSelectedGameSettings((prev: any) => ({
                    ...prev,
                    rules: {
                      ...prev.rules,
                      allowPowerUps: e.target.checked,
                    },
                  }));
                }}
                disabled={currentMatch}
              />
            </div>
          </div>
        ) : props.selectedMode === "ONE_VS_AI" ? (
          <div className="_ONE_VS_AISettings GameSettings">
            <div className="Option">
              <span>Difficulty</span>
              <select
                className="ModeDifficulty"
                value={aiDifficulty}
                onChange={(e: any) => {
                  setAiDifficulty(e.target.value);
                }}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD ">Hard</option>
              </select>
            </div>
          </div>
        ) : props.selectedMode === "BounceChallenge" ? (
          <div className="MiniGameSettings GameSettings">
            <span> No settings available for this mode.</span>
          </div>
        ) : (
          <div className="MiniGameSettings GameSettings">
            <span>Select a game mode to see the settings.</span>
          </div>
        )}

        <div
          className={`GameCard ${props.selectedMode === "BounceChallenge" ? "Hide" : ""
            }`}
        >
          <div className="Player Opponent1">
            <Avatar
              avatarUrl={userPlayer?.avatarUrl || user?.avatar}
              rank={
                getRankMetaData(user?.rankDivision!, user?.rankTier!) ||
                undefined
              }
            />
            <div className="PlayerInfo">
              <h2>{userPlayer?.username || user?.username}</h2>
              <span className="PlayerInfoStatus">
                {userPlayer?.isReady ? "Ready" : "Not Ready"}
              </span>
            </div>
          </div>
          <div className="GameStatus">
            <span className="VSText">VS</span>
            <span className="MatchStatus">{currentMatch?.status}</span>
          </div>
          <div className="Player Opponent2">
            <Avatar
              avatarUrl={OpponentPlayer?.avatarUrl}
              rank={
                getRankMetaData(
                  OpponentPlayer?.rankDivision!,
                  OpponentPlayer?.rankTier!
                ) || undefined
              }
              preview={!OpponentPlayer?.avatarUrl}
            />
            {props.selectedMode === "ONE_VS_ONE" && !OpponentPlayer && (
              <a
                onClick={() => inviteModal.setIsInviteModalOpen(true)}
                className="InviteIcon"
              >
                <AddIcon fill="rgba(255, 255, 255, 0.8)" size={30} />
              </a>
            )}
            <div className="PlayerInfo" key={OpponentPlayer?.id}>
              <h2>
                {props.selectedMode === "ONE_VS_AI"
                  ? "AI Opponent"
                  : OpponentPlayer?.username
                    ? OpponentPlayer?.username
                    : "No Opponent"}
              </h2>
              <span className="PlayerInfoStatus">
                {OpponentPlayer?.isReady || props.selectedMode === "ONE_VS_AI"
                  ? "Oponent Ready"
                  : OpponentPlayer?.isReady
                    ? "Ready"
                    : "Not Ready"}
              </span>
            </div>
          </div>
        </div>
        <div className="ActionBtns">
          {match.currentMatch?.status === "WAITING" ? (
            <button className="ResignBtn" onClick={onResignClick}>
              Resign
              <GiveUpIcon fill="white" size={20} />
            </button>
          ) : match.currentMatch?.status === "CANCELLED" ? (
            <button className="ResignBtn" onClick={onReturnClick}>
              Return
            </button>
          ) : null}

          {match.currentMatch?.status === "WAITING" ? (
            <button
              className={`ReadyBtn ${userPlayer?.isReady ? "ready" : ""}`}
              onClick={OnReadyClick}
            >
              Ready
              {userPlayer?.isReady ? (
                <CheckIcon fill="white" size={20} />
              ) : (
                <PendingIcon fill="white" size={20} />
              )}
            </button>
          ) : currentMatch?.status === "IN_PROGRESS" ? (
            <button
              className={`ReadyBtn`}
              onClick={() => navigate(`/game/${match.currentMatch?.id}`)}
            >
              Back to Game
            </button>
          ) : null}

          {props.selectedMode === "ONE_VS_AI" && !currentMatch ? (
            <button
              className={`ReadyBtn ${userPlayer?.isReady ? "ready" : ""}`}
              onClick={handleCreateAIMatch}
            >
              Create
            </button>
          ) : null}
        </div>
      </div>

      {/* {isInviteOponentOpen && (
        <InviteOponent
          onClose={() => {
            setIsInviteOponentOpen(false);
          }}
          GameSettings={selectedGameSettings}
          selectedInvitation={SelectedInvitation}
          setSelectedInvitation={setSelectedInvitation}
          setSelectedMatch={setCurrentMatch}
          setSelectedMode={props.setSelectedMode}
        />
      )} */}
    </StyledGameSettings>
  );
};

export default GameSettings;

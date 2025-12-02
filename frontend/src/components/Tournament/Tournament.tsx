import { db } from "@/db";
import Zeroact, { useEffect } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import {
  ChallengeIcon,
  CoinIcon,
  DeleteIcon,
  GroupIcon,
  LiveIcon,
  PendingIcon,
  ScoreIcon,
  SignOutIcon,
  TrophyIcon,
  VerifiedIcon,
} from "../Svg/Svg";
import { getNumberOfRounds, getPlayersInRound } from "@/utils/Tournament";
import { useRouteParam } from "@/hooks/useParam";
import NotFound from "../NotFound/NotFound";
import { getRankMetaData } from "@/utils/game";
import { timeAgo, timeUntil } from "@/utils/time";
import {
  TournamentMatch as TournamentMatchType,
  Tournament as TournamentType,
  TournamentPlayer as TournamentPlayerType,
  TournamentStatus,
  TournamentRound,
} from "@/types/game/tournament";
import { RankDivision } from "@/types/game/rank";
import {
  deleteTournament,
  getTournament,
  joinTournament,
  launchTournament,
  leaveTournament,
  resetTournament,
} from "@/api/tournament";
import { useNavigate } from "@/contexts/RouterProvider";
import { useAppContext } from "@/contexts/AppProviders";
import { Button } from "@babylonjs/inspector/components/Button";
import { StyledTournamentCardAvatar } from "./Tournaments";
import { Length } from "@babylonjs/core";
import Avatar from "./Avatar";
import { socketManager } from "@/utils/socket";

const StyledTournament = styled("div")`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  font-family: var(--main_font);
  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;

  h1 {
  }
  .TournamentHeader {
    font-family: var(--main_font);
    width: 100%;
    min-height: 30%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0px 10%;
    position: relative;
    margin-top: 55px;
    gap: 10px;
    position: relative;
    &:after {
      width: 100%;
      height: 100%;
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      background-image: linear-gradient(
          0deg,
          rgba(19, 18, 23, 1) 0%,
          rgba(19, 18, 23, 0.95) 50%,
          rgba(19, 18, 23, 0) 100%
        ),
        url("/assets/TournamentAvatar.jpg");
      background-position: center;
      background-size: cover;
      filter: grayscale(1);
      z-index: -1;
    }

    .LogoContainer {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 200px;
      height: 250px;
      background-color: rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      .TrophyImg {
        width: 90%;
        height: auto;
      }
    }
    .TournamentInfo {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      .UpperInfo {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 15px;
        .TournamentTitle {
          font-size: 2rem;
          font-weight: 600;
          text-align: center;
          font-family: var(--squid_font);
        }
        .TournamentParticipantsInfo {
          display: flex;
        }
      }
      .LowerInfo {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        .TournamentDescription {
          span {
            font-size: 1rem;
            font-family: var(--span_font);
          }
        }
        .TournamentDetails {
          display: flex;
          gap: 15px;
          .TournamentDetailItem {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.9rem;
            span {
              font-family: var(--span_font);
              line-height: 0px;
              color: rgba(255, 255, 255, 0.6);
            }
          }
        }
      }
    }
    .TournamentOrganizer {
      width: 20%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .OrganizerInfo {
        display: flex;
        width: 100%;
        align-items: center;
        gap: 5px;
        margin-left: 5px;
        span {
          font-size: 0.9rem;
          font-family: var(--main_font);
        }
        .OrganizerAvatar {
          width: 30px;
          height: 30px;
          border-radius: 5px;
          background-color: lightgray;
        }
      }
      .TournamentActions {
        position: absolute;
        bottom: 15px;
        right: 10%;
        display: flex;
        height: 40px;
        justify-content: flex-start;
        gap: 5px;
        display: flex;
        .LaunchTournamentBtn {
          padding: 10px 20px;
          border-radius: 5px;
          background-color: var(--main_color);
          border: none;
          color: white;
          font-size: 1.1rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
          font-family: var(--squid_font);
          display: flex;
          align-items: center;
          gap: 10px;
          &:hover {
            background-color: var(--main_color_hover);
          }
        }
        .LeaveTournamentBtn {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          border-radius: 5px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 1.1rem;
          font-family: var(--squid_font);
          background-color: transparent;
          color: rgba(255, 255, 255, 0.9);
          &:hover {
            background-color: rgba(255, 0, 0, 0.2);
          }
        }
        .DeleteTournamentBtn {
          padding: 10px 20px;
          border-radius: 5px;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
          font-family: var(--squid_font);
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 1.1rem;
          font-family: var(--squid_font);
          background-color: transparent;
          color: rgba(255, 255, 255, 0.9);
          &:hover {
            background-color: rgba(255, 0, 0, 0.2);
          }
        }
        .ParticipateBtn {
          padding: 10px 20px;
          border-radius: 5px;
          background-color: var(--main_color);
          border: none;
          color: white;
          font-size: 1.1rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
          font-family: var(--squid_font);
          display: flex;
          align-items: center;
          gap: 10px;
          &:hover {
            background-color: var(--main_color_hover);
          }
        }
      }
    }
  }
  .TournamentNavbar {
    width: 80%;
    min-height: 50px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    z-index: 999;
    .NavItem {
      flex: 1;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.1rem;
      font-family: var(--squid_font);
      &:hover {
        background-color: rgba(255, 255, 255, 0.03);
      }
      &.active {
        background-color: var(--bg_color_super_light);
        font-weight: 600;
      }
    }
  }

  .OverviewMode {
    flex: 1;
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0px 10%;
    .TournamentBracket {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(
        0deg,
        var(--bg_color_super_light) 0%,
        transparent 100%
      );

      .TournamentBrackeContainer {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        gap: 20px;
        user-select: none;
        width: 100%;
        height: 100%;
        padding: 55px 0px;

        &:active {
          cursor: grabbing;
        }
      }

      .FinalGame {
        position: absolute;
        left: 50%;
        bottom: 10%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        .FinalScoreBoard {
          display: flex;
          position: relative;
          display: flex;
          justify-content: center;
          .TrophyIcon {
            position: absolute;
            top: -20px;
            z-index: 3;
          }
          .FinalText {
            padding: 0px 10px;
            height: 40px;
            /* background: linear-gradient( 90deg, rgba(255, 217, 68, 1) 0%, rgba(255, 156, 45, 1) 100%); */
            position: absolute;
            bottom: -90%;
            z-index: -1;
            border-radius: 0px 0px 5px 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-transform: uppercase;
            font-weight: 600;
            font-size: 0.7rem;
            color: var(--main_color);
          }
        }
      }

      .Round {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-around;
        height: 100%;
        position: relative;

        .RoundGame {
          display: flex;
          flex-direction: column;
          position: relative;
          justify-content: center;
          gap: 30px;
          position: relative;
          &:before {
            position: absolute;
            content: "";
            width: 20px;
            border: 1px solid var(--main_color);
            border-left: none;
            right: -40px;
            border-radius: 4px;
          }
          &:after {
            position: absolute;
            border-radius: 4px;
            content: "";
            height: 50%;
            width: 20px;
            border: 1px solid var(--main_color);
            border-left: none;
            right: -15px;
            z-index: 1;
          }

          &[players-count="4"] {
            &:before {
              height: 200px;
            }
          }
          &[players-count="8"] {
            &:before {
              height: 80px;
            }
          }
          &[players-count="16"] {
            &:before {
              height: 40px;
            }
          }
          &[players-count="2"] {
            &:before {
              display: none;
            }
          }

          &:nth-child(even) {
            &:before {
              border-top: none;
              bottom: 40px;
            }
          }
          &:nth-child(odd) {
            &:before {
              border-bottom: none;
              top: 40px;
            }
          }

          .GameStatus {
            position: absolute;
            top: 100%;
            left: 20px;
            width: 160px;
            height: 40px;
            background: linear-gradient(
              0deg,
              rgba(202, 47, 60, 0.3) 0%,
              transparent 100%
            );
            clip-path: path("M 10,0 L 160,0 L 160,30 L 150,40 L 0,40 L 0,10 Z");
            /* background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0) 100%
          ); */
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 5px;
            .GameStatusText {
              font-size: 0.8rem;
            }
          }
        }

        .RoundGame:first-child {
          position: relative;
        }
        .RoundGame.Reversed {
          flex-direction: column-reverse;
          &:after {
            left: -15px;
            right: auto;
            border: 1px solid var(--main_color);
            border-right: none;
          }
          &:before {
            position: absolute;
            content: "";
            width: 20px;
            border: 1px solid var(--main_color);
            border-right: none;
            left: -40px;
            z-index: 1;
          }
          &:nth-child(even) {
            &:before {
              border-top: none;
            }
          }
          &:nth-child(odd) {
            &:before {
              border-bottom: none;
            }
          }
        }
      }
    }
  }
  .MatchesMode {
    flex: 1;
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0px 10%;

    .MatchesList {
      width: 100%;
      height: 100%;
      background: linear-gradient(
        0deg,
        var(--bg_color_super_light) 0%,
        transparent 100%
      );
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 10px;
    }
  }
  .PlayersMode {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 0px 10%;

    .PlayersList {
      padding: 10px 0px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      .TournamentPlayer {
        width: 400px;
        height: 60px;
        background-color: var(--bg_color_super_light);
        border-radius: 5px;
        padding: 2px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        gap: 10px;
        overflow: hidden;
        .TournamentPlayerAvatar {
          width: 55px;
          height: 100%;
          background-color: lightgray;
          border-radius: 5px;
          background-size: cover;
          background-position: center;
        }
        .TournamentPlayerInfo {
          display: flex;
          flex-direction: column;
          .UserFullName {
            font-family: var(--squid_font);
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: center;
            .EliminatedSPN {
              font-size: 0.8rem;
              color: var(--main_color);
            }
          }
          .UserName {
            font-family: var(--span_font);
            color: rgba(255, 255, 255, 0.6);
            margin-top: -5px;
            font-size: 0.8rem;
          }
        }
        .UserRankInfo {
          width: 60px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          img {
            height: 90%;
          }
        }
      }
    }
  }
  .TournamentPlayers {
    width: 80%;
    display: flex;
    flex-direction: column;
    gap: 3px;
    align-items: center;
    justify-content: center;
    padding: 5px;
    position: relative;
    .PlayersList {
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
      max-height: 400px;
    }
  }
`;
const Tournament = () => {
  const tournamentId = useRouteParam("/tournament/:id", "id");
  const [isTournamentNotFound, setIsTournamentNotFound] =
    Zeroact.useState(false);
  const [tournament, setTournament] = Zeroact.useState<TournamentType | null>(
    null
  );
  const [currentMode, setCurrentMode] = Zeroact.useState<
    "OVERVIEW" | "MATCHES" | "PLAYERS"
  >("MATCHES");

  /**
   * Contexts
   */
  const { user, toasts } = useAppContext();
  const navigate = useNavigate();

  /**
   * Effects
   */
  useEffect(() => {
    socketManager.subscribe("tournament-update", (data: any) => {
      setTournament(data.tournament);
      if (data.isDeleted) navigate("/tournaments");
    });

    return () => {
      socketManager.unsubscribe("tournament-update", () => {});
    };
  }, []);
  useEffect(() => {
    if (tournamentId != null) {
      const getTournamentData = async () => {
        try {
          const resp = await getTournament(tournamentId);
          console.log("Tournament data response:", resp);
          if (resp.success && resp.data) {
            setTournament(resp.data);
          } else {
            setIsTournamentNotFound(true);
          }
        } catch (error) {
          console.error("Error fetching tournament data:", error);
          setIsTournamentNotFound(true);
        }
      };

      getTournamentData();
    }
  }, [tournamentId]);

  /**
   * Handlers
   */
  const handleLaunchTournament = async () => {
    if (!tournamentId) return;

    try {
      const resp = await launchTournament(tournamentId);
      if (resp.success && resp.data) {
        setTournament(resp.data);
      } else throw new Error(resp.message || "Failed to launch tournament");
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message: (err.message as string) || "Error starting tournament",
      });
    }
  };
  const handleDeleteTournament = async () => {
    try {
      const resp = await deleteTournament(tournamentId!);
      if (resp.success) {
        toasts.addToastToQueue({
          type: "success",
          message: "Tournament deleted successfully",
        });
        setTimeout(() => {
          navigate("/tournaments");
        }, 500);
      } else throw new Error(resp.message || "Failed to delete tournament");
    } catch (err) {
      toasts.addToastToQueue({
        type: "error",
        message: "Error deleting tournament",
      });
    }
  };
  const handleLeaveTournament = async () => {
    try {
      const resp = await leaveTournament(tournamentId!, user!.userId);
      if (resp.success && resp.data) {
        setTournament(resp.data);
        toasts.addToastToQueue({
          type: "success",
          message: "Left tournament successfully",
        });
      } else throw new Error(resp.message || "Failed to leave tournament");
    } catch (err) {
      toasts.addToastToQueue({
        type: "error",
        message: "Error leaving tournament",
      });
    }
  };
  const handleResetTournament = async () => {
    try {
      const resp = await resetTournament(tournamentId!);
      if (resp.success && resp.data) {
        setTournament(resp.data);
        toasts.addToastToQueue({
          type: "success",
          message: "Tournament reset successfully",
        });
      } else throw new Error(resp.message || "Failed to reset tournament");
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message: err.message || "Error resetting tournament",
      });
    }
  };
  const handleParticipateInTournament = async () => {
    try {
      const resp = await joinTournament(tournamentId!, user!.userId);

      if (resp.success && resp.data) {
        toasts.addToastToQueue({
          type: "success",
          message: "Participated in tournament successfully",
        });
        setTournament(resp.data);
      } else
        throw new Error(resp.message || "Failed to participate in tournament");
    } catch (err) {
      console.error("Error participating in tournament:", err);
    }
  };
  const handleTournamentMatchEnded = async (
    matchId: string,
    winnerId: string,
    loserId: string
  ) => {
    try {
      alert(matchId);
      const resp = await fetch(
        `https://10.13.3.5:4433/api/game/tournament/${tournamentId}/match/${matchId}/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            winnerId,
            loserId,
            winnerScore: 10,
            loserScore: 5,
          }),
        }
      );
      const data = await resp.json();
      if (data.success) {
        toasts.addToastToQueue({
          type: "success",
          message: "Tournament match updated successfully",
        });
      } else
        throw new Error(data.message || "Failed to update tournament match");
    } catch (err) {
      toasts.addToastToQueue({
        type: "error",
        message: "Error updating tournament match",
      });
    }
  };

  if (isTournamentNotFound) return <NotFound />;
  if (!tournament) return <h1>loading</h1>;

  // Render Round Games
  const getPlayer = (id: string | undefined) =>
    tournament.participants.find((p) => p.id === id) || {
      id: "",
      userId: "",
      userName: "TBD",
      isEliminated: false,
      isReady: false,
      tournamentId: "",
      firstName: "",
      lastName: "",
    };
  const renderRoundGames = (
    Matches: TournamentMatchType[],
    reverse = false,
    round: number
  ) => {
    const isSemiFinal = Matches.length === 1;
    const playersCount = Matches.length * 2;

    const matches = Matches.map((game) => {
      const player1 = getPlayer(game.opponent1Id);
      const player2 = getPlayer(game.opponent2Id);
      console.log("Rendering game:", game.matchId);

      return (
        <div
          className={`RoundGame ${reverse ? "Reversed" : ""} ${
            isSemiFinal ? "SemiFinal" : ""
          }`}
          data-round={round + 1}
          players-count={playersCount}
          key={`${game.opponent1Id}-${game.opponent2Id}`}
          onClick={() =>
            handleTournamentMatchEnded(
              game.matchId,
              player1.userId,
              player2.userId
            )
          }
        >
          <TournamentPlayer
            {...player1}
            reversed={reverse}
            Score={game.opponent1Score}
          />
          <TournamentPlayer
            {...player2}
            reversed={reverse}
            Score={game.opponent2Score}
          />
        </div>
      );
    });

    return reverse ? matches.reverse() : matches;
  };

  const totalRounds = getNumberOfRounds(tournament?.maxPlayers);
  const getMatchesForRound = (roundIndex: number, maxPlayers: number) => {
    const totalRounds = Math.log2(maxPlayers);
    return Math.pow(2, totalRounds - roundIndex - 1);
  };

  /**
   * Final match
   */
  const FinalMatch =
    tournament.rounds?.find((r) => r.name === "FINAL")?.matches?.[0] ?? null;

  const isOrganizer = Number(user?.userId) === Number(tournament.organizerId);
  const isParticipant = tournament.participants.find(
    (p) => Number(p.userId) === Number(user?.userId)
  );

  return (
    <StyledTournament className="scroll-y">
      <div className="TournamentHeader">
        <div className="LogoContainer">
          <img src={"/assets/TournamentTrophy.png"} className="TrophyImg" />
        </div>
        <div className="TournamentInfo">
          <div className="UpperInfo">
            <h1 className="TournamentTitle">{tournament.name}</h1>
            <div className="TournamentParticipantsInfo">
              {tournament.participants.slice(0, 3).map((participant) => {
                return (
                  <StyledTournamentCardAvatar avatar={participant.avatar} />
                );
              })}
              {tournament.participants.length > 3 && (
                <StyledTournamentCardAvatar className="Extra">
                  +{tournament.participants.length - 3}
                </StyledTournamentCardAvatar>
              )}
            </div>
          </div>
          <div className="LowerInfo">
            <div className="TournamentDescription">
              <span>{tournament.description}</span>
            </div>
            <div className="TournamentDetails">
              <div className="TournamentDetailItem">
                <GroupIcon fill="white" size={20} />
                <span>
                  {tournament.participants.length} / {tournament.maxPlayers}
                </span>
              </div>
              <div className="TournamentDetailItem">
                <TrophyIcon fill="white" size={20} />
                <span>
                  Prize Pool :
                  {tournament.participationFee
                    ? tournament.participationFee * tournament.maxPlayers +
                      " coins"
                    : "No Prize Pool"}
                </span>
              </div>
              <div className="TournamentDetailItem">
                <CoinIcon fill="white" size={20} />
                <span>
                  Entry Fee:
                  {tournament.participationFee
                    ? tournament.participationFee + "coins"
                    : "free"}
                </span>
              </div>
              <div className="TournamentDetailItem">
                <ScoreIcon fill="white" size={20} />
                <span>
                  status :
                  {tournament.status === "REGISTRATION"
                    ? "Registration Open"
                    : tournament.status === "IN_PROGRESS"
                    ? "In Progress" + tournament.currentRound
                    : tournament.status === "COMPLETED"
                    ? "Completed"
                    : "Cancelled"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="TournamentOrganizer">
          <div className="OrganizerInfo">
            <span>oganized by: </span>
            <div className="OrganizerAvatar" />
            <span>@ZERO</span>
          </div>
          <div className="TournamentActions">
            {isParticipant ? (
              <button
                className="LeaveTournamentBtn"
                onClick={handleLeaveTournament}
              >
                <SignOutIcon fill="white" size={20} />
                Leave
              </button>
            ) : (
              <button
                className="ParticipateBtn"
                onClick={handleParticipateInTournament}
              >
                Participate
              </button>
            )}
            {isOrganizer && (
              <button
                className="DeleteTournamentBtn"
                onClick={handleDeleteTournament}
              >
                <DeleteIcon fill="white" size={20} />
                Delete
              </button>
            )}
            {isOrganizer && (
              <button
                className="LaunchTournamentBtn"
                onClick={handleLaunchTournament}
              >
                <ChallengeIcon fill="white" size={20} />
                Launch
              </button>
            )}
            {isOrganizer && (
              <button
                className="LaunchTournamentBtn"
                onClick={handleResetTournament}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="TournamentNavbar">
        <div
          className={`NavItem ${currentMode === "OVERVIEW" && "active"}`}
          onClick={() => setCurrentMode("OVERVIEW")}
        >
          Overview
        </div>
        <div
          className={`NavItem ${currentMode === "MATCHES" && "active"}`}
          onClick={() => setCurrentMode("MATCHES")}
        >
          Matches
        </div>
        <div
          className={`NavItem ${currentMode === "PLAYERS" && "active"}`}
          onClick={() => setCurrentMode("PLAYERS")}
        >
          Players
        </div>
      </div>

      {currentMode === "OVERVIEW" ? (
        <div className="OverviewMode">
          <div className="TournamentBracket">
            <div className="TournamentBrackeContainer">
              {Array.from({ length: totalRounds }, (_, round) => {
                const expectedMatches = getMatchesForRound(
                  round,
                  tournament.maxPlayers
                );

                const roundGames =
                  tournament.rounds?.[round]?.matches &&
                  tournament.rounds[round].matches.length > 0
                    ? tournament.rounds[round].matches
                    : Array.from({ length: expectedMatches }, () => ({
                        id: "",
                        tournamentId: tournament.id,
                        round: "QUALIFIERS" as TournamentRound,
                        status: "PENDING" as const,
                        opponent1Id: "",
                        opponent2Id: "",
                        opponent1Score: 0,
                        opponent2Score: 0,
                      }));

                const leftGames = roundGames.slice(0, roundGames.length / 2);

                return (
                  <div className={`Round`} key={round}>
                    {renderRoundGames(leftGames, false, round)}
                  </div>
                );
              })}

              {Array.from({ length: totalRounds - 1 }, (_, round) => {
                const expectedMatches = getMatchesForRound(
                  round,
                  tournament.maxPlayers
                );
                const roundGames =
                  tournament.rounds?.[round]?.matches &&
                  tournament.rounds[round].matches.length > 0
                    ? tournament.rounds[round].matches
                    : Array.from({ length: expectedMatches }, () => ({
                        id: "",
                        tournamentId: tournament.id,
                        round: "QUALIFIERS" as TournamentRound,
                        status: "PENDING" as const,
                        opponent1Id: "",
                        opponent2Id: "",
                        opponent1Score: 0,
                        opponent2Score: 0,
                      }));
                const rightGames = roundGames.slice(
                  roundGames.length / 2,
                  roundGames.length
                );

                return (
                  <div className={`Round`}>
                    {renderRoundGames(rightGames, true, round)}
                  </div>
                );
              }).reverse()}
            </div>
            <div
              className="FinalGame"
              onClick={() =>
                handleTournamentMatchEnded(
                  FinalMatch!.matchId,
                  getPlayer(FinalMatch?.opponent1Id).userId,
                  getPlayer(FinalMatch?.opponent2Id).userId
                )
              }
            >
              <div className="FinalScoreBoard">
                <TournamentPlayer {...getPlayer(FinalMatch?.opponent1Id)} />
                <TournamentPlayer
                  reversed
                  {...getPlayer(FinalMatch?.opponent2Id)}
                />
                <TrophyIcon
                  fill="var(--main_color)"
                  size={65}
                  className="TrophyIcon"
                />
                <div className="FinalText GlassMorphism">
                  <h1>Final</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : currentMode === "MATCHES" ? (
        <div className="MatchesMode">
          <div className="MatchesList">
            {tournament.rounds?.map((r) =>
              r.matches.map((m, index) => (
                <TournamentMatch
                  key={index}
                  matchData={m}
                  getPlayer={getPlayer}
                  roundName={r.name}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="PlayersMode">
          <div className="PlayersList">
            {tournament.participants.map((p) => (
              <div className="TournamentPlayer" key={p.id}>
                <div
                  className="TournamentPlayerAvatar"
                  style={{ backgroundImage: `url(${p.avatar})` }}
                />
                <div className="TournamentPlayerInfo">
                  <span className="UserFullName">
                    {p.firstName} {p.lastName}
                    {p.isVerified && (
                      <VerifiedIcon fill="var(--main_color)" size={16} />
                    )}
                    <span className="EliminatedSPN">
                      {p.isEliminated ? " (Eliminated)" : ""}
                    </span>
                  </span>
                  <span className="UserName">@{p.userName}</span>
                </div>

                <div className="UserRankInfo">
                  <img
                    src={
                      getRankMetaData(p.rankDivision as RankDivision, "I")
                        ?.image
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </StyledTournament>
  );
};

const StyledTournamentPlayer = styled("div")`
  height: 40px;
  width: 200px;
  border-radius: 5px;
  display: flex;
  flex-direction: ${(props: { reversed?: boolean }) =>
    props.reversed ? "row-reverse" : "row"};
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: center;
  border-bottom: none;
  /* overflow: hidden; */
  z-index: 2;
  box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
  background-color: var(--main_color);
  &.Eliminated {
    .AvatarContainer {
      filter: grayscale(1);
    }
  }

  .AvatarContainer {
    margin-left: ${(props: { reversed: boolean }) =>
      !props.reversed ? "-10px" : "0px"};
    margin-right: ${(props: { reversed: boolean }) =>
      props.reversed ? "-10px" : "0px"};
  }

  .TournamentPlayerInfo {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: ${(props: any) =>
      props.reversed ? "flex-end" : "flex-start"};
    padding: 0px 5px;
    cursor: pointer;
    span {
      line-height: 0px;
    }
    .TournamentPlayerInfoUsername {
      font-weight: 300;
      font-size: 1rem;
      font-family: var(--main_font);
    }
    .TournamentPlayerInfoUsername.Eliminated {
      opacity: 0.5;
    }
  }
  .Right__ {
    width: 35px;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.1);
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    span {
      font-family: var(--squid_font);
      font-size: 1.3rem;
    }
  }
`;
const TournamentPlayer = (
  props:
    | (Partial<TournamentPlayerType> & {
        reversed?: boolean;
        toBeDisplayed?: boolean;
        Score?: number;
      })
    | null
) => {
  const isReversed = props?.reversed || false;
  const rankMetadata = getRankMetaData(
    props?.rankDivision as RankDivision,
    "I"
  );

  const navigate = useNavigate();

  return (
    <StyledTournamentPlayer
      className={`GlassMorphism BorderBottomEffect ${
        props?.isEliminated ? "Eliminated" : ""
      }`}
      reversed={isReversed}
    >
      <div className="AvatarContainer">
        <Avatar avatarUrl={props?.avatar || undefined} />
      </div>

      <div
        className="TournamentPlayerInfo"
        onClick={() => navigate(`/user/${props?.userName}`)}
      >
        <h3
          className={`TournamentPlayerInfoUsername ${
            props?.isEliminated ? "Eliminated" : ""
          }`}
        >
          <span>{props?.userName}</span>
        </h3>
        {!props?.isReady && props?.userId && !props?.toBeDisplayed && (
          <PendingIcon fill="white" size={18} />
        )}
      </div>
      <div className="Right__">
        <span>{props?.Score}</span>
      </div>
    </StyledTournamentPlayer>
  );
};
export const StyleTournamentMatch = styled("div")`
  width: 70%;
  height: 70px;
  background-color: var(--bg_color);
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 4px;
  display: flex;
  gap: 10px;
  position: relative;

  &:after {
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: linear-gradient(
      90deg,
      rgba(202, 47, 60, 0) 0%,
      rgba(202, 47, 60, 1) 50%,
      rgba(202, 47, 60, 0) 100%
    );
    z-index: 1;
  }
  .GameStatus {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    height: 30px;
    padding: 0px 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    span {
      font-size: 0.7rem;
      font-family: var(--span_font);
      text-transform: uppercase;
    }
  }
  .Opponent {
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: row-reverse;
    gap: 15px;
    z-index: 2;

    .OpponentInfo {
      display: flex;
      flex-direction: row-reverse;
      align-items: center;
      justify-content: center;
      gap: 10px;
      .OpponentUsername {
        font-size: 1.2rem;
        font-family: var(--squid_font);
        font-weight: 500;
      }
    }
    &.reverse {
      flex-direction: row;
      .OpponentAvatar {
        background-image: linear-gradient(
            -20deg,
            var(--main_color) 0%,
            transparent 100%
          ),
          url("https://fbi.cults3d.com/uploaders/14684840/illustration-file/e52ddf50-dd29-45fc-b7a6-5fca62a84f18/jett-avatar.jpg");
      }
      .OpponentInfo {
        flex-direction: row;
      }
    }
  }
  .MiddleEl {
    height: 100%;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    gap: 10px;

    .Score {
      width: 40px;
      height: 40px;
      background-color: rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 600;
      font-family: var(--squid_font);
      color: rgb(255, 160, 168);
      border-radius: 5px;
    }
    .Round {
      position: absolute;
      bottom: 0px;
      font-size: 0.6rem;
      font-family: var(--span_font);
      color: rgba(255, 255, 255, 0.6);
    }
  }

  .LiveNowIndicator {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    z-index: 3;
    .LiveIndicator {
      display: flex;
      align-items: center;
      gap: 3px;
      border: 1px solid rgba(255, 0, 0, 0.3);
      padding: 2px 5px;
      border-radius: 3px;
      background-color: transparent;

      svg {
        animation: Wave 2s infinite;
      }
      span {
        font-size: 0.8rem;
        font-family: var(--span_font);
        color: rgba(255, 0, 0, 0.7);
        margin-bottom: 3px;
      }
      &:hover {
        background-color: rgba(255, 0, 0, 0.1);
      }
    }
  }
`;
interface TournamentMatchProps {
  matchData: TournamentMatchType;
  getPlayer: (id: string | undefined) => any;
  roundName: string;
  key: number;
}
const TournamentMatch = ({
  matchData,
  key,
  getPlayer,
  roundName,
}: TournamentMatchProps) => {
  const opponent1 = getPlayer(matchData.opponent1Id);
  const opponent2 = getPlayer(matchData.opponent2Id);
  const opponent1Rank = getRankMetaData(opponent1.rankDivision, "III");
  const opponent2Rank = getRankMetaData(opponent2.rankDivision, "II");

  const isLive = true;

  return (
    <StyleTournamentMatch key={key}>
      <div className="GameStatus">
        <span>{matchData.status}</span>
      </div>
      <div className="Opponent">
        <Avatar
          rank={opponent1Rank ? opponent1Rank : undefined}
          avatarUrl={opponent1.avatar}
        />

        <div className="OpponentInfo">
          <span className="OpponentUsername">
            {opponent1.firstName + " " + opponent1.lastName}
          </span>
        </div>
      </div>
      <div className="MiddleEl">
        <div className="Opponent1Score Score">{matchData.opponent1Score}</div>
        <ChallengeIcon fill="rgba(255,255,255, 0.7)" size={30} />
        <div className="Opponent2Score Score">{matchData.opponent2Score}</div>
        <span className="Round">{roundName}</span>
      </div>
      <div className="Opponent reverse">
        <Avatar
          rank={opponent2Rank ? opponent2Rank : undefined}
          avatarUrl={opponent2.avatar}
        />

        <div className="OpponentInfo">
          <span className="OpponentUsername">
            {opponent2.firstName + " " + opponent2.lastName}
          </span>
        </div>
      </div>

      {matchData.status === "IN_PROGRESS" && (
        <div className="LiveNowIndicator">
          <span>Live Now!</span>
          <div className="LiveIndicator">
            <span>watch</span>
            <LiveIcon fill="red" size={12} />
          </div>
        </div>
      )}
    </StyleTournamentMatch>
  );
};

export default Tournament;

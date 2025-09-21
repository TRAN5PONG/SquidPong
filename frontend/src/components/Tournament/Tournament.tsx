import { db } from "@/db";
import Zeroact, { useEffect } from "@/lib/Zeroact";
import {
  TournamentPlayer as _TournamentPlayer,
  Tournament as _Tournament,
  TournamentMatch,
} from "@/types/tournament";
import { styled } from "@/lib/Zerostyle";
import { PendingIcon, TrophyIcon, VerifiedIcon } from "../Svg/Svg";
import { getNumberOfRounds, getPlayersInRound } from "@/utils/Tournament";
import { useRouteParam } from "@/hooks/useParam";
import NotFound from "../NotFound/NotFound";
import { getRankMetaData } from "@/utils/game";
import { RankDivision } from "@/types/game/game";
import { timeAgo, timeUntil } from "@/utils/time";

const StyledTournament = styled("div")`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: var(--main_font);
  color: white;
  display: flex;
  flex-direction: column;
  h1 {
  }
  .TournamentDetails {
    position: absolute;
    font-family: var(--main_font);
    top: 20%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    h1 {
      text-transform: uppercase;
    }
    span {
      opacity: 0.8;
    }
  }
  .TournamentPlayers {
    width: 80%;
    height: 80px;
    display: flex;
    gap: 3px;
    align-items: center;
    justify-content: center;
    padding: 5px;
  }
  .TournamentBracket {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;

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
        gap: 3px;
        position: relative;

        &:before {
          position: absolute;
          content: "";
          width: 20px;
          border: 1px solid var(--main_color);
          border-left: none;
          right: -40px;
        }
        &:after {
          position: absolute;
          content: "";
          height: 50%;
          width: 20px;
          border: 1px solid var(--main_color);
          border-left: none;
          right: -20px;
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
          left: -20px;
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
          z-index: -1;
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
      .RoundGame.SemiFinal {
        &::after {
          background-image: none;
          border: none;
        }
      }
    }
  }
`;
const Tournament = () => {
  const tournamentId = useRouteParam("/tournament/:id", "id");
  const [isTournamentNotFound, setIsTournamentNotFound] =
    Zeroact.useState(false);
  const [tournament, setTournament] = Zeroact.useState<_Tournament | null>(
    null
  );

  useEffect(() => {
    if (tournamentId != null) {
      const getTournamentData = async () => {
        try {
          const tournamentData = await fetch(
            "http://10.13.2.5:3000/tournaments/cmelfxhu40000sprrzs1rqif0",
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          if (!tournamentData.ok) {
            throw new Error("Tournament not found");
          }
          const tournamentJson = await tournamentData.json();
          setTournament(tournamentJson.data);
          console.log(tournamentJson);
        } catch (error) {
          console.error("Error fetching tournament data:", error);
          setIsTournamentNotFound(true);
        }
      };

      getTournamentData();
    }
  }, [tournamentId]);

  if (isTournamentNotFound) return <NotFound />;
  if (!tournament) return <h1>loading</h1>;

  // Render Round Games
  const getPlayer = (id: string) =>
    tournament.participants.find((p) => p.id === id) || null;
  const renderRoundGames = (
    Matches: TournamentMatch[],
    reverse = false,
    round: number
  ) => {
    const isSemiFinal = Matches.length === 1;
    const playersCount = Matches.length * 2;

    const matches = Matches.map((game) => {
      const player1 = getPlayer(game.opponent1Id);
      const player2 = getPlayer(game.opponent2Id);

      return (
        <div
          className={`RoundGame ${reverse ? "Reversed" : ""} ${
            isSemiFinal ? "SemiFinal" : ""
          }`}
          data-round={round + 1}
          players-count={playersCount}
          key={`${game.opponent1Id}-${game.opponent2Id}`}
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
          <div className="GameStatus">
            <span className="GameStatusText">{game.status}</span>
            {game.status === "PENDING" && game.deadline && (
              <span className="deadLine">
                deadline :{timeUntil(game.deadline)}
              </span>
            )}
          </div>
        </div>
      );
    });

    return reverse ? matches.reverse() : matches;
  };

  const totalRounds = getNumberOfRounds(tournament?.maxPlayers);

  return (
    <StyledTournament>
      <div className="TournamentDetails">
        <h1>{tournament.name}</h1>
        <span>{tournament.description}</span>
        <span>{tournament.status}</span>
        <span>
          {tournament.participants.length} / {tournament.maxPlayers} Players
        </span>
      </div>

      {tournament.status === "IN_PROGRESS" ||
      tournament.status === "COMPLETED" ? (
        <div className="TournamentBracket">
          <div className="TournamentBrackeContainer">
            {Array.from({ length: totalRounds }, (_, round) => {
              const roundGames = tournament.rounds[round].matches;
              const leftGames = roundGames.slice(0, roundGames.length / 2);

              return (
                <div className={`Round`} key={round}>
                  {renderRoundGames(leftGames, false, round)}
                </div>
              );
            })}

            {Array.from({ length: totalRounds - 1 }, (_, round) => {
              const roundGames = tournament.rounds[round].matches;
              const rightGames = roundGames.slice(roundGames.length / 2);

              return (
                <div className={`Round`}>
                  {renderRoundGames(rightGames, true, round)}
                </div>
              );
            }).reverse()}
          </div>
          <div className="FinalGame">
            <div className="FinalScoreBoard">
              <TournamentPlayer isEliminated={true} />
              <TournamentPlayer reversed />
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
      ) : (
        <div className="TournamentPlayers GlassMorphism">
          {tournament.participants.map((el, index) => (
            <TournamentPlayer {...el} toBeDisplayed />
          ))}
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
  overflow: hidden;
  .TournamentPlayerAvatar {
    width: 33px;
    height: 33px;
    border-radius: 4px;
    background-color: lightgray;
    background-image: url(${(props: { avatar?: string }) => props.avatar});
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    .TournamentPlayerAvatarVerified {
      position: absolute;
      bottom: 0px;
      right: -3px;
    }
  }
  .TournamentPlayerAvatar.Eliminated {
    opacity: 0.5;
    filter: grayscale(1);
  }
  .TournamentPlayerInfo {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: ${(props: any) =>
      props.reversed ? "flex-end" : "flex-start"};
    padding: 0px 5px;
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
    .Right__rank {
      height: 25px;
    }
  }
`;
const TournamentPlayer = (
  props:
    | (Partial<_TournamentPlayer> & {
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

  return (
    <StyledTournamentPlayer
      // avatar={props?.user?.avatar}
      avatar={
        props?.avatar ||
        "https://fbi.cults3d.com/uploaders/14684840/illustration-file/e52ddf50-dd29-45fc-b7a6-5fca62a84f18/jett-avatar.jpg"
      }
      className="GlassMorphism BorderBottomEffect"
      reversed={isReversed}
    >
      <div
        className={`TournamentPlayerAvatar ${
          props?.isEliminated ? "Eliminated" : ""
        }`}
      >
        {props?.isVerified && (
          <VerifiedIcon
            size={10}
            fill={"#ac2b2b"}
            className="TournamentPlayerAvatarVerified"
          />
        )}
      </div>
      <div className="TournamentPlayerInfo">
        <h3
          className={`TournamentPlayerInfoUsername ${
            props?.isEliminated ? "Eliminated" : ""
          }`}
        >
          <span>{props?.userId || "TBA"}</span>
        </h3>
        {/* {!props?.isReady && props?.userId && !props?.toBeDisplayed && (
          <PendingIcon fill="white" size={18} />
        )} */}
      </div>
      <div className="Right__">
        <span>{props?.Score}</span>
        {/* <img className="Right__rank" src={rankMetadata?.image} /> */}
      </div>
    </StyledTournamentPlayer>
  );
};

export default Tournament;

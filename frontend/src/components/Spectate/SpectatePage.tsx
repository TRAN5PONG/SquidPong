import { getAllMatches } from "@/api/match";
import Zeroact, { useEffect, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { Match } from "@/types/game/game";
import { StyleTournamentMatch } from "../Tournament/Tournament";
import Avatar from "../Tournament/Avatar";
import { Rank } from "@/types/game/rank";
import { getRankMetaData } from "@/utils/game";
import { User } from "@/types/user";
import { ChallengeIcon, LiveIcon } from "../Svg/Svg";
import { useNavigate } from "@/contexts/RouterProvider";

const StyledSpectatePage = styled("div")`
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  .MatchesContainer {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    justify-content: center;
  }
`;
const SpectatePage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const getMatches = async () => {
      try {
        const resp = await getAllMatches();
        if (resp.data) setMatches(resp.data);
      } catch (err) {
        console.error(err);
      }
    };
    getMatches();
  }, []);
  return (
    <StyledSpectatePage>
      <div className="MatchesContainer">
        {matches.map((m) => {
          const opponent1Rank = getRankMetaData(
            m.opponent1.rankDivision,
            "III"
          );
          const opponent2Rank = getRankMetaData(m.opponent2.rankDivision, "II");

          return (
            <StyleTournamentMatch>
              <div className="GameStatus">
                <span>{m.status}</span>
              </div>
              <div className="Opponent">
                <Avatar
                  rank={opponent1Rank || undefined}
                  avatarUrl={m.opponent1.avatarUrl}
                />

                <div className="OpponentInfo">
                  <span className="OpponentUsername">
                    {m.opponent1.username}
                  </span>
                </div>
              </div>
              <div className="MiddleEl">
                <div className="Opponent1Score Score">
                  {m.opponent1.finalScore}
                </div>
                <ChallengeIcon fill="rgba(255,255,255, 0.7)" size={30} />
                <div className="Opponent2Score Score">
                  {m.opponent2.finalScore}
                </div>
              </div>
              <div className="Opponent reverse">
                <Avatar
                  rank={opponent2Rank ? opponent2Rank : undefined}
                  avatarUrl={m.opponent2.avatarUrl}
                />

                <div className="OpponentInfo">
                  <span className="OpponentUsername">
                    {m.opponent2.username}
                  </span>
                </div>
              </div>

              {m.status === "IN_PROGRESS" && (
                <div className="LiveNowIndicator">
                  <span>Live Now!</span>
                  <div
                    className="LiveIndicator"
                    onClick={() => navigate(`/game/${m.id}`)}
                  >
                    <span>watch</span>
                    <LiveIcon fill="red" size={12} />
                  </div>
                </div>
              )}
            </StyleTournamentMatch>
          );
        })}
      </div>
    </StyledSpectatePage>
  );
};

export default SpectatePage;

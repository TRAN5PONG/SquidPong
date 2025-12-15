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
import { characters } from "@/types/game/character";

const StyledSpectatePage = styled("div")`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 10%;
 
      .NotFound{
      font-family: var(--span_font);
      color: rgba(255,255,255, 0.6);
    }
  .MatchesContainer {
    width: 100%;
    height: 100%;
    display: flex;
    overflow-y: scroll;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(5, 1fr);
    grid-column-gap: 5px;
    grid-row-gap: 5px;
    padding: 10% 25%;
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
        if (resp.data) {
          const matches: Match[] = resp.data.filter((m: Match) => m.mode === "ONE_VS_ONE" || m.mode === "TOURNAMENT")
          setMatches(matches);
        }
      } catch (err) {
        console.error(err);
      }
    };
    getMatches();
  }, []);
  return (
    <StyledSpectatePage>
      {
        matches.length > 0 ? (
          <div className="MatchesContainer scroll-y">
            {matches.map((m) => {
              const opponent1Rank = getRankMetaData(
                m.opponent1.rankDivision,
                "III"
              );
              const opponent2Rank = getRankMetaData(m.opponent2.rankDivision, "II");
              const opponent1Character = characters.find(
                (c) => c.id === m.opponent1.characterId
              );
              const opponent2Character = characters.find(
                (c) => c.id === m.opponent2.characterId
              );

              return (
                <StyledSpectateCard>
                  <span className="MatchStatus">{m.status}</span>
                  <div className="MatchPlayers">
                    <div className="AvatarContainer opponent1Avatar">
                      <Avatar
                        avatarUrl={m.opponent1.avatarUrl}
                        rank={opponent1Rank!}
                      />
                      <span className="OpponentUsername">
                        {m.opponent1.username}
                      </span>
                    </div>

                    <div className="AvatarContainer opponent2Avatar">
                      <Avatar
                        avatarUrl={m.opponent2.avatarUrl}
                        rank={opponent2Rank!}
                      />
                      <span className="OpponentUsername">
                        {m.opponent2.username}
                      </span>
                    </div>
                    <img className="Opponent1" src={opponent1Character?.image} />
                    <span className="VsSpn">VS</span>
                    <img className="Opponent2" src={opponent2Character?.image} />
                  </div>
                  <button
                    className="WatchBtn"
                    onClick={() => navigate(`/spectate/game/${m.id}`)}
                  >
                    Watch
                  </button>
                </StyledSpectateCard>
              );
            })}
          </div>
        ) : <span className="NotFound">No active games found!</span>
      }

    </StyledSpectatePage>
  );
};

const StyledSpectateCard = styled("div")`
  width: 400px;
  height: 200px;
  background-color: transparent;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    &:before {
      left: -5%;
    }
  }
  &:after {
    content: "";
    position: absolute;
    left: 50%;
    top: -20px;
    transform: translate(-50%);
    width: 250px;
    height: 60px;
    background-color: var(--main_color);
    filter: blur(50px);
    z-index: 2;
  }
  &:before {
    width: 200px;
    height: 200%;
    position: absolute;
    content: "";
    top: -20%;
    left: -30%;
    background: var(--main_color);
    rotate: -25deg;
    z-index: 1;
    transition: 0.2s cubic-bezier(0.785, 0.135, 0.15, 0.86);
  }

  .MatchPlayers {
    height: 100%;
    width: 200px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 10px;
    img {
      height: 150%;
      position: absolute;
      top: 10px;
      z-index: 1;
    }
    img.Opponent1 {
      left: 15px;
    }
    img.Opponent2 {
      right: 15px;
    }
    .VsSpn {
      font-family: var(--squid_font);
      font-size: 10rem;
      font-weight: bold;
      color: white;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .AvatarContainer {
      z-index: 3;
      margin-top: 50px;
      .OpponentUsername {
        display: block;
        margin-top: 5px;
        font-family: var(--squid_font);
        font-size: 0.8rem;
        color: white;
        text-align: center;
      }
    }
  }

  .WatchBtn {
    position: absolute;
    bottom: 10px;
    right: 10px;
    padding: 10px 20px;
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    color: white;
    font-weight: bold;
    font-family: var(--squid_font);
    cursor: pointer;
    transition: background-color 0.3s ease;
    z-index: 3;
    &:hover {
      background-color: var(--main_color);
    }
  }
  .MatchStatus {
    position: absolute;
    bottom: 5px;
    left: 5px;
    color: rgba(255, 255, 255, 0.7);
    font-family: var(--main_font);
    font-size: 0.6rem;
    z-index: 3;
  }
`;

export default SpectatePage;

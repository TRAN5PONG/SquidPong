import { db } from "@/db";
import Zeroact, { useEffect, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { useNavigate } from "@/contexts/RouterProvider";
import { User } from "@/types/user";
import { getLeaderboard } from "@/api/user";
import { getRankMetaData } from "@/utils/game";

const StyledLeaderboard = styled("div")`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  padding: 90px 10%;

  .podium {
    width: 100%;
    height: auto;
    display: flex;
    justify-content: center;
    gap: 30px;
    margin: 30px 0px;
  }
  .leaderboard-list {
    width: 100%;
    min-height: 130vh;
    background-color: var(--bg_color_super_light);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 5px;
    gap: 5px;
  }
`;

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [podium, setPodium] = useState<User[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const handleFetchLeaderboard = async () => {
      try {
        const resp = await getLeaderboard();
        if (resp.data) {
          setPodium(resp.data.slice(0, 3));
          setLeaderboard(resp.data.slice(3));
        }
      } catch (err) {
        console.error(err);
      }
    };

    handleFetchLeaderboard();
  }, []);
  return (
    <StyledLeaderboard className="scroll-y">
      {podium.length > 0 && (
        <div className="podium">
          <StyledPodiumCard avatar={podium[0].avatar} className="sec" rank="2">
            <div
              className="PodiumFrame"
              onClick={() => navigate(`/user/${podium[0].username}`)}
            >
              <img src="/assets/podium2.png" />
            </div>
          </StyledPodiumCard>
          <StyledPodiumCard
            avatar={podium[1].avatar}
            className="first"
            rank="1"
          >
            <div
              className="PodiumFrame"
              onClick={() => navigate(`/user/${podium[1].username}`)}
            >
              <img src="/assets/podium1.png" />
            </div>
          </StyledPodiumCard>
          <StyledPodiumCard
            avatar={podium[2].avatar}
            className="third"
            rank="3"
          >
            <div
              className="PodiumFrame"
              onClick={() => navigate(`/user/${podium[2].username}`)}
            >
              <img src="/assets/podium2.png" />
            </div>
          </StyledPodiumCard>
        </div>
      )}

      <div className="leaderboard-list">
        {leaderboard.length > 0 &&
          leaderboard.map((p) => <LeaderboardCard {...p} />)}
      </div>
    </StyledLeaderboard>
  );
};

const StyledLeaderboardCard = styled("div")`
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 5px;
  cursor: pointer;
  position: relative;
  z-index: 2;
  background-color: var(--bg_color_light);
  transition: 0.2s ease-in-out;
  &:hover {
    box-shadow: rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px;
  }
  &:after {
    border-radius: 7px;
    background-image: linear-gradient(
        90deg,
        rgba(27, 26, 31, 0) 0%,
        rgba(27, 26, 31, 0.8) 20%,
        rgba(27, 26, 31, 1) 80%
      ),
      url(${(props: any) => props.banner});
    background-size: cover;
    background-position: center;
    border: none;
    width: 40%;
    height: 100%;
    content: "";
    position: absolute;
    z-index: -1;
    overflow: hidden;
  }
  .Avatar {
    height: 56px;
    width: 56px;
    background-color: var(--bg_color_super_light);
    border-radius: 5px;
    background-image: url(${(props: any) => props.avatar});
    background-size: cover;
    background-position: center;
    margin-left: 3px;
  }
  .UserDetails {
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-left: 10px;
    z-index: 3;
    h1 {
      font-size: 1.2rem;
      margin: 0;
      color: rgba(255, 255, 255, 0.7);
      font-family: var(--main_font);
      display: flex;
      align-items: center;
      gap: 5px;
      img {
        height: 25px;
      }
    }
    span {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.5);
      font-family: var(--main_font);
    }
  }
  .UserScore {
    width: 100px;
    height: 100%;
    margin-left: auto;
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.7);
    font-family: var(--main_font);
    padding-right: 10px;
    background-color: var(--bg_color_super_light);
    border-radius: 5px;
    padding: 5px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;
const LeaderboardCard = (props: User) => {
  console.log(props);
  const navigate = useNavigate();
  return (
    <StyledLeaderboardCard
      avatar={props.avatar}
      banner={props.banner}
      onClick={() => navigate(`/user/${props.username}`)}
    >
      <div className="Avatar" />
      <div className="UserDetails">
        <h1>
          {props.firstName} {props.lastName}
          <img
            src={getRankMetaData(props.rankDivision, props.rankTier)?.image}
          />
        </h1>
        <span>@{props.username}</span>
      </div>

      <div className="UserScore">
        <span>{props.level}</span>
      </div>
    </StyledLeaderboardCard>
  );
};
const StyledPodiumCard = styled("div")`
  width: 100px;
  height: 100px;
  background-color: var(--bg_color_light);
  border-radius: 10px;
  background-image: url(${(props: any) => props.avatar || ""});
  background-position: center;
  background-size: cover;
  position: relative;
  &:after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.2);
  }
  &:before {
    width: 60px;
    height: 60px;
    position: absolute;
    bottom: 0;
    left: 0;
    content: "#${(props: any) => props.rank}";
    display: flex;
    justify-content: flex-start;
    align-items: flex-end;
    color: #e7d085;
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
    padding-left: 5px;
    font-size: 1.3rem;
    font-family: var(--squid_font);
    background: linear-gradient(
      50deg,
      rgba(255, 156, 45, 1) 0%,
      rgba(255, 217, 68, 0) 70%
    );
  }
  &.first {
    width: 130px;
    height: 130px;
  }
  &.sec {
    width: 100px;
    height: 100px;
    .PodiumFrame img {
      height: 180%;
    }
  }
  &.third {
    width: 100px;
    height: 100px;
    .PodiumFrame img {
      height: 180%;
    }
  }
  .PodiumFrame {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    img {
      height: 150%;
    }
  }
  &.first {
    margin-top: -30px;
  }
`;

export default Leaderboard;

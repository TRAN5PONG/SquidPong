import { useNavigate } from "@/contexts/RouterProvider";
import Zeroact from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { Rank, RANKS } from "@/types/game";
import { User } from "@/types/user";

const StyledUserBanner = styled("div")`
  width: 400px;
  height: 70px;
  clip-path: path(
    "M 0,0 L 390,0 L 400,10 L 360,55 L 350,55 L 335,70 L 0,70 L 0,0  Z"
  );
  display: flex;
  align-items: center;
  position: relative;
  background: linear-gradient(
    90deg,
    ${(props: { primaryColor: string }) => props.primaryColor} 0%,
    ${(props: { secondaryColor: string }) => props.secondaryColor} 100%
  );

  &:after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        rgba(73, 91, 134, 1) 0%,
        rgba(73, 91, 134, 0) 50%,
        rgba(73, 91, 134, 0) 90%
      ),
      url("https://i.pinimg.com/1200x/bb/de/15/bbde1548667df25e226653e723ab5632.jpg");
    background-size: cover;
    background-position: center;
    mix-blend-mode: soft-light;
    filter: grayscale(1);
    z-index: 1;
  }
  .player-avatar {
    width: 68px;
    height: 68px;
    margin-left: 1px;
    background-color: var(--bg_color_super_light);
    background-image: url(${(props: { avatar: string }) => props.avatar});
    background-size: cover;
    background-position: center;
    clip-path: path("M 0,0 L 68,0 L 68,50 L 50,68 L 0,68 L 0,0 Z");
  }
  .player-details {
    height: 100%;
    min-width: 180px;
    padding: 5px 10px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: relative;

    h1 {
      color: white;
      font-family: var(--span_font);
      font-size: 1rem;
      line-height: 1rem;
      z-index: 2;
    }
    span {
      color: white;
      font-family: var(--span_font);
      font-size: 0.8rem;
      line-height: 1rem;
      z-index: 2;
    }
    .user-level {
      margin-left: auto;
      position: absolute;
      color: rgba(0, 0, 0, 0.5);
      font-family: var(--squid_font);
      line-height: 1rem;
      font-size: 1rem;
      bottom: 1px;
      right: 15px;
    }
    .progLevel {
      width: 100%;
      height: 17px;
      transform: skew(-45deg);
      background-color: rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.3);
      position: relative;
      margin-left: -15px;
      position: absolute;
      bottom: 1px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0px 10px;

      &:after {
        content: "";
        position: absolute;
        display: flex;
        align-items: center;
        top: 0;
        left: 0;
        width: ${(props: any) => props.prog}%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.8);
      }
    }
  }
  .rank-badge {
    width: 70px;
    height: 70px;
    margin-left: auto;
    margin-right: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;

    z-index: 44;
    &:hover {
      &:after {
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0) 0%,
          ${(props: any) => props.secondaryColor} 100%
        );
      }
    }
    &:after {
      content: "";
      position: absolute;
      width: 120%;
      height: 100%;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0) 0%,
        ${(props: any) => props.primaryColor} 100%
      );
      border-right: 3px solid ${(props: any) => props.secondaryColor};
      border-left: 3px solid ${(props: any) => props.secondaryColor};
      transform: skew(-45deg);
    }
    .badge-img {
      height: 50px;
      z-index: 3;
    }
    .badge-name {
      white-space: nowrap;
      z-index: 2;
      margin-left: -50px;
      color: white;
      font-family: var(--squid_font);
      font-size: 0.8rem;
      line-height: 1rem;
    }
  }
`;

const UserBanner = (user: User | null) => {
  if (!user) return null;
  const navigate = useNavigate();

  const rankMetadata = RANKS.find((r) => {
    if (user.rankDivision === "MASTER") {
      return r.division === "MASTER";
    }
    return r.division === user.rankDivision && r.tier === user.rankTier; // todo flip them on fix
  });

  return (
    <StyledUserBanner
      avatar={user.avatar}
      primaryColor={rankMetadata?.primaryColor}
      secondaryColor={rankMetadata?.secondaryColor}
      prog={(user.level % 1) * 100}
    >
      <div className="player-avatar"></div>
      <div className="player-details">
        <h1>{user.firstName + " " + user.lastName}</h1>
        <span>@{user.username}</span>
        <span className="user-level">{user.level}</span>
        <div className="progLevel">
          {/* <span className="user-level">{Math.floor(user.level)}</span> */}
        </div>
      </div>
      <div className="rank-badge" onClick={() => navigate("/badges")}>
        <img className="badge-img" src={rankMetadata?.image} />
        <span className="badge-name">
          {user.rankDivision + " " + user.rankTier}
        </span>
      </div>
    </StyledUserBanner>
  );
};

export default UserBanner;

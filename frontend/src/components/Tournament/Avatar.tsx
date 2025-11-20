import Zeroact from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { Rank } from "@/types/game/rank";

const StyledAvatar = styled("div")`
  width: 50px;
  height: 60px;
  position: relative;
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(0deg, var(--main_color) 0%, transparent 80%);
    clip-path: polygon(100% 0, 100% 70%, 50% 100%, 0 70%, 0 0);
  }

  .Frame {
    position: absolute;
    background-color: white;
    top: -4px;
    left: -4px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    z-index: 4;
    opacity: 0.7;
    clip-path: polygon(90% 42%, 100% 70%, 50% 100%, 0 70%, 7% 45%);
    z-index: -1;
  }
  .Lines {
    position: absolute;
    top: -10px;
    left: -5px;
    z-index: 2;
    transform: rotate(-15deg);
    display: flex;
    justify-content: center;
    align-items: center;
    .BadgeIcon {
      width: 16px;
    }
    .BadgeTier {
      color: rgba(255, 255, 255, 0.9);
      font-size: 1rem;
      font-weight: bold;
      font-family: var(--squid_font);
      text-shadow: 0 0 5px black;
    }
  }
  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    clip-path: polygon(100% 0, 100% 70%, 50% 100%, 0 70%, 0 0);
	background-color: rgba(255,255,255,1);
    background-image: url(${(props: { avatarUrl: string }) => props.avatarUrl});
    background-size: cover;
    background-position: center;
    z-index: -1;
  }
`;

interface AvatarProps {
  avatarUrl: string;
  rank?: Rank;
}
const Avatar = ({
  avatarUrl = "https://fbi.cults3d.com/uploaders/14684840/illustration-file/e52ddf50-dd29-45fc-b7a6-5fca62a84f18/jett-avatar.jpg",
  rank,
}: AvatarProps) => {
  return (
    <StyledAvatar avatarUrl={avatarUrl}>
      <div className="Frame" />
      {rank && (
        <div className="Lines">
          <img className="BadgeIcon" src={rank.image} />
          <span className="BadgeTier">{rank.tier}</span>
        </div>
      )}
    </StyledAvatar>
  );
};

export default Avatar;

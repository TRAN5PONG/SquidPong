import Zeroact, { useContext, useEffect } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { RouterContext, useNavigate } from "@/contexts/RouterProvider";
import { useSound } from "@/hooks/useSound";
import {
  HomeIcon,
  LeaderboardIcon,
  PaddleIcon,
  SpectateIcon,
  TrophyIcon,
  WariorIcon,
} from "../Svg/Svg";
import { useAppContext } from "@/contexts/AppProviders";
import { socketManager } from "@/utils/socket";
import { Match } from "@/types/game/game";
import { useSounds } from "@/contexts/SoundProvider";

const StyledGameMenu = styled("div")`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  z-index: 999;

  .BottomPanPlayBtn {
    width: 200px;
    height: 80px;
    background: linear-gradient(
      -90deg,
      rgba(255, 217, 68, 1) 0%,
      rgba(255, 156, 45, 1) 100%
    );
    clip-path: path("M 0,80 L 40,0 L 200,0 L 200,80 L 0,80 Z");
    font-family: var(--squid_font);
    font-size: 2rem;
    border: none;
    outline: none;
    color: white;
    padding-left: 20px;
    overflow: hidden;
    cursor: pointer;
    transition: 0.3s ease-in-out;
    position: absolute;
    right: 0;
    bottom: 0;
    z-index: 2;

    &:after {
      position: absolute;
      content: "";
      width: 100%;
      height: 100%;
      rotate: -10deg;
      background: linear-gradient(
        0deg,
        rgba(255, 217, 68, 0.4) 0%,
        rgba(255, 156, 45, 1) 100%
      );
      bottom: -21%;
      left: -30%;
      z-index: -1;
      transition: 0.3s ease-in-out;
    }

    &:before {
      content: "";
      position: absolute;
      width: 100%;
      height: 100%;
      background-image: linear-gradient(
        90deg,
        rgba(29, 51, 72, 0) 0%,
        #ffffff 100%
      );
      background-position: top;
      background-size: 100% 2px;
      background-repeat: no-repeat;
      top: 0;
      left: 0;
    }

    &:hover {
      &::after {
        rotate: -15deg;
      }
    }
  }
  .BottomMenu {
    position: absolute;
    right: 60px;
    bottom: 0;
    width: 40%;
    height: 80%;
    background: linear-gradient(
      -90deg,
      rgba(45, 56, 82, 0.5) 0%,
      rgba(45, 56, 82, 0) 100%
    );
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);

    &:before {
      content: "";
      position: absolute;
      top: 0;
      width: 100%;
      height: 2px;
      background-image: linear-gradient(
        90deg,
        rgba(29, 51, 72, 0) 0%,
        rgb(101, 121, 168) 50%,
        rgba(29, 51, 72, 0) 100%
      );
      background-position: top;
      background-size: 100% 2px;
      background-repeat: no-repeat;
    }
    .BottomMenuEl {
      width: 60px;
      height: 60px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 5px;
      cursor: pointer;
      transition: 0.2s ease-in-out;
      z-index: 3;

      &:hover {
        background: linear-gradient(
          180deg,
          rgba(101, 121, 168, 0) 0%,
          rgba(101, 121, 168, 0.3) 100%
        );
      }
    }
    .BottomMenuEl.active {
      background: linear-gradient(
        180deg,
        rgba(101, 121, 168, 0) 0%,
        rgba(101, 121, 168, 0.3) 100%
      );
    }
  }
`;

const menuElements = [
  {
    name: "Spectate",
    icon: SpectateIcon,
    navigateTo: "/spectate",
  },
  {
    name: "Leaderboard",
    icon: LeaderboardIcon,
    navigateTo: "/leaderboard",
  },
  {
    name: "Tournaments",
    icon: TrophyIcon,
    navigateTo: "/tournaments",
  },
  {
    name: "Paddle Select",
    icon: PaddleIcon,
    navigateTo: "/select-paddle",
  },
  {
    name: "Character Select",
    icon: WariorIcon,
    navigateTo: "/select-character",
  },
  {
    name: "Home",
    icon: HomeIcon,
    navigateTo: "/lobby",
  },
];

const GameMenu = () => {
  const { navigate, currentPath } = useContext(RouterContext);
  const { el_hoverSound, backgroundSound, startSound } = useSounds();

  const { match, user, toasts } = useAppContext();

  const onStartGame = () => {
    if (!match.currentMatch)
      toasts.addToastToQueue({
        type: "error",
        message: "No match found. Please join a match first.",
      });

    if (match.currentMatch?.mode === "ONE_VS_AI")
      return navigate(`/game/${match.currentMatch.id}`)
    const userPlayerId =
      match.currentMatch?.opponent1.userId === user?.id
        ? match.currentMatch?.opponent1.userId
        : match.currentMatch?.opponent2.userId;

    if (match.currentMatch) {
      socketManager.sendMessage({
        type: "game",
        data: {
          event: "match-start",
          matchId: match.currentMatch?.id,
          playerId: userPlayerId,
          senderGMid: user?.userId,
        },
      });
    }
  };

  useEffect(() => {
    socketManager.subscribe("match-started", (data: any) => {
      toasts.addToastToQueue({
        type: "success",
        message: "Match is starting!",
        duration: 2000,
      });
      startSound.play();
      setTimeout(() => {
        navigate(`/game/${data.match.id}`);
      }, 2500);
    });
  }, []);

  if (
    currentPath.startsWith("/game") ||
    currentPath.startsWith("/spectate/game") ||
    currentPath === "/bounce-game" ||
    currentPath === "/"
  )
    return null;

  return (
    <StyledGameMenu
      onMouseEnter={() => backgroundSound.setMuffled(true)}
      onMouseLeave={() => backgroundSound.setMuffled(false)}
    >
      <button className="BottomPanPlayBtn" onClick={onStartGame}>
        START
      </button>
      <div className="BottomMenu">
        {menuElements.map((el) => (
          <div
            key={el.name}
            className={`BottomMenuEl ${el.navigateTo === currentPath ? "active" : ""
              }`}
            onMouseEnter={() => {
              el_hoverSound.play();
            }}
            onClick={() => {
              navigate(`${el.navigateTo}`);
            }}
          >
            <el.icon fill="rgba(101, 121, 168, 0.7)" size={45} />
          </div>
        ))}
      </div>
    </StyledGameMenu>
  );
};

export default GameMenu;

import Zeroact, { useEffect } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { GameMode as GameModeType } from "@/types/game/game";

import { useSound } from "@/hooks/useSound";
import { useNavigate } from "@/contexts/RouterProvider";
import GameSettings from "./GameSettings";
import { useAppContext } from "@/contexts/AppProviders";
import { socketManager } from "@/utils/socket";
import { useSounds } from "@/contexts/SoundProvider";
import { characters, GameCharacter } from "@/types/game/character";

const StyledLobby = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  position: relative;

  /* &:after {
    width: 100%;
    height: 100%;
    content: "";
    position: absolute;
    background-image: url("https://i.pinimg.com/1200x/a0/b3/1d/a0b31ddb11ebf9854faf8201c393a5f6.jpg");
    background-size: cover;
    background-position: center;
    mix-blend-mode: lighten;
  } */

  .LobbyPlayer {
    flex: 1;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    .SelectedPlayer {
      height: 100%;
      width: 40%;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      background-image: linear-gradient(
        -180deg,
        rgba(45, 56, 82, 0) 50%,
        rgba(45, 56, 82, 0.3) 100%
      );
      z-index: 2;
      img {
        height: 100%;
        position: absolute;
        bottom: -10%;
      }
    }
  }

  .GameModes {
    width: 50%;
    height: 500px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: auto;
    gap: 5px;
    transform: perspective(800px) rotateY(-8deg);

    h1 {
      font-family: var(--squid_font);
      font-size: 4rem;
      line-height: 3rem;
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      color: rgb(101, 121, 168);
    }

    .MainMode {
      height: 500px;
      width: 300px;
      border-radius: 5px;
      background: linear-gradient(
        120deg,
        rgba(45, 56, 82, 0) 0%,
        rgba(45, 56, 82, 1) 100%
      );
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      cursor: pointer;
      transition: 0.2s ease-in-out;

      &:hover {
        background: linear-gradient(
          -30deg,
          rgba(255, 217, 68, 1) 0%,
          rgba(255, 156, 45, 1) 100%
        );

        img {
          left: -20%;
          top: 20px;
        }

        h1 {
          color: white;
          z-index: 4;
        }

        &:before {
          background-image: linear-gradient(
            90deg,
            rgba(255, 217, 68, 1) 0%,
            #ffe680 50%,
            rgba(255, 217, 68, 1) 100%
          );
        }

        &::after {
          background: linear-gradient(
            30deg,
            rgba(255, 217, 68, 1) 0%,
            rgba(255, 156, 45, 0) 30%
          );
        }
      }

      &:before {
        content: "";
        position: absolute;
        width: 100%;
        height: 100%;
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

      img {
        height: 200%;
        position: absolute;
        left: -10%;
        top: 0;
        transition: 0.3s cubic-bezier(0.87, -1.38, 0.03, 1.54);
      }
    }
    .MainMode.selected {
      background: linear-gradient(
        -30deg,
        rgba(255, 217, 68, 1) 0%,
        rgba(255, 156, 45, 1) 100%
      );

      img {
        left: -20%;
        top: 20px;
      }

      h1 {
        color: white;
        z-index: 4;
        left: 10px;
        transform: translateX(0);
      }

      &:before {
        background-image: linear-gradient(
          90deg,
          rgba(255, 217, 68, 1) 0%,
          #ffe680 50%,
          rgba(255, 217, 68, 1) 100%
        );
      }

      &::after {
        background: linear-gradient(
          30deg,
          rgba(255, 217, 68, 1) 0%,
          rgba(255, 156, 45, 0) 30%
        );
      }
    }
    .SecModes {
      height: 500px;
      width: 350px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      position: relative;

      .TOURNAMENTMode {
        position: relative;
        overflow: hidden;
        background: linear-gradient(
          -90deg,
          rgba(45, 56, 82, 0) 0%,
          rgba(45, 56, 82, 1) 100%
        );

        img {
          position: absolute;
          left: -25%;
          height: 130%;
          bottom: -30%;
        }

        &:hover {
          img {
            left: -15%;
          }
        }
      }
      .TOURNAMENTMode.selected {
        img {
          left: -15%;
        }
      }

      .VSAIMode {
        position: relative;
        overflow: hidden;
        background: linear-gradient(
          90deg,
          rgba(45, 56, 82, 0) 0%,
          rgba(45, 56, 82, 1) 100%
        );

        img {
          position: absolute;
          right: -32%;
          height: 220%;
          top: -15%;
        }

        &:hover {
          img {
            right: -15%;
            top: -10%;
          }
        }
      }
      .VSAIMode.selected {
        img {
          right: -15%;
          top: -20%;
        }
      }

      .MINIGAMEMode {
        position: relative;
        overflow: hidden;
        background: linear-gradient(
          -90deg,
          rgba(45, 56, 82, 0) 0%,
          rgba(45, 56, 82, 1) 100%
        );

        img {
          position: absolute;
          left: -45%;
          height: 230%;
          top: -15%;
        }

        &:hover {
          img {
            left: -35%;
          }
        }
      }
      .MINIGAMEMode.selected {
        img {
          left: -35%;
        }
      }

      .secMode {
        flex: 1;
        border-radius: 5px;
        position: relative;
        cursor: pointer;

        img {
          transition: 0.3s cubic-bezier(0.87, -1.38, 0.03, 1.54);
        }

        &:hover {
          background: linear-gradient(
            -30deg,
            rgba(255, 217, 68, 1) 0%,
            rgba(255, 156, 45, 1) 100%
          );

          h1 {
            color: white;
          }

          &:before {
            background-image: linear-gradient(
              90deg,
              rgba(255, 217, 68, 1) 0%,
              #ffe680 50%,
              rgba(255, 217, 68, 1) 100%
            );
          }
        }

        &:before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(
            90deg,
            rgba(29, 51, 72, 0) 0%,
            rgb(101, 121, 168) 50%,
            rgba(29, 51, 72, 0) 100%
          );
          background-position: bottom;
          background-size: 100% 2px;
          background-repeat: no-repeat;
        }

        h1 {
          font-size: 2rem;
          white-space: nowrap;
        }
      }
      .secMode.selected {
        background: linear-gradient(
          -30deg,
          rgba(255, 217, 68, 1) 0%,
          rgba(255, 156, 45, 1) 100%
        );

        h1 {
          color: white;
          left: 10px;
          transform: translateX(0);
        }

        &:before {
          background-image: linear-gradient(
            90deg,
            rgba(255, 217, 68, 1) 0%,
            #ffe680 50%,
            rgba(255, 217, 68, 1) 100%
          );
        }
      }
    }
  }
`;

const Lobby = () => {
  const { user, match, toasts } = useAppContext();

  const [selectedMode, setSelectedMode] = Zeroact.useState<GameModeType | null>(
    null
  );
  const [selectedChar, setSelectedChar] =
    Zeroact.useState<GameCharacter | null>(null); //todo => USER WILL ALWAYS HAVE A SELECTED CHAR

  // Sounds
  const { errorSound, el_clickSound, el_hoverSound, backgroundSound } =
    useSounds();

  const onModeSelect = (mode: GameModeType) => {
    if (selectedMode === mode) return;
    if (match.currentMatch) {
      errorSound.play();
      toasts.addToastToQueue({
        type: "info",
        message: "You are already in a match!",
      });
    } else {
      el_clickSound.play();
      setSelectedMode(mode);
    }
  };

  useEffect(() => {
    console.log("Selected Mode:", selectedMode);
  }, [selectedMode]);

  useEffect(() => {
    setSelectedChar(
      characters.find(
        (char: GameCharacter) => char.id === user?.playerSelectedCharacter
      )!
    );
    console.log(selectedChar);
    if (backgroundSound.isMuffled) {
      backgroundSound.setMuffled(false);
    }
    return () => {
      // lobbySound.stop();
    };
  }, [user]);

  return (
    <StyledLobby>
      <div className="LobbyPlayer">
        <div className="SelectedPlayer">
          <img src={selectedChar?.image} />
        </div>
        <GameSettings
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
        />
      </div>

      <div
        className="GameModes"
        onMouseEnter={() => {
          backgroundSound.setMuffled(true);
          backgroundSound.setVolume(0.2);
        }}
        onMouseLeave={() => {
          backgroundSound.setMuffled(false);
          backgroundSound.setVolume(0.5);
        }}
      >
        <div
          className={`MainMode ${
            selectedMode === "ONE_VS_ONE" ? "selected" : ""
          }`}
          onClick={() => onModeSelect("ONE_VS_ONE")}
          onMouseEnter={() => {
            el_hoverSound.play();
          }}
        >
          <img src="/assets/1vs1.png" />
          <h1>1vs1</h1>
        </div>
        <div className="SecModes">
          <div
            className={`TOURNAMENTMode secMode ${
              selectedMode === "Tournament" ? "selected" : ""
            }`}
            onClick={() => onModeSelect("Tournament")}
            onMouseEnter={() => el_hoverSound.play()}
          >
            <img src="/icons/trophy.webp" />
            <h1>TOURNAMENT</h1>
          </div>
          <div
            className={`VSAIMode secMode ${
              selectedMode === "1vsAI" ? "selected" : ""
            }`}
            onClick={() => onModeSelect("1vsAI")}
            onMouseEnter={() => el_hoverSound.play()}
          >
            <img src="/assets/1vsAI.png" />
            <h1>VS AI</h1>
          </div>
          <div
            className={`MINIGAMEMode secMode ${
              selectedMode === "BounceChallenge" ? "selected" : ""
            }`}
            onClick={() => onModeSelect("BounceChallenge")}
            onMouseEnter={() => el_hoverSound.play()}
          >
            <img src="/characters/green_f2.webp" />
            <h1>Mini Game</h1>
          </div>
        </div>
      </div>
    </StyledLobby>
  );
};

export default Lobby;

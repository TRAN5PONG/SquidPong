import Zeroact, { useRef } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import {
  CameraIcon,
  EmojiIcon,
  LiveIcon,
  SendIcon,
  SignOutIcon,
} from "../Svg/Svg";
import { ChatMessage } from "@/types/chat";
import { db } from "@/db";
import { useNavigate } from "@/contexts/RouterProvider";
import ScoreBoard from "../Game/Elements/ScoreBoard";
import { useGameScene } from "../Game/scenes/GameScene";
import { CameraModeName, cameraModes } from "../Game/entities/cameras/camera";

const StyledSpectate = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
  gap: 10px;
  padding: 10px;
  padding-top: 60px;
  .GameContainer {
    width: 70%;
    height: 100%;
    background-color: var(--bg_color_light);
    border: 1px solid var(--bg_color_super_light);
    border-radius: 10px;
    position: relative;
    overflow: hidden;
    .gameCanvas {
      width: 100%;
      height: 100%;
    }
    .CameraModes {
      position: absolute;
      background-color: rgba(255, 255, 255, 0.6);
      width: 200px;
      z-index: 100;
      right: 70px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      border-radius: 5px;
      overflow: hidden;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      .CameraModeOption {
        height: 40px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        padding: 0 10px;
        font-family: var(--main_font);
        color: rgba(0, 0, 0, 0.6);
        font-size: 1.1rem;
        font-weight: 500;
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        cursor: pointer;
        transition: background-color 0.2s ease;
        &:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
      }
      .CameraModeOption.selected {
        background-color: rgba(255, 255, 255, 0.5);
      }
    }
    .GameContainerOptions {
      .LiveIcon {
        position: absolute;
        top: 0px;
        right: 10px;
        display: flex;
        flex-direction: row;
        font-family: var(--squid_font);
        font-size: 1.2rem;
        align-items: center;
        justify-content: center;
        gap: 5px;
        color: var(--main_color);
      }
      .LeaveButton {
        width: 150px;
        height: 40px;
        background-color: transparent;
        border-radius: 5px;
        color: white;
        font-family: var(--squid_font);
        border: 1px solid var(--main_color);
        outline: none;
        color: var(--main_color);
        position: absolute;
        bottom: 10px;
        right: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        transition: background-color 0.3s ease;
        &:hover {
          background-color: rgba(202, 47, 60, 0.1);
        }
      }
      .SideOptions {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        .CameraOption {
          width: 40px;
          height: 40px;
          background-color: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 5px;
          z-index: 99;
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
          cursor: pointer;
          transition: background-color 0.3s ease;
          &:hover {
            background-color: rgba(255, 255, 255, 0.7);
          }
        }
      }
    }
  }
  .RightContainer {
    height: 100%;
    width: 30%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    .BettingContainer {
      background-color: var(--bg_color_light);
      border: 1px solid var(--bg_color_super_light);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      padding: 5px;
      gap: 5px;
      .BettingHeader {
        flex: 1;
        width: 100%;
        .BetCard {
          width: 100%;
          height: 50px;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          padding: 2px;
          display: flex;
          justify-content: space-between;
          .BettingOptions {
            display: flex;
            gap: 5px;
            .BettingOption {
              display: flex;
              flex-direction: column;
              .BettingOptionName {
                font-family: var(--main_font);
                font-size: 0.8rem;
                color: white;
              }
              .BettingOptionOdds {
                width: 60px;
                height: 30px;
                background-color: rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: center;
                align-items: center;
                border-radius: 3px;
                font-family: var(--main_font);
                transition: all 0.3s ease;
                &:hover {
                  background-color: rgba(255, 156, 45, 0.2);
                  color: rgba(255, 156, 45, 1);
                  cursor: pointer;
                  border: 1px solid rgba(255, 156, 45, 0.5);
                }
                &.selected {
                  background-color: rgba(255, 156, 45, 0.2);
                  color: rgba(255, 156, 45, 1);
                  cursor: pointer;
                  border: 1px solid rgba(255, 156, 45, 0.5);
                }
              }
            }
          }
          .BettingAmount {
            height: 100%;
            padding: 5px;
            input {
              height: 100%;
              border-radius: 5px;
              background-color: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              color: rgba(255, 255, 255, 0.5);
              width: 100px;
              padding: 5px;
              font-family: var(--main_font);
              font-size: 1.1rem;
              outline: none;
            }
          }
          .Oponents {
            display: flex;
            height: 100%;
            width: auto;
            width: 100px;
            align-items: center;
            gap: 2px;
            position: relative;
            justify-content: center;
            &:after {
              content: "VS";
              position: absolute;
              font-family: var(--squid_font);
              font-size: 1.2rem;
              color: white;
              background: linear-gradient(
                96deg,
                rgba(74, 74, 74, 0) 0%,
                rgba(74, 74, 74, 1) 50%,
                rgba(74, 74, 74, 0) 100%
              );
            }
            .Oponent {
              height: 45px;
              width: 45px;
              background-color: var(--bg_color_super_light);
              border-radius: 5px;
              background-position: center;
              background-size: cover;
              &:first-child {
                background-image: url(${(props: any) => props.oponent1avatar});
              }
              &:last-child {
                background-image: url(${(props: any) => props.oponent2avatar});
              }
            }
          }
        }
      }
      .betButton {
        width: 100px;
        height: 40px;
        background-color: transparent;
        border-radius: 5px;
        border: 1px solid rgba(255, 156, 45, 0.5);
        cursor: pointer;
        transition: background-color 0.3s ease;
        color: rgba(255, 156, 45, 1);
        font-family: var(--squid_font);
        &:hover {
          background-color: rgba(255, 156, 45, 0.1);
        }
      }
    }
    .ChatContainer {
      flex: 1;
      background-color: var(--bg_color_light);
      border: 1px solid var(--bg_color_super_light);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      position: relative;
      align-items: center;
      padding: 5px 10px;
      .ChatMessages {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
        justify-content: flex-start;
      }
      .Chat-input {
        height: 45px;
        width: 100%;
        position: relative;

        .Chat-input-icons {
          position: absolute;
          right: 10px;
          height: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          .InputOptIcon {
            cursor: pointer;
            transition: fill 0.2s ease;
            &:hover {
              fill: rgba(255, 255, 255, 1);
            }
          }
        }
        input {
          width: 100%;
          height: 100%;
          border-radius: 5px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background-color: rgba(255, 255, 255, 0.05);
          font-size: 1rem;
          padding: 10px;
          font-family: var(--main_font);
          outline: none;
          color: white;
        }
      }
    }
  }
`;

const Spectate = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedBet, setSelectedBet] = Zeroact.useState<string | null>(null);
  const [ammountBet, setAmmountBet] = Zeroact.useState<number | null>(null);
  const [showCameraModes, setShowCameraModes] = Zeroact.useState(false);

  const handleBetSelection = (bet: string) => {
    setSelectedBet((prev) => (prev === bet ? null : bet));
  };
  const navigate = useNavigate();

  const { camera } = useGameScene(canvasRef);

  const onCameraModeChange = (mode: CameraModeName) => {
    camera.setCurrentMode(mode);
  };
  return (
    <StyledSpectate
      oponent1avatar={db.users[0].avatar}
      oponent2avatar={db.users[1].avatar}
    >
      <div className="GameContainer">
        <div className="GameContainerOptions">
          <div className="LiveIcon">
            <LiveIcon fill="var(--main_color)" size={20} />
            <span>LIVE</span>
          </div>

          <button className="LeaveButton" onClick={() => navigate("/lobby")}>
            <SignOutIcon fill="var(--main_color)" size={20} />
            Leave
          </button>

          <div className="SideOptions">
            <div
              className="CameraOption"
              onClick={() => setShowCameraModes((prev) => !prev)}
            >
              <CameraIcon fill="rgba(0,0,0, 0.3)" size={25} />
            </div>
          </div>
        </div>

        <canvas className="gameCanvas" ref={canvasRef} />

        {showCameraModes && (
          <div className="CameraModes">
            {cameraModes.map((mode) => (
              <div
                key={mode.mode_name}
                className={`CameraModeOption ${
                  camera.currentMode === mode.mode_name ? "selected" : ""
                }`}
                onClick={() => {
                  onCameraModeChange(mode.mode_name);
                  setShowCameraModes(false);
                }}
              >
                {mode.mode_name}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="RightContainer">
        <div className="BettingContainer">
          <div className="BettingHeader">
            <div className="BetCard">
              <div className="Oponents">
                <div className="Oponent" />
                <div className="Oponent" />
              </div>

              <div className="BettingOptions">
                <div className="BettingOption">
                  <span className="BettingOptionName">W1</span>
                  <span
                    className={`BettingOptionOdds ${
                      selectedBet === "W1" ? "selected" : ""
                    }`}
                    onClick={() => handleBetSelection("W1")}
                  >
                    2.5
                  </span>
                </div>

                <div className="BettingOption">
                  <span className="BettingOptionName">W2</span>
                  <span
                    className={`BettingOptionOdds ${
                      selectedBet === "W2" ? "selected" : ""
                    }`}
                    onClick={() => handleBetSelection("W2")}
                  >
                    3.0
                  </span>
                </div>
              </div>

              <div className="BettingAmount">
                <input
                  type="number"
                  min="100"
                  step="1"
                  placeholder="Enter amount"
                  value={ammountBet ? ammountBet : 100}
                  onChange={(e: any) => setAmmountBet(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          <button className="betButton">Bet</button>
        </div>
        <div className="ChatContainer">
          <div className="ChatMessages">
            {db.FakeGroupChatMessages.map((message: ChatMessage) => {
              return <GroupMessageEl {...message} />;
            })}
          </div>
          <div className="Chat-input">
            <div className="Chat-input-icons">
              <EmojiIcon
                fill="rgba(255,255,255, 0.6)"
                size={25}
                className="InputOptIcon"
              />
              <SendIcon
                fill="rgba(255,255,255, 0.6)"
                size={25}
                className="InputOptIcon"
              />
            </div>
            <input type="text" placeholder="Type your message..." />
          </div>
        </div>
      </div>
    </StyledSpectate>
  );
};

const StyledGroupMessage = styled("div")`
  width: 100%;
  display: flex;
  gap: 5px;
  .MsgBy {
    height: 35px;
    width: 35px;
    background-color: var(--bg_color_super_light);
    background-image: url(${(props: { avatar: string }) => props.avatar});
    background-size: cover;
    background-position: center;
    border-radius: 5px;
  }
  .MsgText {
    width: 100%;
    display: flex;
    flex-direction: column;
    .MsgByUserName {
      font-weight: 500;
      font-family: var(--main_font);
      color: rgba(255, 255, 255, 0.4);
    }
    .MsgData {
      font-weight: 100;
      color: white;
      font-family: var(--main_font);
      font-size: 0.9rem;
      border-radius: 4px;
      word-break: break-word;
    }
  }
`;
const GroupMessageEl = (props: ChatMessage) => {
  return (
    <StyledGroupMessage avatar={props.from.avatar}>
      <div className="MsgBy" />
      <div className="MsgText">
        <span className="MsgByUserName">{props.from.username}</span>
        <span className="MsgData">{props.message}</span>
      </div>
    </StyledGroupMessage>
  );
};

export default Spectate;

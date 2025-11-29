import Zeroact, { useEffect, useRef } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import {
  CameraIcon,
  EmojiIcon,
  LiveIcon,
  SendIcon,
  SignOutIcon,
} from "../Svg/Svg";
import { db } from "@/db";
import { useNavigate } from "@/contexts/RouterProvider";
import ScoreBoard from "../Game/Elements/ScoreBoard";
import { Game } from "../Game/Scenes/GameScene";
import { useRouteParam } from "@/hooks/useParam";
import { LoaderSpinner } from "../Loader/Loader";
import Skeleton from "../Skeleton/Skeleton";
import { getMatchById } from "@/api/match";
import { Match } from "@/types/game/game";
import { SpectateScene } from "../Game/Scenes/SpectateScene";
import { useAppContext } from "@/contexts/AppProviders";
import { Network } from "../Game/network/network";
import {
  cameraModes,
  SpectatorCamera,
} from "../Game/entities/Camera/SpectatorCamera";
import { getSpectateGroupByMatchId, sendMessage } from "@/api/chat";
import { socketManager } from "@/utils/socket";
// import { CameraModeName, cameraModes } from "../Game/entities/cameras/camera";

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
        top: 30px;
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
      position: relative;
      .ChatMessages {
        padding: 5px 10px;
        position: absolute;
        height: calc(100% - 55px);
        width: 100%;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
        justify-content: flex-start;
      }
      .Chat-input {
        position: absolute;
        bottom: 0;
        min-height: 50px;
        width: 100%;
        padding: 5px;

        .Chat-input-icons {
          position: absolute;
          right: 10px;
          min-height: 50px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          a {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .InputOptIcon {
            cursor: pointer;
            transition: fill 0.2s ease;
            &:hover {
              fill: rgba(255, 255, 255, 1);
            }
          }
        }
        .Chat-input-field {
          min-height: 50px;
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
  /**
   * Refs
   */
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const SpectateSceneRef = useRef<SpectateScene | null>(null);
  const netWorkRef = useRef<Network | null>(null);
  const cameraRef = useRef<SpectatorCamera | null>(null);
  /**
   *STATE
   */
  const [selectedBet, setSelectedBet] = Zeroact.useState<string | null>(null);
  const [ammountBet, setAmmountBet] = Zeroact.useState<number | null>(null);
  const [showCameraModes, setShowCameraModes] = Zeroact.useState(false);
  const [isLoading, setIsLoading] = Zeroact.useState(false);
  const [match, setMatch] = Zeroact.useState<Match | null>(null);
  const [chatGroup, setChatGroup] = Zeroact.useState<any>(null);
  const [message, setMessage] = Zeroact.useState<string>("");
  const [notFound, setNotFound] = Zeroact.useState(false);
  /**
   * Contexts
   */
  const navigate = useNavigate();

  /**
   * MATCH
   */
  const matchId = useRouteParam("/spectate/:id", "id");
  const { user } = useAppContext();

  /**
   * handlers
   */
  const handleBetSelection = (bet: string) => {
    setSelectedBet((prev) => (prev === bet ? null : bet));
  };
  const handleSendMessage = async () => {
    if (!chatGroup || !message.length) return;
    try {
      const resp = await sendMessage(chatGroup.chatId, message);
      if (resp.success) {
        setChatGroup((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            chat: {
              ...prev.chat,
              messages: [...(prev.chat?.messages ?? []), resp.data],
            },
          };
        });
        setMessage("");
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
      }
    } catch (err) {
      console.log("error sending a msg.", err);
    }
  };
  /**
   * Effects
   */
  useEffect(() => {
    if (!matchId) return;

    const fetchMatchData = async () => {
      // setIsLoading(true);
      try {
        const matchData = await getMatchById(matchId);
        if (matchData && matchData.data) {
          setMatch(matchData.data);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching match data:", error);
        setNotFound(true);
      }
    };
    const fetchMatchChat = async () => {
      try {
        const resp = await getSpectateGroupByMatchId(matchId);
        if (resp && resp.data) {
          console.log(resp.data);
          setChatGroup(resp.data);
        } else throw new Error("No data received");
      } catch (error) {
        console.error("Error fetching match chat data:", error);
      }
    };
    fetchMatchData();
    fetchMatchChat();

    try {
    } catch (err) {
      console.error("Error fetching match data:", err);
    }
  }, [matchId]);
  useEffect(() => {
    if (!match || !canvasRef.current || !user) return;

    SpectateSceneRef.current = new SpectateScene(
      canvasRef.current,
      match,
      user.id
    );
    SpectateSceneRef.current.start();
    netWorkRef.current = SpectateSceneRef.current.net;
    cameraRef.current = SpectateSceneRef.current.camera;
  }, [match, canvasRef.current, user]);
  useEffect(() => {
    requestAnimationFrame(() => {
      if (messagesRef.current) {
        console.log("Scrolling messages to bottom");
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });
  }, [messagesRef.current]);
  useEffect(() => {
    const handler = (data: any) => {
      console.log("socket chat event:", data);
      setChatGroup((prev) => {
        if (!prev) return prev;

        // Try to avoid applying messages for other chat groups
        const prevChatId = prev.chat?.chatId ?? prev.chat?.id ?? null;
        const incomingChatId = data.chatId ?? data.chat_id ?? null;
        if (prevChatId && incomingChatId && prevChatId !== incomingChatId)
          return prev;

        const messages = prev.chat?.messages ?? [];
        const messageExists = messages.some((m: any) => m.id === data.id);
        const updatedMessages = messageExists
          ? messages.map((m: any) => (m.id === data.id ? { ...m, ...data } : m))
          : [...messages, data];

        return {
          ...prev,
          chat: {
            ...prev.chat,
            messages: updatedMessages,
          },
        };
      });

      requestAnimationFrame(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
      });
    };

    socketManager.subscribe("chat", handler);

    return () => {
      socketManager.unsubscribe("chat", handler);
    };
  }, []);
  /**
   * Helpers
   */
  const messageFromUser = (message: any) => {
    return chatGroup.chat.members.find(
      (member: any) => member.userId === message.senderId
    )?.user;
  };

  // const onCameraModeChange = (mode: CameraModeName) => {
  //   camera.setCurrentMode(mode);
  // };

  return (
    <StyledSpectate
      oponent1avatar={match?.opponent1.avatarUrl}
      oponent2avatar={match?.opponent2.avatarUrl}
    >
      <div className="GameContainer">
        <ScoreBoard
          match={match}
          net={netWorkRef.current}
          resetCamera={() => {}}
          startCinematicCamera={() => {}}
        />
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

        {isLoading && <LoaderSpinner />}
        <canvas className="gameCanvas" ref={canvasRef} />

        {showCameraModes && (
          <div className="CameraModes">
            {cameraModes.map((mode) => (
              <div
                key={mode.mode_name}
                className={`CameraModeOption ${
                  cameraRef.current?.getMode() === mode.mode_name
                    ? "selected"
                    : ""
                }`}
                onClick={() => {
                  cameraRef.current?.setMode(mode.mode_name);
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
            {isLoading ? (
              <Skeleton
                height="60px"
                width="100%"
                dark={true}
                borderRadius={5}
                animation="hybrid"
                bgColor="var(--bg_color_super_light)"
              />
            ) : (
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
            )}
          </div>
          <button className="betButton">Bet</button>
        </div>
        <div className="ChatContainer">
          <div className="ChatMessages scroll-y" ref={messagesRef}>
            {isLoading ? (
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
              >
                {Array.from({ length: 10 }).map((_, index) => (
                  <Skeleton
                    height="50px"
                    width="100%"
                    dark={true}
                    index={index}
                    borderRadius={5}
                    animation={index % 2 === 0 ? "Shine" : "Wave"}
                    bgColor="var(--bg_color_super_light)"
                  />
                ))}
              </div>
            ) : (
              chatGroup?.chat?.messages.map((message: any) => {
                const from = messageFromUser(message);
                return <GroupMessageEl from={from} message={message.content} />;
              })
            )}
          </div>
          <div className="Chat-input">
            <div className="Chat-input-icons">
              <EmojiIcon
                fill="rgba(255,255,255, 0.6)"
                size={25}
                className="InputOptIcon"
              />
              <a onClick={handleSendMessage}>
                <SendIcon
                  fill="rgba(255,255,255, 0.6)"
                  size={25}
                  className="InputOptIcon"
                />
              </a>
            </div>
            <input
              type="text"
              className="Chat-input-field"
              placeholder="Type your message..."
              value={message}
              onChange={(e: any) => setMessage(e.target.value)}
              ref={inputRef}
              onKeyPress={(e: any) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
            />
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
interface ChatMessage {
  message: string;
  from: {
    avatar: string;
    username: string;
  };
}
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

import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { ChatGroup, ChatMessage, ConversationDetails } from "@/types/chat";
import { styled } from "@/lib/Zerostyle";
import {
  BackIcon,
  CloseIcon,
  EmojiIcon,
  GroupIcon,
  MinimizeIcon,
  PersonIcon,
  SendIcon,
  SettingsIcon,
  SignOutIcon,
} from "../Svg/Svg";
import { User, UserStatus } from "@/types/user";
import ChatMessaegeEl from "./ChatMessage";
import { useAppContext } from "@/contexts/AppProviders";
import {
  getMessages,
  markConversationAsRead,
  replyToMessage,
  sendMessage,
} from "@/api/chat";
import { socketManager } from "@/utils/socket";
import { useSounds } from "@/contexts/SoundProvider";

export type ConversationWithView = ConversationDetails & {
  viewState: "maximized" | "minimized";
  lastMessagePreview?: {
    content: string;
    sender: string;
    timestamp: number;
  };
};
const StyledChatContainer = styled("div")`
  .MinimizedConvsContainer {
    height: 100%;
    position: fixed;
    top: 10px;
    left: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2px;
    flex-direction: column;
    z-index: 999;
  }
  .MaximizedConvsContainer {
    position: fixed;
    bottom: 0px;
    left: 5px;
    display: flex;
    gap: 10px;
    z-index: 999;
    height: 50%;
    z-index: 9999;
  }
`;
const StyledMaximizedConv = styled("div")`
  width: 350px;
  height: 500px;
  background-color: var(--bg_color);
  border-bottom-right-radius: 20px;
  border-bottom-left-radius: 20px;
  border-top-right-radius: 10px;
  border-top-left-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 5px;
  z-index: 999;

  .chat-header {
    height: 50px;
    width: 100%;
    background-color: var(--main_color);
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    padding: 0 5px;
    cursor: pointer;
    .chat-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      .chat-controle {
        width: 30px;
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        .chat-controle-icon {
          transition: 0.1s ease-in-out;
          opacity: 1;
        }
        .chat-controle-icon:hover {
          opacity: 0.6;
        }
      }
    }
    .chat-title {
      height: 100%;
      width: auto;
      display: flex;
      align-items: center;
      flex: 1;
      .chat-avatar {
        width: 40px;
        height: 40px;
        background-image: url(${(props: any) => props.avatar_url});
        background-size: cover;
        background-position: center;
        border-radius: 10px;
        position: relative;
        &:after {
          position: absolute;
          content: "";
          width: 10px;
          height: 10px;
          background-color: ${(props: { userState: UserStatus }) =>
            props.userState === "ONLINE"
              ? "#15e215"
              : props.userState === "IDLE"
              ? "#f7d315"
              : props.userState === "DONOTDISTURB"
              ? "#f71515"
              : ""};
          border-radius: 50%;
          bottom: -1px;
          right: -2px;
        }
      }
      .chat-title-text {
        margin-left: 10px;
        h1 {
          font-size: 1rem;
          color: white;
          margin: 0;
          font-weight: 100;
          font-family: var(--main_font);
        }
      }
    }
  }
  .chat-messages {
    flex: 1;
    background-color: var(--bg_color_light);
    width: 100%;
    padding: 10px 10px 75px 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: scroll;
    position: relative;
  }

  .SettingsModal {
    width: 250px;
    min-height: 300px;
    background-color: var(--bg_color_super_light);
    position: absolute;
    right: 10px;
    top: 62px;
    box-shadow: rgb(24, 24, 24) 0px 20px 30px -10px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
    .settingsList {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 2px;
      .SettingsElement {
        width: 100%;
        height: 50px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 10px;
        cursor: pointer;
        font-family: var(--main_font);
        font-size: 1rem;
        color: white;
        border-radius: 5px;
        transition: 0.1s ease-in-out;
        &:hover {
          background-color: var(--bg_color_light);
        }
      }
    }
    .members {
      flex: 1;
      display: flex;
      flex-direction: column;
      .header {
        width: 100%;
        height: 50px;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        padding: 0 10px;
        cursor: pointer;
        font-family: var(--main_font);
        font-size: 1rem;
        color: white;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background-color: var(--bg_color_light);
        h2 {
          margin: 0;
          font-weight: 100;
          font-family: var(--main_font);
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.5);
        }
      }
      .membersContainer {
        flex: 1;
        overflow-y: auto;
        .member {
          width: 100%;
          height: 50px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 10px;
          cursor: pointer;
          font-family: var(--main_font);
          font-size: 1rem;
          color: white;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          .memberAvatar {
            width: 35px;
            height: 35px;
            background-size: cover;
            background-position: center;
            border-radius: 10px;
          }
          .memberName {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .memberRole {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
          }
        }
      }
    }
  }
  .replyingToContainer {
    background: linear-gradient(
      180deg,
      rgb(27, 26, 31, 0.7),
      rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-left: none;
    border-right: none;
    border-radius: 4px 4px 0 0;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    width: 100%;
    height: 100px;
    position: absolute;
    bottom: 0px;
    left: 0;
    padding: 10px;
    display: flex;

    .ReplyingToText {
      color: white;
      font-family: var(--main_font);
      opacity: 0.8;
    }
    .closeIcon {
      position: absolute;
      top: 5px;
      right: 5px;
      cursor: pointer;
      svg:hover {
        opacity: 0.8;
        fill: var(--red_color);
      }
    }
  }
  .chat-input-container {
    position: absolute;
    bottom: 5px;
    width: 340px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    .SendSvg {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      right: 5px;
      cursor: pointer;
      svg {
        transition: 0.1s ease-in-out;
        &:hover {
          fill: var(--main_color);
        }
      }
    }
    .EmojieSvg {
      position: absolute;
      left: 5px;
      cursor: pointer;
      transition: 0.1s ease-in-out;
      &:hover {
        opacity: 0.8;
      }
    }
    input {
      width: 100%;
      height: 100%;
      padding: 0 40px;
      outline: none;
      border: none;
      font-size: 1rem;
      background-color: var(--bg_color_super_light);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.7);
    }
    input::placeholder {
      color: white;
      opacity: 0.3;
    }
  }
`;
const StyledMinimizedConv = styled("div")`
  width: 50px;
  height: 50px;
  background-image: url(${(props: any) => props.avatar_url});
  background-size: cover;
  background-position: center;
  border-radius: 50%;
  border: 1px solid black;
  cursor: pointer;
  position: relative;
  .unreadCount {
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: var(--red_color);
    border: 1px solid var(--red_light_color);
    color: white;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--main_font);
    font-size: 0.75rem;
    font-weight: bold;
  }
  .MiniTooltip {
    position: absolute;
    left: 60px;
    border-radius: 5px;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    font-size: 0.8rem;
    color: white;
    font-family: var(--main_font);
    display: flex;
    align-items: center;
    padding: 5px 10px;
  }

  &:after {
    content: "";
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: #15e215;
    border-radius: 50%;
    bottom: 1px;
    right: 3px;
  }
`;
export const ChatContainer = () => {
  const [conversations, setConversations] = useState<ConversationWithView[]>(
    []
  );

  const { chat, user } = useAppContext();
  const { msgSentSound, msgReceivedSound } = useSounds();

  useEffect(() => {
    const convsIds: string[] | null = chat.activeConversations;

    if (!convsIds) {
      setConversations([]);
      return;
    }

    const getConversationDetails = async (id: number) => {
      try {
        const resp = await getMessages(id);
        if (resp.success && resp.data) {
          console.log("Fetched conversation details:", resp.data);
          setConversations((prevs) => {
            const existing = prevs.find((c) => c.id === resp.data!.id);
            if (existing) return prevs; // Already exists

            return [...prevs, { ...resp.data!, viewState: "maximized" }];
          });
        }
      } catch (error) {
        console.error("Error fetching conversation details:", error);
      }
    };

    for (const id of convsIds) {
      getConversationDetails(Number(id));
    }
  }, [chat.activeConversations]);

  useEffect(() => {
    const handleChatMessage = (data: any) => {
      if (!data.chatId) return;

      setConversations((prevConversations) => {
        const existingConv = prevConversations.find(
          (c) => Number(c.id) === Number(data.chatId)
        );

        if (!existingConv) {
          chat.setActiveConversations([
            ...(chat.activeConversations || []),
            data.chatId,
          ]);
          return prevConversations;
        }

        msgReceivedSound.play();

        return prevConversations.map((conv) => {
          if (Number(conv.id) !== Number(data.chatId)) return conv;

          const messageExists = conv.messages.some((m) => m.id === data.id);

          const updatedMessages = messageExists
            ? conv.messages.map((m) => {
                if (m.id === data.id) {
                  return { ...m, ...data };
                } else return m;
              })
            : [...conv.messages, data];

          const updatedConv = {
            ...conv,
            messages: updatedMessages,
            unreadCount: conv.unreadCount ? conv.unreadCount + 1 : 1,
          };

          if (conv.viewState === "minimized") {
            return {
              ...updatedConv,
              lastMessagePreview: {
                content: data.content || data.text || "New message",
                sender: data.sender?.username || "Unknown",
                timestamp: Date.now(),
              },
            };
          }

          return updatedConv;
        });
      });
    };

    socketManager.subscribe("chat", handleChatMessage);

    return () => {
      socketManager.unsubscribe("chat", handleChatMessage);
    };
  }, []); // Empty dependency - subscribe once

  const minimizedConversations = conversations.filter(
    (c) => c.viewState === "minimized"
  );
  const maximizedConversations = conversations.filter(
    (c) => c.viewState === "maximized"
  );
  const onMaximizeClick = (conversationId: string) => {
    setConversations((prevs) =>
      prevs.map((conv) =>
        conv.id === conversationId
          ? { ...conv, viewState: "maximized" as const }
          : conv
      )
    );
  };
  const onMinimizeClick = (conversationId: string) => {
    setConversations((prevs) =>
      prevs.map((conv) =>
        conv.id === conversationId
          ? { ...conv, viewState: "minimized" as const }
          : conv
      )
    );
  };
  const onCloseClick = (conversationId: string) => {
    setConversations((prevs) => prevs.filter((c) => c.id !== conversationId));

    chat.setActiveConversations(
      chat.activeConversations?.filter((id) => id !== conversationId) || []
    );
  };

  useEffect(() => {
    if (!conversations.some((c) => c.lastMessagePreview)) return;
    const interval = setInterval(() => {
      setConversations((prevs) =>
        prevs.map((conv) => ({
          ...conv,
          lastMessagePreview: undefined,
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [conversations]);

  if (!user) return null;

  return (
    <StyledChatContainer>
      <div className="MinimizedConvsContainer">
        {minimizedConversations.map((conversation) => {
          const chattingWith = conversation.participants.find(
            (p) => Number(p.userId) !== Number(user!.userId)
          );
          return (
            <StyledMinimizedConv
              key={conversation.id}
              avatar_url={
                conversation.group
                  ? conversation.group.imageUrl
                  : chattingWith?.avatar
              }
              onClick={() => onMaximizeClick(conversation.id)}
            >
              {conversation.lastMessagePreview?.content && (
                <span className="MiniTooltip">
                  {conversation.lastMessagePreview?.content}
                </span>
              )}

              {conversation.unreadCount && conversation.unreadCount > 0 && (
                <span className="unreadCount">{conversation.unreadCount}</span>
              )}
            </StyledMinimizedConv>
          );
        })}
      </div>
      <div className="MaximizedConvsContainer">
        {maximizedConversations.map((conversation) => {
          const chattingWith = conversation.participants.find(
            (p) => Number(p.userId) !== Number(user!.userId)
          );
          return (
            <MaximizedConv
              conversation={conversation}
              userId={user!.userId}
              chattingWithId={chattingWith?.userId || ""}
              onMinimize={() => onMinimizeClick(conversation.id)}
              onClose={() => onCloseClick(conversation.id)}
              setConversations={setConversations}
              key={conversation.id}
            />
          );
        })}
      </div>
    </StyledChatContainer>
  );
};
interface MaximizedConvProps {
  conversation: ConversationWithView;
  setConversations: (
    value:
      | ConversationWithView[]
      | ((prev: ConversationWithView[]) => ConversationWithView[])
  ) => void;
  chattingWithId: string;
  userId: string;
  onMinimize: () => void;
  onClose: () => void;
  key: string;
}
const MaximizedConv = (props: MaximizedConvProps) => {
  const [settingModalView, setSettingModalView] = useState<
    "members" | "requests" | "settingsList"
  >("settingsList");
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [chattingWith, setChattingWith] = useState<User | ChatGroup | null>(
    null
  );
  /**
   * Refs
   */
  const messagesRef = Zeroact.useRef<HTMLDivElement>(null);
  const MaximizedContainerRef = Zeroact.useRef<HTMLDivElement>(null);
  const settingModalRef = Zeroact.useRef<HTMLDivElement>(null);
  /**
   * Contexts
   */
  const { msgSentSound, msgReceivedSound } = useSounds();

  const [messageInput, setMessageInput] = Zeroact.useState<string>("");
  const [isReplyingTo, setIsReplyingTo] = Zeroact.useState<ChatMessage | null>(
    null
  );
  const inputRef = Zeroact.useRef<HTMLInputElement>(null);

  const handleSendMessage = async () => {
    if (messageInput.trim() === "") return;
    try {
      if (isReplyingTo) {
        const resp = await replyToMessage(isReplyingTo.id, messageInput);
        if (resp.success && resp.data) {
          msgSentSound.play();
          setMessageInput("");
          setIsReplyingTo(null);
          if (inputRef.current) {
            inputRef.current.value = "";
          }

          // Update only the conversations array
          props.setConversations((prevs) =>
            prevs.map((conv) =>
              conv.id === props.conversation.id
                ? { ...conv, messages: [...conv.messages, resp.data!] }
                : conv
            )
          );
        }
      } else {
        const resp = await sendMessage(
          Number(props.conversation.id),
          messageInput
        );
        if (resp.success && resp.data) {
          console.log("message sentasddddd============", resp);
          msgSentSound.play();
          setMessageInput("");
          if (inputRef.current) {
            inputRef.current.value = "";
          }

          // Update only the conversations array
          props.setConversations((prevs) =>
            prevs.map((conv) =>
              conv.id === props.conversation.id
                ? { ...conv, messages: [...conv.messages, resp.data!] }
                : conv
            )
          );
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  const markConvAsRead = async () => {
    try {
      const resp = await markConversationAsRead(Number(props.conversation.id));
      if (!resp) {
        console.error("Failed to mark conversation as read");
        return;
      }
    } catch (err) {
      console.error("Error marking conversation as read:", err);
    }
  };

  useEffect(() => {
    // set chatting with
    if (props.conversation.group) {
      setChattingWith(props.conversation.group);
    } else {
      const participant = props.conversation.participants.find(
        (p) => p.userId !== props.userId
      );
      if (participant) setChattingWith(participant);
    }
  }, []);
  useEffect(() => {
    if (!inputRef.current) return;

    inputRef.current.addEventListener("focus", () => {
      markConvAsRead();
      props.setConversations((prevs) =>
        prevs.map((conv) =>
          conv.id === props.conversation.id ? { ...conv, unreadCount: 0 } : conv
        )
      );
    });
    return () => {
      if (!inputRef.current) return;
      inputRef.current.removeEventListener("focus", () => {});
    };
  }, []);
  useEffect(() => {
    requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });
  }, [props.conversation.messages]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        MaximizedContainerRef.current &&
        !MaximizedContainerRef.current.contains(event.target as Node)
      ) {
        props.onMinimize();
      } else if (
        settingModalRef.current &&
        !settingModalRef.current.contains(event.target as Node)
      ) {
        setSettingsModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [MaximizedContainerRef.current, settingModalRef.current]);

  /**
   * Flags
   */
  const isAdmin = props.conversation.group?.members.some(
    (m) =>
      Number(m.userId) === Number(props.userId) &&
      (m.role === "ADMIN" || m.role === "OWNER")
  );

  if (!chattingWith) return null;

  return (
    <StyledMaximizedConv
      avatar_url={
        (chattingWith as User).avatar || (chattingWith as ChatGroup).imageUrl
      }
      ref={MaximizedContainerRef}
      // userState={chattingWith.status}
    >
      <div className="chat-header">
        <div className="chat-controls">
          {props.conversation.group ? (
            <div
              className="chat-controle"
              onClick={() => setSettingsModalOpen(true)}
            >
              <SettingsIcon
                stroke="white"
                size={20}
                className="chat-controle-icon"
              />
            </div>
          ) : null}
          <div className="chat-controle" onClick={props.onMinimize}>
            <MinimizeIcon
              stroke="white"
              size={25}
              className="chat-controle-icon"
            />
          </div>
          <div className="chat-controle" onClick={props.onClose}>
            <CloseIcon fill="white" size={23} className="chat-controle-icon" />
          </div>
        </div>
        <div className="chat-title" onClick={props.onMinimize}>
          <div className="chat-avatar"></div>
          <div className="chat-title-text">
            <h1>
              {props.conversation.group
                ? (chattingWith as ChatGroup).name
                : (chattingWith as User).username}
            </h1>
          </div>
        </div>
      </div>

      <div className="chat-messages scroll-y" ref={messagesRef}>
        {props.conversation.messages.map((message: ChatMessage) => {
          return (
            <ChatMessaegeEl
              key={message.id}
              message={message}
              conversationId={props.conversation.id}
              setConversations={props.setConversations}
              isUser={Number(message.sender.userId) === Number(props.userId)}
              userId={props.userId}
              setIsReplyingTo={setIsReplyingTo}
              id={`message-${message.id}`}
            />
          );
        })}
      </div>

      {isReplyingTo && (
        <div className="replyingToContainer">
          <div className="closeIcon" onClick={() => setIsReplyingTo(null)}>
            <CloseIcon fill="rgba(255, 255,255, 0.6)" size={20} />
          </div>
          <span className="ReplyingToText">
            Replying to:{" "}
            {isReplyingTo.content.length > 10
              ? isReplyingTo.content.slice(0, 10) + "..."
              : isReplyingTo.content}
          </span>
        </div>
      )}
      <div className="chat-input-container">
        <a onClick={() => handleSendMessage()} className="SendSvg">
          <SendIcon fill="white" size={25} />
        </a>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          onChange={(e: any) => setMessageInput(e.target.value)}
          value={messageInput}
          onKeyDown={(e: any) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
        />
        <EmojiIcon fill="white" size={25} className="EmojieSvg" />
      </div>

      {settingsModalOpen && (
        <div className="SettingsModal" ref={settingModalRef}>
          {settingModalView === "settingsList" ? (
            <div className="settingsList">
              <div
                className="SettingsElement"
                onClick={() => {
                  setSettingModalView("members");
                }}
              >
                <GroupIcon fill="white" size={20} /> members
              </div>
              <div
                className="SettingsElement"
                onClick={() => {
                  setSettingModalView("settingsList");
                }}
              >
                <SettingsIcon fill="white" size={20} /> group settings
              </div>
              <div className="SettingsElement">
                <SignOutIcon fill="white" size={20} /> leave group
              </div>

              {isAdmin && (
                <div className="SettingsElement">
                  <SignOutIcon fill="white" size={20} /> delete group
                </div>
              )}
              {isAdmin && (
                <div
                  className="SettingsElement"
                  onClick={() => {
                    setSettingModalView("requests");
                  }}
                >
                  <PersonIcon fill="white" size={20} /> membership requests
                </div>
              )}
            </div>
          ) : settingModalView === "members" ? (
            <div className="members">
              <div className="header">
                <a onClick={() => setSettingModalView("settingsList")}>
                  <BackIcon fill="rgba(255,255,255,0.5)" size={20} />
                </a>
                <h2>Group Members</h2>
              </div>
              <div className="membersContainer">
                {props.conversation.participants.map((m) => {
                  const isAdmin = props.conversation.group?.members.some(
                    (member) =>
                      Number(member.userId) === Number(m.userId) &&
                      (member.role === "ADMIN" || member.role === "OWNER")
                  );
                  return (
                    <div className="member" key={m.id}>
                      <div
                        className="memberAvatar"
                        style={{ backgroundImage: `url(${m.avatar})` }}
                      />
                      <span className="memberName">
                        {m.firstName} {m.lastName}
                      </span>
                      {isAdmin && <span className="memberRole"> (Admin) </span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="requestsView"></div>
          )}
        </div>
      )}
    </StyledMaximizedConv>
  );
};

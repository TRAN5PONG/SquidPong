import Zeroact, { useEffect, useState } from "@/lib/Zeroact";
import { ChatMessage, ConversationDetails } from "@/types/chat";
import { styled } from "@/lib/Zerostyle";
import { CloseIcon, EmojiIcon, MinimizeIcon, SendIcon } from "../Svg/Svg";
import { UserStatus } from "@/types/user";
import ChatMessaegeEl from "./ChatMessage";
import { useAppContext } from "@/contexts/AppProviders";
import { getMessages, sendMessage } from "@/api/chat";
import { socketManager } from "@/utils/socket";
import { useSounds } from "@/contexts/SoundProvider";

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
    background-color: rgba(141, 172, 245, 0.863);
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
            props.userState === "online"
              ? "#15e215"
              : props.userState === "idle"
              ? "#f7d315"
              : props.userState === "doNotDisturb"
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
  const [converstations, setConversations] = useState<ConversationDetails[]>(
    []
  );
  const [minimizedConversations, setMinimizedConversations] = useState<
    ConversationDetails[]
  >([]);
  const [maximizedConversations, setMaximizedConversations] = useState<
    ConversationDetails[]
  >([]);

  const { chat, user } = useAppContext();

  useEffect(() => {
    const convsIds: string[] | null = chat.activeConversations;

    if (!convsIds) {
      setConversations([]);
      setMinimizedConversations([]);
      setMaximizedConversations([]);
      return;
    }

    const getConversationDetails = async (id: number) => {
      try {
        const resp = await getMessages(id);
        if (resp.success && resp.data) {
          setConversations((prevs) => {
            if (prevs.find((c) => c.id === resp.data!.id)) return prevs;
            return [...prevs, resp.data!];
          });

          setMaximizedConversations((prevMax) => {
            if (prevMax.find((c) => c.id === resp.data!.id)) return prevMax;
            return [...prevMax, resp.data!];
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

  // on maximized not on view
  // useEffect(() => {
  //   socketManager.subscribe("chat", (data: any) => {
  //     if (chat.activeConversations?.includes(data.chatId)) return;

  //     chat.setActiveConversations([
  //       ...(chat.activeConversations || []),
  //       data.chatId,
  //     ]);
  //   });
  // }, []);

  // useEffect(() => {
  //   console.log("minimized conversations updated:", minimizedConversations);
  // }, [minimizedConversations]);

  useEffect(() => {
    if (converstations.length > 0 && maximizedConversations.length === 0) {
      setMaximizedConversations(converstations);
    }
  }, [converstations]);

  const onMaximizeClick = (conversation: ConversationDetails) => {
    if (!minimizedConversations) return;
    if (!maximizedConversations) return;
    setMinimizedConversations(
      minimizedConversations.filter((c) => c.id !== conversation.id)
    );
    setMaximizedConversations([...maximizedConversations, conversation]);
  };
  const onMinimizeClick = (conversation: ConversationDetails) => {
    if (!maximizedConversations) return;
    if (!minimizedConversations) return;
    setMaximizedConversations(
      maximizedConversations.filter((c) => c.id !== conversation.id)
    );
    setMinimizedConversations([...minimizedConversations, conversation]);
  };
  const onCloseClick = (conversation: ConversationDetails) => {
    setMinimizedConversations(
      minimizedConversations.filter((c) => c.id !== conversation.id)
    );
    setMaximizedConversations(
      maximizedConversations.filter((c) => c.id !== conversation.id)
    );
    chat.setActiveConversations(
      chat.activeConversations?.filter((id) => id !== conversation.id) || []
    );
  };

  if (!user) return null;

  return (
    <StyledChatContainer>
      <div className="MinimizedConvsContainer">
        {minimizedConversations &&
          minimizedConversations.map((conversation) => {
            const chattingWith = conversation.participants.find(
              (p) => Number(p.userId) !== Number(user!.userId)
            );
            return (
              <StyledMinimizedConv
                key={conversation.id}
                avatar_url={chattingWith?.avatar}
                onClick={() => onMaximizeClick(conversation)}
              >
                {conversation.unreadCount && conversation.unreadCount > 0 && (
                  <span className="unreadCount">
                    {conversation.unreadCount}
                  </span>
                )}
              </StyledMinimizedConv>
            );
          })}
      </div>
      <div className="MaximizedConvsContainer">
        {maximizedConversations &&
          maximizedConversations.map((conversation) => {
            const chattingWith = conversation.participants.find(
              (p) => Number(p.userId) !== Number(user!.userId)
            );
            return (
              <MaximizedConv
                conversation={conversation}
                userId={user!.userId}
                chattingWithId={chattingWith?.userId || ""}
                onClick={() => onMinimizeClick(conversation)}
                onClose={() => onCloseClick(conversation)}
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
  conversation: ConversationDetails;
  setConversations: (
    value:
      | ConversationDetails[]
      | ((prev: ConversationDetails[]) => ConversationDetails[])
  ) => void;
  chattingWithId: string;
  userId: string;
  onClick: () => void;
  onClose?: () => void;
  key?: string;
}
const MaximizedConv = (props: MaximizedConvProps) => {
  const messagesRef = Zeroact.useRef<HTMLDivElement>(null);
  const { msgSentSound, msgReceivedSound } = useSounds();

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [props.conversation.messages]);
  /**
   * states
   */
  const [messageInput, setMessageInput] = Zeroact.useState<string>("");
  const inputRef = Zeroact.useRef<HTMLInputElement>(null);

  /**
   * checkers
   */
  const chattingWith = props.conversation.participants.find(
    (p) => p.userId === props.chattingWithId
  );

  /**
   * handlers
   */
  const handleSendMessage = async () => {
    if (messageInput.trim() === "") return;
    try {
      const resp = await sendMessage(
        Number(props.conversation.id),
        messageInput
      );
      if (resp.success && resp.data) {
        msgSentSound.play();
        setMessageInput("");
        if (inputRef.current) {
          inputRef.current.value = "";
        }
        props.setConversations((prevs) =>
          prevs.map((conv) =>
            conv.id === props.conversation.id
              ? { ...conv, messages: [...conv.messages, resp.data!] }
              : conv
          )
        );
      } else {
        console.error("Failed to send message:", resp.message);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };


  useEffect(() => {
    
  })
  useEffect(() => {
    socketManager.subscribe("chat", (data: any) => {
      if (data.chatId) {
        // i think both users will get the message from socket !! // todo
        msgReceivedSound.play();
        props.setConversations((prevs) =>
          prevs.map((conv) =>
            Number(conv.id) === Number(data.chatId)
              ? { ...conv, messages: [...conv.messages, data] }
              : conv
          )
        );
      }
    });

    return () => {
      socketManager.unsubscribe("chat", () => {});
    };
  }, []);

  if (!chattingWith) return null;
  return (
    <StyledMaximizedConv
      avatar_url={chattingWith.avatar}
      userState={chattingWith.status} // here i can later calc most of users statuses
      key={props.key}
    >
      <div className="chat-header">
        <div className="chat-controls">
          <div className="chat-controle">
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
        <div className="chat-title" onClick={props.onClick}>
          <div className="chat-avatar"></div>
          <div className="chat-title-text">
            <h1>{chattingWith.username}</h1>
          </div>
        </div>
      </div>
      <div className="chat-messages scroll-y" ref={messagesRef}>
        {props.conversation.messages.map((message: ChatMessage) => {
          return (
            <ChatMessaegeEl
              message={message}
              isUser={Number(message.sender.userId) === Number(props.userId)}
            />
          );
        })}
      </div>
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
    </StyledMaximizedConv>
  );
};

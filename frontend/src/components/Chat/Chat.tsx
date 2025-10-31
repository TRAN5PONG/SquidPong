import Zeroact, { useEffect, useState } from "@/lib/Zeroact";
import { ChatMessage, ConversationDetails } from "@/types/chat";
import { styled } from "@/lib/Zerostyle";
import { CloseIcon, MinimizeIcon } from "../Svg/Svg";
import { UserStatus } from "@/types/user";
import ChatInput from "./ChatInput";
import ChatMessaegeEl from "./ChatMessage";
import { db } from "@/db";
import { useAppContext } from "@/contexts/AppProviders";

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
    gap: 5px;
    overflow-y: scroll;
    position: relative;

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
interface ChatContainerProps {
  conversationsIds: string[];
}
export const ChatContainer = (props: ChatContainerProps) => {
  const [converstations, setConversations] = useState<
    ConversationDetails[] | null
  >(null);
  const [minimizedConversations, setMinimizedConversations] = useState<
    ConversationDetails[] | null
  >(null);
  const [maximizedConversations, setMaximizedConversations] = useState<
    ConversationDetails[] | null
  >(null);

  const appCtx = useAppContext();

  useEffect(() => {
    //fetch conversations from db
    const convsIds: string[] | null = appCtx.chat.activeConversations;

    if (!convsIds) {
      // Clear conversations if no active conversations
      setConversations(null);
      setMinimizedConversations(null);
      setMaximizedConversations(null);
      return;
    }

    const convs: ConversationDetails[] = []; // TODO: I WILL DIFINITELY NEED TO FETCH ONLY THE NEW INJECTED ONES RATHER THAN ALL OF THEM EVRY TIME!
    for (const id of convsIds) {
      const conversation = db.fakeConversationDetails.find(
        (conv) => conv.id === id
      );
      if (conversation) {
        convs.push(conversation);
      }
    }
    setConversations(convs);

    setMinimizedConversations(convs);
    setMaximizedConversations([]);
  }, [appCtx.chat.activeConversations]);

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
    if (!maximizedConversations) return;
    if (!minimizedConversations) return;
    setMaximizedConversations(
      maximizedConversations.filter((c) => c.id !== conversation.id)
    );
    setMinimizedConversations(
      minimizedConversations.filter((c) => c.id !== conversation.id)
    );
  };

  if (!appCtx.user) return null;

  return (
    <StyledChatContainer>
      <div className="MinimizedConvsContainer">
        {minimizedConversations &&
          minimizedConversations.map((conversation) => (
            <StyledMinimizedConv
              avatar_url={
                conversation.participants.find((p) => p.id !== appCtx.user!.id) //todo : stupid approach
                  ?.avatar
              }
              onClick={() => onMaximizeClick(conversation)}
            />
          ))}
      </div>
      <div className="MaximizedConvsContainer">
        {maximizedConversations &&
          maximizedConversations.map((conversation) => (
            <MaximizedConv
              conversation={conversation}
              userId={appCtx.user!.id}
              chattingWithId={
                conversation.participants.find((p) => p.id !== appCtx.user!.id)
                  ?.id || ""
              }
              onClick={() => onMinimizeClick(conversation)}
              onClose={() => onCloseClick(conversation)}
            />
          ))}
      </div>
    </StyledChatContainer>
  );
};
interface MaximizedConvProps {
  conversation: ConversationDetails;
  chattingWithId: string;
  userId: string;
  onClick: () => void;
  onClose?: () => void;
}
const MaximizedConv = (props: MaximizedConvProps) => {
  const messagesRef = Zeroact.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, []);

  const chattingWith = props.conversation.participants.find(
    (p) => p.id !== props.conversation.participants[0].id
  );

  if (!chattingWith) return null;

  return (
    <StyledMaximizedConv
      avatar_url={chattingWith.avatar}
      userState={chattingWith.status} // here i can later calc most of users statuses
    >
      <div className="chat-header" onClick={props.onClick}>
        <div className="chat-controls">
          <div className="chat-controle" onClick={props.onClick}>
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
        <div className="chat-title">
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
              isUser={message.from.id === props.userId}
            />
          );
        })}
      </div>
      <ChatInput />
    </StyledMaximizedConv>
  );
};

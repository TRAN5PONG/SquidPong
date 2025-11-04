import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";

import { db } from "@/db";

import { Conversation } from "@/types/chat";
import {
  BackIcon,
  ChatIcon,
  NewChatIcon,
  SearchIcon,
  SeenIcon,
  VerifiedIcon,
} from "@/components/Svg/Svg";
import { User, UserStatus } from "@/types/user";
import Skeleton from "@/components/Skeleton/Skeleton";
import { useAppContext } from "@/contexts/AppProviders";

const SyledChatModal = styled("div")`
  width: 350px;
  height: 500px;
  border-radius: 5px;
  position: fixed;
  top: 55px;
  right: 5px;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  background: rgb(19, 18, 23);
  border: 1px solid rgba(255, 255, 255, 0.1);
  gap: 1px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 3px;
  .ChatsContainer {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 2px;
    .ChatsContainerHeader {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px;
      h2 {
        font-family: var(--main_font);
        font-size: 1.2rem;
        color: rgba(255, 255, 255, 0.9);
      }
      .NewChatBtn {
        width: 120px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        background-color: #495b86;
        border: 1px solid rgba(117, 147, 218, 0.3);
        color: rgba(255, 255, 255, 0.5);
        border-radius: 3px;
        font-family: var(--main_font);
        font-size: 0.9rem;
        font-weight: 600;
        transition: 0.1s ease-in-out;
        gap: 7px;
        margin-top: auto;
        &:hover {
          background-color: #5a6f9c;
        }
      }
    }
    .NFoundSpan {
      color: rgba(255, 255, 255, 0.5);
      font-family: var(--main_font);
      margin-top: 5px;
    }
  }
  .NewChatContainer {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 5px;
    .NewChatContainerHeader {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      h2{
        font-family: var(--main_font);
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.7);
        flex: 1;
        font-weight: 100;
      }
      .BackToConvsBtn {
        width: 40px;
        height: 40px;
        background-color: transparent;
        border: none;
        font-family: var(--main_font);
        border-radius: 3px;
        font-size: 1rem;
        cursor: pointer;
        transition: 0.1s ease-in-out;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
      }
    }
    .SearchInput_ {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      svg {
        position: absolute;
        z-index: 1;
        right: 15px;
      }

      .SearchInputField {
        height: 40px;
        width: 100%;
        border-radius: 3px;
        background-color: rgba(255, 255, 255, 0.04);
        color: white;
        font-family: var(--main_font);
        font-size: 1rem;
        outline: none;
        border: 1px solid rgba(255, 255, 255, 0.08);
        margin: 0px;
        padding-left: 10px;
      }
    }

    .UsersContainer {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      gap: 3px;
      .UserItem {
        width: 100%;
        height: 40px;
        background-color: var(--bg_color_light);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 5px;
        .UserItemAvatar {
          width: 35px;
          height: 35px;
          border-radius: 3px;
          background-color: rgba(255, 255, 255, 0.1);
          background-position: center;
          background-size: cover;
          margin-left: 2px;
        }
        .UserItemInfo {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-family: var(--main_font);
          font-size: 0.9rem;
          color: white;

          .UserItemName {
            display: flex;
            align-items: center;
            gap: 5px;
            justify-content: flex-start;
          }
          .UserItemStatus {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
          }
        }
        .StartConvBtn {
          width: 40px;
          height: 40px;
          background-color: rgba(68, 85, 126, 0.2);
          color: rgba(255, 255, 255, 0.4);
          font-family: var(--main_font);
          border: 1px solid rgb(68, 85, 126, 0.3);
          border-radius: 3px;
          cursor: pointer;
          transition: 0.1s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
          &:hover {
            background-color: var(--bg_color_super_light);
          }
        }
      }
    }
  }
`;
interface ChatModalProps {
  onClose: () => void;
}

type ChatModalView = "chats" | "newChat";

const ChatModal = (props: ChatModalProps) => {
  const [currentView, setCurrentView] = useState<ChatModalView>("chats");
  const [isLoadingConversations, setIsLoadingConversations] =
    useState<boolean>(true);
  const [Conversations, setConversations] = useState<Conversation[] | null>(
    null
  );
  const [user, setUser] = useState<User | null>(null);

  const ModalRef = useRef<HTMLDivElement>(null);
  const appCtx = useAppContext();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        ModalRef.current &&
        !ModalRef.current.contains(event.target as Node)
      ) {
        props.onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ModalRef, props]);

  const OnMessageClick = (conversation: Conversation) => {
    console.log("Conversation clicked:", conversation);
    if (appCtx.chat.activeConversations?.includes(conversation.id)) {
      return;
    }
    appCtx.chat.setActiveConversations([
      ...(appCtx.chat.activeConversations || []),
      conversation.id,
    ]);
    props.onClose();
  };

  useEffect(() => {
    console.log("ChatModal mounted");

    setTimeout(() => {
      setConversations(db.conversations);
      setIsLoadingConversations(false);
    }, 500);
  }, []);

  useEffect(() => {
    setUser(appCtx.user);
  }, [appCtx.user]); // todo : i may delete this useEffect

  if (!user) return null;

  return (
    <SyledChatModal className="BorderBottomEffect" ref={ModalRef}>
      {currentView === "chats" ? (
        <div className="ChatsContainer">
          <div className="ChatsContainerHeader">
            <h2>Chats</h2>

            <div
              className="NewChatBtn"
              onClick={() => setCurrentView("newChat")}
            >
              <NewChatIcon fill="rgba(255, 255, 255, 0.5)" size={15} />
              <span>Create DM</span>
            </div>
          </div>
          {Conversations ? (
            Conversations.map((converstaion: Conversation, key) => {
              return (
                <ChatItem
                  converstation={converstaion}
                  userId={user?.id}
                  onClick={OnMessageClick}
                />
              );
            })
          ) : isLoadingConversations ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Skeleton
                dark={true}
                width="100%"
                height="50px"
                borderRadius={5}
                gap={5}
                animation="hybrid"
                index={index + 1}
              />
            ))
          ) : (
            <span className="NFoundSpan">No conversations started yet.</span>
          )}
        </div>
      ) : (
        <div className="NewChatContainer">
          <div className="NewChatContainerHeader">
            <button
              className="BackToConvsBtn"
              onClick={() => setCurrentView("chats")}
            >
              <BackIcon size={25} fill="rgba(255, 255, 255, 0.5)" />
            </button>
            <h2>Create a new conversation</h2>
          </div>
          <div className="SearchInput_">
            <SearchIcon size={20} stroke="rgba(255, 255, 255, 0.5)" />
            <input
              type="text"
              className="SearchInputField"
              placeholder="Search a player to chat with..."
            />
          </div>

          <div className="UsersContainer">
            {db.users.map((user) => (
              <div className="UserItem">
                <div
                  className="UserItemAvatar"
                  style={{ backgroundImage: `url(${user.avatar})` }}
                />
                <div className="UserItemInfo">
                  <span className="UserItemName">
                    {user.firstName + " " + user.lastName}
                    {user.isVerified && (
                      <VerifiedIcon size={15} fill="rgba(68, 85, 126, 1)" />
                    )}
                  </span>
                  <span className="UserItemStatus">{user.status}</span>
                </div>
                <button className="StartConvBtn">
                  <ChatIcon size={15} fill="rgba(68, 85, 126, 1)" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </SyledChatModal>
  );
};
const StyledChatItem = styled("div")`
  width: 100%;
  height: 50px;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: 0.1s ease-in-out;
  cursor: pointer;
  background-color: ${(props: any) =>
    props.isRead ? "var(--bg_color_light)" : "var(--bg_color)"};
  border: 1px solid rgba(255, 255, 255, 0.05);
  &:hover {
    background-color: var(--bg_color_super_light);
  }
  .ChatItemAvatar {
    width: 40px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.4);
    border-radius: 10px;
    background-image: url(${(props: any) => props.avatar || ""});
    background-size: cover;
    background-position: center;
    position: relative;
    &::after {
      content: "";
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: ${(props: { userStatus: UserStatus }) =>
        props.userStatus === "online"
          ? "var(--green_color)"
          : props.userStatus === "idle"
          ? "var(--yellow_color)"
          : props.userStatus === "doNotDisturb"
          ? "var(--red_color)"
          : "var(--gray_color)"};
      border: 1px solid rgba(255, 255, 255, 0.4);
    }
  }
  .ChatItemInfos {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    gap: 2px;
    padding: 0 5px;
    .ChatItemName {
      font-family: var(--main_font);
      font-weight: 500;
      font-size: 1rem;
      color: white;
    }
    .ChatItemLastMessage {
      font-family: var(--main_font);
      font-size: 0.9rem;
      color: white;
      display: flex;
      align-items: center;
      opacity: 0.9;
    }
  }
  .ChatItemTime {
    font-family: var(--main_font);
    font-size: 0.8rem;
    color: white;
    opacity: 0.6;
  }
`;
interface ChatItemProps {
  converstation: Conversation;
  userId: string;
  onClick: (conversation: Conversation) => void;
}
const ChatItem = (props: ChatItemProps) => {
  let time = "";
  if (props.converstation.lastMessage?.date) {
    const dateObj = new Date(props.converstation.lastMessage.date);
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    time = `${hours}:${minutes}`;
  }

  const isGroupChat = props.converstation.participants.length > 2; // todo : i may integrate this later.
  const chattingWith = props.converstation.participants.find(
    (participant) => participant.id !== props.userId
  );
  const isLastMessageFromUser =
    props.converstation.lastMessage?.from.id === props.userId;

  return (
    <StyledChatItem
      avatar={chattingWith?.avatar}
      isRead={
        props.converstation.lastMessage?.status !== "read" &&
        !isLastMessageFromUser
      }
      userStatus={chattingWith?.status}
      key={props.converstation.id}
      onClick={() => props.onClick(props.converstation)}
    >
      <div className="ChatItemAvatar"></div>
      <div className="ChatItemInfos">
        <span className="ChatItemName">{chattingWith?.username}</span>
        <div className="ChatItemLastMessage">
          <span>
            {isLastMessageFromUser &&
            props.converstation.lastMessage?.status === "delivered" ? (
              <SeenIcon size={20} fill="rgba(255,255,255, 0.3)" />
            ) : isLastMessageFromUser &&
              props.converstation.lastMessage?.status === "read" ? (
              <SeenIcon size={20} fill="var(--green_color)" />
            ) : (
              ""
            )}
          </span>
          <span>{isLastMessageFromUser && "You :"}</span>
          <span>{props.converstation.lastMessage?.message}</span>
        </div>
      </div>
      <div className="ChatItemTime">{time}</div>
    </StyledChatItem>
  );
};

export default ChatModal;

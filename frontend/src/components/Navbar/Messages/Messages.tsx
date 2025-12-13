import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";

import { db } from "@/db";

import { Conversation } from "@/types/chat";
import {
  BackIcon,
  ChatIcon,
  GroupIcon,
  NewChatIcon,
  SearchIcon,
  SeenIcon,
  VerifiedIcon,
} from "@/components/Svg/Svg";
import { User, UserStatus } from "@/types/user";
import Skeleton from "@/components/Skeleton/Skeleton";
import { useAppContext } from "@/contexts/AppProviders";
import { createGroupChat, getConversations, newConversation } from "@/api/chat";
import { getUserFriends, MiniUser, SearchUsers } from "@/api/user";

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
  .ChatsContainer {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0px 2px;
    .ChatsContainerHeader {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px;
      h2 {
        font-family: var(--main_font);
        font-weight: 100;
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.7);
      }
      .NewChatBtn {
        width: 120px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 3px;
        font-family: var(--main_font);
        font-size: 0.9rem;
        font-weight: 100;
        gap: 7px;
        margin-top: auto;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.3);
        transition: 0.2s ease-in-out;
        svg {
          transition: 0.2s ease-in-out;
        }
        &:hover {
          background-color: var(--bg_color_light);
        }
      }
    }
    .NFoundSpan {
      color: rgba(255, 255, 255, 0.5);
      font-family: var(--main_font);
      margin-top: 5px;
      text-align: center;
    }
  }
  .NewChatContainer {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 2px;
    .NewChatContainerHeader {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      h2 {
        font-family: var(--main_font);
        font-weight: 100;
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.5);
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
        font-family: var(--span_font);
        font-size: 1rem;
        font-weight: 500;
        outline: none;
        border: 1px solid rgba(255, 255, 255, 0.04);
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
        background-color: rgba(78, 94, 131, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.04);
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

          .UserItemName {
            display: flex;
            align-items: center;
            gap: 5px;
            justify-content: flex-start;
            color: rgba(255, 255, 255, 0.8);
          }
          .UserItemStatus {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
            font-family: var(--span_font);
          }
        }
        .StartConvBtn {
          width: 40px;
          height: 40px;
          background-color: rgba(78, 94, 131, 0.1);
          color: var(--main_color);
          font-family: var(--main_font);
          border: 1px solid rgba(78, 94, 131, 0.1);
          border-radius: 3px;
          cursor: pointer;
          transition: 0.1s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
          &:hover {
            background-color: rgba(78, 94, 131, 0.4);
          }
        }
      }
    }
    .NFoundSpan {
      color: rgba(255, 255, 255, 0.2);
      font-family: var(--span_font);
      margin-top: 5px;
      text-align: center;
    }
    .NewGroupBtn {
      width: 100%;
      height: 40px;
      background-color: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      font-family: var(--main_font);
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      transition: 0.2s ease-in-out;
      &:hover {
        background-color: var(--main_color);
      }
    }
  }
  .NewGroupContainer {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 5px;
    .NewGroupContainerHeader {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      h2 {
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
    .GroupDetails {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 5px;
      textArea {
        width: 100%;
        padding: 8px;
        border-radius: 5px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background-color: rgba(255, 255, 255, 0.04);
        font-family: var(--main_font);
        font-size: 1rem;
        color: white;
        outline: none;
        resize: none;
      }
      input {
        width: 100%;
        padding: 8px;
        border-radius: 5px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background-color: rgba(255, 255, 255, 0.04);
        font-family: var(--main_font);
        font-size: 1rem;
        color: white;
        outline: none;
        resize: none;
      }

      .GroupTypeSelection {
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: var(--main_font);
        font-size: 1rem;
        color: white;
        span {
          margin-right: 10px;
        }
        input {
          width: auto;
          height: auto;
        }
      }
      button {
        width: 100%;
        height: 40px;
        background-color: rgba(68, 85, 126, 0.2);
        color: rgba(255, 255, 255, 0.4);
        font-family: var(--main_font);
        border: 1px solid rgb(68, 85, 126, 0.3);
        border-radius: 3px;
        cursor: pointer;
        transition: 0.1s ease-in-out;
        &:hover {
          background-color: var(--bg_color_super_light);
        }
      }
    }
  }
`;
interface ChatModalProps {
  onClose: () => void;
  conversations: Conversation[];
  refetch_conversations: () => void;
}

type ChatModalView = "chats" | "newChat" | "newGroup";

const ChatModal = (props: ChatModalProps) => {
  const [currentView, setCurrentView] = useState<ChatModalView>("chats");
  const [friends, setFriends] = useState<MiniUser[]>([]);
  const [query, setQuery] = useState<string>("");
  /**
   * Group state
   */
  const [groupName, setGroupName] = useState<string>("");
  const [groupDesc, setGroupDesc] = useState<string>("");
  const [groupType, setGroupType] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  /**
   * Refs
   */
  const ModalRef = useRef<HTMLDivElement>(null);
  /**
   * Context
   */
  const { user, chat } = useAppContext();

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
    if (chat.activeConversations?.includes(conversation.id)) {
      return;
    }
    chat.setActiveConversations([
      ...(chat.activeConversations || []),
      conversation.id,
    ]);
    props.onClose();
  };
  /**
   * conversations
   */
  const fetchFriends = async () => {
    try {
      const friendsList = await getUserFriends(user!.username);
      if (friendsList.success && friendsList.data) {
        setFriends(friendsList.data);
      }
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };
  const Search = async (query: string) => {
    if (query.length === 0) return;
    const Users = await SearchUsers(query);
    if (Users.data) {
      const filterOutCurrentUser = Users.data.filter(
        (u) => u.userId !== user?.userId
      );
      setFriends(filterOutCurrentUser as unknown as MiniUser[]);
    }
  };
  const startNewConversation = async (friendId: string) => {
    try {
      const resp = await newConversation(friendId);
      if (resp.success) {
        props.refetch_conversations();
        setCurrentView("chats");
      }
    } catch (err) {
      console.error("Error starting new conversation:", err);
    }
  };
  const handleCreateGroupChat = async () => {
    if (groupName.trim().length === 0) return;

    try {
      const resp = await createGroupChat(groupName, groupDesc, groupType);
      if (resp.success) {
        props.refetch_conversations();
        setCurrentView("chats");
      } else throw new Error("Failed to create group conversation");
    } catch (err) {
      console.error("Error creating group conversation:", err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      Search(query.trim());
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);
  useEffect(() => {
    if (currentView === "newChat") {
      fetchFriends();
    }
  }, [currentView]);

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
              <NewChatIcon fill="rgba(255, 255, 255, 0.3)" size={15} />
              <span>Create DM</span>
            </div>
          </div>
          {
            // isLoadingConversations ? (
            //   Array.from({ length: 5 }).map((_, index) => (
            //     <Skeleton
            //       dark={true}
            //       width="100%"
            //       height="50px"
            //       borderRadius={5}
            //       gap={5}
            //       animation="hybrid"
            //       index={index + 1}
            //     />
            //   ))
            // ) :
            props.conversations && props.conversations.length > 0 ? (
              props.conversations.map((converstaion: Conversation, key) => {
                return (
                  <ChatItem
                    converstation={converstaion}
                    userId={user?.userId}
                    onClick={OnMessageClick}
                  />
                );
              })
            ) : (
              <span className="NFoundSpan">No conversations started yet.</span>
            )
          }
        </div>
      ) : currentView === "newChat" ? (
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
              value={query}
              onChange={(e: any) => setQuery(e.target.value)}
            />
          </div>

          <div className="UsersContainer">
            {friends && friends.length > 0 ? (
              friends.map((user) => (
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
                  <button
                    className="StartConvBtn"
                    onClick={() => startNewConversation(user.userId.toString())}
                  >
                    <ChatIcon size={15} fill="rgb(78, 94, 131)" />
                  </button>
                </div>
              ))
            ) : (
              <span className="NFoundSpan">No users found.</span>
            )}
          </div>

          <button
            className="NewGroupBtn"
            onClick={() => setCurrentView("newGroup")}
          >
            <NewChatIcon size={20} fill="rgba(255, 255, 255, 0.5)" />
            create group chat
          </button>
        </div>
      ) : (
        <div className="NewGroupContainer">
          <div className="NewGroupContainerHeader">
            <button
              className="BackToConvsBtn"
              onClick={() => setCurrentView("chats")}
            >
              <BackIcon size={25} fill="rgba(255, 255, 255, 0.5)" />
            </button>
            <h2>Create a new group chat</h2>
          </div>

          <div className="GroupDetails">
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e: any) => setGroupName(e.target.value)}
            />
            <textArea
              placeholder="Group Description"
              value={groupDesc}
              onChange={(e: any) => setGroupDesc(e.target.value)}
            />
            <div className="GroupTypeSelection">
              <span>Type :</span>
              <input
                type="radio"
                name="group_type"
                value="public"
                checked={groupType === "PUBLIC"}
                onChange={() => setGroupType("PUBLIC")}
              />
              Public
              <input
                type="radio"
                name="group_type"
                value="private"
                checked={groupType === "PRIVATE"}
                onChange={() => setGroupType("PRIVATE")}
              />
              Private
            </div>

            <button onClick={() => handleCreateGroupChat()}>
              Create Group Chat
            </button>
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
    border-radius: 5px;

  cursor: pointer;
  background-color: ${(props: any) =>
    props.isRead ? "var(--bg_color_light)" : "var(--bg_color)"};
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
    display: flex;
    align-items: center;
    justify-content: center;
    &::after {
      content: "";
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: ${(props: { userStatus: UserStatus }) =>
        props.userStatus === "ONLINE"
          ? "var(--green_color)"
          : props.userStatus === "IDLE"
          ? "var(--yellow_color)"
          : props.userStatus === "DONOTDISTURB"
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
      color: rgba(255,255,255, 0.7);
    }
    .ChatItemLastMessage {
      font-family: var(--span_font);
      font-size: 0.9rem;
      color: rgba(255,255,255, 0.5);
      display: flex;
      align-items: center;
      opacity: 0.9;
    }
  }
  .ChatItemTime {
    font-family: var(--span_font);
    font-size: 0.8rem;
    color: rgba(255,255,255, 0.5);
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
  if (props.converstation.lastMessage?.timestamp) {
    const dateObj = new Date(props.converstation.lastMessage.timestamp);
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    time = `${hours}:${minutes}`;
  }

  const groupChat = props.converstation.group;
  const chattingWith = props.converstation.participants.find(
    (participant) => Number(participant.userId) !== Number(props.userId)
  );
  const isLastMessageFromUser =
    Number(props.converstation.lastMessage?.sender.userId) ===
    Number(props.userId);

  return (
    <StyledChatItem
      avatar={groupChat ? groupChat.imageUrl : chattingWith?.avatar}
      isRead={
        props.converstation.lastMessage?.status !== "READ" &&
        !isLastMessageFromUser
      }
      userStatus={chattingWith?.status}
      key={props.converstation.id}
      onClick={() => props.onClick(props.converstation)}
    >
      <div className="ChatItemAvatar">
        {groupChat && <GroupIcon size={20} fill="rgba(255, 255, 255, 0.3)" />}
      </div>
      <div className="ChatItemInfos">
        <span className="ChatItemName">
          {groupChat ? groupChat.name : chattingWith?.username}
        </span>
        <div className="ChatItemLastMessage">
          <span>
            {isLastMessageFromUser &&
            props.converstation.lastMessage?.status === "DELIVERED" ? (
              <SeenIcon size={20} fill="rgba(255,255,255, 0.3)" />
            ) : isLastMessageFromUser &&
              props.converstation.lastMessage?.status === "READ" ? (
              <SeenIcon size={20} fill="var(--green_color)" />
            ) : (
              ""
            )}
          </span>
          <span>{isLastMessageFromUser && "You :"}</span>
          <span>
            {props.converstation.lastMessage
              ? props.converstation.lastMessage.invitationCode
                ? "Sent an invitation."
                : props.converstation.lastMessage.content.length > 15
                ? props.converstation.lastMessage.content.slice(0, 15) + "..."
                : props.converstation.lastMessage.content
              : "No messages yet."}
          </span>
        </div>
      </div>
      <div className="ChatItemTime">{time}</div>
    </StyledChatItem>
  );
};

export default ChatModal;

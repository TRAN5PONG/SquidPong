import Zeroact, { useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { ChatMessage } from "@/types/chat";
import {
  CoinIcon,
  DeleteIcon,
  EditIcon2,
  GroupIcon,
  InfosIcon,
  PingPongIcon,
} from "../Svg/Svg";
import {
  deleteMessage,
  editMessage,
  reactToMessage,
  removeReaction,
} from "@/api/chat";
import { timeAgo } from "@/utils/time";

const StyledChatMessage = styled("div")`
  width: 100%;
  display: flex;
  flex-direction: ${(props: any) => (props.isMe ? "row-reverse" : "row")};
  gap: 10px;
  position: relative;
  transition: 0.2s ease-in-out;

  &:hover .MsgOptions {
    opacity: 1;
  }
  &:hover .ChatMsg .ChatMsgBottom .Reactions .AddReaction {
    opacity: 1;
  }

  .ChatMessageFrom {
    width: 35px;
    height: 35px;
    border-radius: 5px;
    background-image: url("${(props: { avatar: string }) => props.avatar}");
    background-size: cover;
    background-position: center;
    display: ${(props: any) => props.isMe && "none"};
  }
  .ChatMsg {
    width: ${(props: any) => (props.isMe ? "90%" : "80%")};
    background-color: ${(props: any) =>
      props.isMe ? "rgb(141, 172, 245)" : "var(--bg_color_light)"};
    border: 1px solid rgba(256, 256, 256, 0.05);
    padding: 5px 5px 0px 5px;
    border-radius: ${(props: any) =>
      props.isMe ? "10px 10px 10px 10px" : "0px 10px 10px 10px"};
    font-family: var(--main_font);
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: relative;
    .GameInvite {
      width: 100%;
      height: 250px;
      background-color: #f7f1f1;
      border: 1px solid #d3d3d3eb;
      border-radius: 5px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: space-between;
      .Host {
        width: 100%;
        display: flex;
        background-size: cover;
        background-position: center;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 2px 0px;
        h1 {
          font-size: 1.1rem;
          opacity: 0.7;
        }
        span {
          font-size: 0.9rem;
          color: gray;
        }
        &:after {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          left: 0;
          top: 0;
          background: linear-gradient(
            90deg,
            rgba(131, 58, 180, 0.2) 0%,
            rgba(131, 58, 180, 0.1) 50%,
            rgba(131, 58, 180, 0) 100%
          );
        }

        .HostedBy {
          width: 50px;
          height: 50px;
          background-image: url(${(props: any) => props.avatar});
          background-size: cover;
          background-position: center;
          border-radius: 10px;
          margin-right: 5px;
        }
      }
      .GameOptions {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: 3px;
        padding: 3px;
        .GameOption {
          width: auto;
          border-radius: 5px;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2px 5px;
          gap: 10px;
          span {
            color: gray;
          }
        }
      }
      .ActionButtons {
        display: flex;
        justify-content: flex-end;
        gap: 2px;
        padding: 3px;
        background-color: white;
        border-radius: 5px;
        width: 100%;
        .DiclineButton {
          width: 60px;
          border-radius: 4px;
          background-color: transparent;
          color: var(--light_red_hover);
          font-weight: bold;
          border: 1px solid var(--light_red_hover);
          &:hover {
            background-color: var(--light_red_hover);
          }
        }
        .AcceptButton {
          border-radius: 4px;
          flex: 1;
          background-color: var(--light_green);
          color: var(--green_color);
          border: 1px solid var(--light_green_hover);
          &:hover {
            background-color: var(--light_green_hover);
          }
        }
        button {
          height: 30px;
          border: 1px solid #d3d3d3ab;
          border-radius: 5px;
          cursor: pointer;
          transition: 0.2s ease-in-out;
        }
      }
    }
    .ChatMsgText {
      font-size: 0.9rem;
      color: white;
    }
    .ChatMsgText[contenteditable="true"] {
      outline: 1px solid rgba(256, 256, 256, 0.2);
      background-color: rgba(256, 256, 256, 0.05);
      border-radius: 4px;
      padding: 5px 4px;
    }

    .ChatMsgBottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 0px;
      position: relative;
      .Reactions {
        display: flex;
        flex-direction: row;
        gap: 2px;
        left: 3px;
        position: relative;
        .AddReaction {
          padding: 1px 5px;
          cursor: pointer;
          transition: 0.2s ease-in-out;
          filter: brightness(1);
          opacity: 0.5;
          transition: 0.2s ease-in-out;
          &:hover {
            background-color: rgba(256, 256, 256, 0.1);
            border-radius: 10px;
          }
        }
        .Reaction {
          display: flex;
          background-color: rgba(256, 256, 256, 0.08);
          border: 1px solid rgba(256, 256, 256, 0.05);
          justify-content: center;
          align-items: center;
          border-radius: 10px;
          padding: 1px 5px;
          gap: 2px;
          cursor: pointer;
          span {
            color: gray;
            font-size: 0.9rem;
          }
          .Reactors {
            .Reactor {
            }
          }
        }
        .ReactorsTooltip {
          position: absolute;
          width: 200px;
          height: 80px;
          border: 1px solid black;
          background-color: white;
          display: none;
        }
        .ReactorsTooltip.active {
          display: flex;
        }
        .ReactionsTooltip {
          height: 35px;
          width: 200px;
          position: absolute;
          bottom: -10px;
          background-color: white;
          border: 1px solid gray;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 5px;
          border-radius: 30px;
          display: none;
          span {
            cursor: pointer;
            font-size: 1.1rem;
            transition: 0.2s ease-in-out;
            &:hover {
              background-color: #d3d3d397;
              border-radius: 50%;
              font-size: 1.2rem;
            }
          }
        }
        .ReactionsTooltip.active {
          display: flex;
        }
      }
      .ChatMsgDate {
        font-size: 0.8rem;
        color: white;
        opacity: 0.4;
      }
    }
  }
  .MsgOptions {
    width: 50px;
    position: absolute;
    top: 5px;
    right: 5px;
    opacity: 0;

    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    padding: 3px;
    backdrop-filter: blur(10px);
    transition: 0.2s ease-in-out;

    .OptsContainer {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 5px;

      .OptionEL {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.6;
        transition: 0.2s all ease-in-out;
        &:hover {
          opacity: 1;
        }
      }
    }
  }
`;

const reactions = {
  LIKE: "👍",
  LOVE: "❤️",
  LAUGH: "😂",
  WOW: "😮",
  SAD: "😢",
  ANGRY: "😡",
  FUCK: "🖕",
};
interface MessageReaction {
  id: number;
  userId: string;
  messageId: number;
  emoji: keyof typeof reactions; // "LIKE" | "DISLIKE" | ...
  timestamp: string;
}
const ChatMessaegeEl = (props: { message: ChatMessage; isUser: boolean }) => {
  const [showReactionsTooltip, setshowReactionsTooltip] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Message
   */
  const handleEditMessage = async (newContent: string) => {
    try {
      props.message.content = newContent;
      await editMessage(props.message.id, newContent || props.message.content);
    } catch (err) {
      console.error("Failed to edit message:", err);
    }
  };
  const handleDeleteMessage = async () => {
    try {
      await deleteMessage(props.message.id);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  /**
   * Reactions
   */
  const handleRemoveReaction = async () => {
    try {
      const resp = await removeReaction(props.message.id);
    } catch (err) {
      console.error("Failed to remove reaction:", err);
    }
  };
  const handleAddReaction = async (reaction: string) => {
    try {
      const resp = await reactToMessage(props.message.id, reaction);
      setshowReactionsTooltip(false);
    } catch (err) {
      console.error("Failed to add reaction:", err);
    }
  };
  const countReactions = (reactionsArr: MessageReaction[]) => {
    return reactionsArr.reduce<Record<string, number>>((acc, reaction) => {
      if (!acc[reaction.emoji]) acc[reaction.emoji] = 0;
      acc[reaction.emoji]++;
      return acc;
    }, {});
  };
  const reactionCounts = countReactions(
    props.message.reactions as unknown as MessageReaction[]
  );

  return (
    <StyledChatMessage
      avatar={props.message.sender.avatar}
      isReplyTo={!!props.message.replyTo}
      isMe={props.isUser}
    >
      <div className="ChatMessageFrom" />

      <div className="ChatMsg">
        <span
          className="ChatMsgText"
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          onKeyDown={(e: any) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault(); // Prevent new line
              e.currentTarget.blur(); // Trigger blur event which saves
            }
          }}
          onBlur={(e: any) => {
            setIsEditing(false);
            handleEditMessage(e.currentTarget.textContent);
          }}
        >
          {props.message.content}
        </span>
        {props.message.type === "invite" && (
          <div className="GameInvite">
            <div className="Host">
              <div className="HostedBy" />
              <h1>
                {props.message.invitation?.type === "game"
                  ? "Game Invitation"
                  : props.message.invitation?.tournamentInfos?.tournamentName +
                      " 🏆" || "Tournament Invitation 🏆"}
              </h1>
              <span>By user12</span>
            </div>

            <div className="GameOptions">
              <div className="GameOption">
                <CoinIcon fill="gray" size={17} />
                <span>
                  {props.message.invitation?.type === "game"
                    ? props.message.invitation?.matchSettings?.settings
                        .requiredCurrency + " coins"
                    : props.message.invitation?.tournamentInfos
                        ?.requiredCurrency + " coins"}
                </span>
              </div>
              <div className="GameOption">
                <PingPongIcon fill="gray" size={18} stroke="red" />
                <span>{props.message.invitation?.type}</span>
              </div>

              <div className="GameOption">
                <InfosIcon fill="gray" size={17} />
                <span>waiting for players</span>
              </div>

              <div className="GameOption">
                <GroupIcon fill="gray" size={17} />
                <span>
                  {props.message.invitation?.type === "tournament"
                    ? props.message.invitation?.tournamentInfos
                        ?.currentParticipants +
                      " / " +
                      props.message.invitation?.tournamentInfos
                        ?.maxParticipants +
                      " participants"
                    : ""}
                </span>
              </div>
            </div>

            <div className="ActionButtons">
              <button className="DiclineButton">X</button>
              <button
                className="AcceptButton"
                disabled={props.message.invitation?.status !== "pending"}
              >
                {props.message.invitation?.status === "pending"
                  ? "Accept"
                  : props.message.invitation?.status === "cancelled"
                  ? "Cancelled"
                  : props.message.invitation?.status === "declined"
                  ? "Declined"
                  : props.message.invitation?.status === "expired"
                  ? "Expired"
                  : props.message.invitation?.status === "accepted"
                  ? "Accepted"
                  : ""}
              </button>
            </div>
          </div>
        )}
        <div
          className="ChatMsgBottom"
          onMouseLeave={() => setshowReactionsTooltip(false)}
        >
          <div className="Reactions">
            {Object.entries(reactionCounts).map(([reactionType, count]) => {
              if (count === 0) return null; // skip zero counts
              const key = reactionType as keyof typeof reactions; // assertion
              return (
                <div
                  key={reactionType}
                  className="Reaction"
                  // onClick={() => handleRemoveReaction()}
                >
                  <span>{reactions[key]}</span>
                  <span>{count}</span>
                </div>
              );
            })}

            <div
              className="AddReaction"
              onClick={() => setshowReactionsTooltip(!showReactionsTooltip)}
              onMouseEnter={() => setshowReactionsTooltip(true)}
            >
              <span>😀</span>
            </div>
            <div
              className={`ReactionsTooltip ${
                showReactionsTooltip ? "active" : ""
              }`}
            >
              {Object.entries(reactions).map(([name, emoji]) => (
                <span
                  key={emoji}
                  onClick={() => handleAddReaction(name)}
                  title={name}
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
          <span className="ChatMsgDate">
            {props.message.isEdited ? "Edited - " : ""}
            {timeAgo(props.message.timestamp)}
          </span>
        </div>
      </div>

      {props.isUser && (
        <div className="MsgOptions">
          <div className="OptsContainer">
            <div onClick={() => setIsEditing(true)} className="OptionEL">
              <EditIcon2 fill="rgba(255, 255, 255, 0.6)" size={15} />
            </div>
            <div className="OptionEL" onClick={() => handleDeleteMessage()}>
              <DeleteIcon fill="rgba(255, 255, 255, 0.6)" size={20} />
            </div>
          </div>
        </div>
      )}
    </StyledChatMessage>
  );
};
export default ChatMessaegeEl;

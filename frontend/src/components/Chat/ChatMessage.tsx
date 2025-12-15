import Zeroact, { useEffect, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { ChatMessage, ChatReaction, ChatReactionType } from "@/types/chat";
import {
  BackIcon,
  CoinIcon,
  DeleteIcon,
  EditIcon2,
  GroupIcon,
  InfosIcon,
  PingPongIcon,
  SeenIcon,
} from "../Svg/Svg";
import {
  deleteMessage,
  editMessage,
  reactToMessage,
  removeReaction,
} from "@/api/chat";
import { timeAgo, timeUntil } from "@/utils/time";
import { ConversationWithView } from "./Chat";
import { Tournament } from "@/types/game/tournament";
import { getTournament } from "@/api/tournament";
import { AcceptInvite, cancelInvite, DeclineInvite, getInvitationByCode } from "@/api/gameInvitation";
import { useAppContext } from "@/contexts/AppProviders";
import { useNavigate } from "@/contexts/RouterProvider";
import { GameInvitation, GameMode } from "@/types/game/game";

const StyledChatMessage = styled("div")`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: ${(props: any) => (props.isMe ? "flex-end" : "flex-start")};

  &:hover .MsgContent .ChatMsg .MsgOptions {
    opacity: 1;
  }
  &:hover .MsgContent .ChatMsg .ChatMsgBottom .Reactions .AddReaction {
    opacity: 1;
  }
  .ReplyedToIndicator {
    cursor: pointer;
    width: 100%;
    width: 70%;
    background-color: var(--bg_color_super_light);
    border: 1px solid rgba(256, 256, 256, 0.05);
    border-radius: 5px;
    margin-left: ${(props: any) => (props.isMe ? "0px" : "50px")};
    margin-right: ${(props: any) => (props.isMe ? "10px" : "0px")};
    border-left: none;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    align-items: center;
    padding: 3px 0px;
    .ReplyedToHeader {
      width: 100%;
      height: 20px;
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 0px 5px;
      margin-bottom: 2px;
    }
    .ReplyedToLine {
      width: 100%;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      font-family: var(--span_font);
      padding-left: 26px;
      span {
        opacity: 0.3;
      }
    }
    span {
      font-size: 0.9rem;
      color: white;
      opacity: 0.6;
      font-family: var(--span_font);
    }
  }
  .MsgContent {
    width: 100%;
    display: flex;
    flex-direction: ${(props: any) => (props.isMe ? "row-reverse" : "row")};
    gap: 10px;
    position: relative;
    transition: 0.2s ease-in-out;
    .ChatMessageFrom {
      width: 35px;
      height: 35px;
      border-radius: 5px;
      background-image: url("${(props: { avatar: string }) => props.avatar}");
      background-color: rgba(255,255,255, 0.03);
      border: 1px solid rgba(255,255,255, 0.08);
      cursor: pointer;
      background-size: cover;
      background-position: center;
      display: ${(props: any) => props.isMe && "none"};
    }
    .ChatMsg {
      width: ${(props: any) => (props.isMe ? "90%" : "80%")};
      background-color: ${(props: any) =>
    props.isMe ? "var(--main_color)" : "var(--bg_color_super_light)"};
      border: 1px solid rgba(256, 256, 256, 0.05);
      padding: 5px 5px 0px 5px;
      border-radius: ${(props: any) =>
    props.isMe ? "10px 10px 10px 10px" : "0px 10px 10px 10px"};
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: relative;
      .GameInvite {
        cursor: pointer;
        width: 100%;
        height: 250px;
        background-color: #f7f1f1;
        border: 1px solid rgba(255,255,255, 0.5);
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
            font-family: var(--main_font);
            opacity: 0.7;
          }
          span {
            font-size: 0.9rem;
            font-family: var(--span_font);
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
              rgba(180, 58, 133, 0.2) 0%,
              rgba(180, 58, 143, 0.1) 50%,
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
              font-family: var(--span_font);
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
                color: rgba(255,255,255, 0.6);
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
          .CancelButton {
            width: 100%;
            border-radius: 4px;
            background-color: transparent;
            color: var(--light_red_hover);
            font-weight: bold;
            border: 1px solid var(--light_red_hover);
            &:hover {
              background-color: var(--light_red_hover);
                color: rgba(255,255,255, 0.6);
            }
          }
          button {
            height: 30px;
            border: 1px solid #d3d3d3ab;
            font-family: var(--main_font);
            border-radius: 5px;
            cursor: pointer;
            transition: 0.2s ease-in-out;
            &:disabled {
              cursor: not-allowed;
              background-color: transparent;
              border: 1px solid rgba(0, 0, 0, 0.1);
              color : rgba(0, 0, 0, 0.3);
            }
          }
        }
      }
      .ChatMsgText {
        font-size: 1rem;
        font-family: var(--span_font);
        font-weight:500;
        color: rgba(255,255,255, 0.7);
        white-space: pre-wrap;
        word-wrap: break-word;
        min-height: 20px;
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
            border: 1px solid rgba(256, 256, 256, 0.1);
            justify-content: center;
            align-items: center;
            border-radius: 10px;
            padding: 1px 5px;
            gap: 2px;
            cursor: pointer;
            span {
              color: rgba(255, 255, 255, 0.9);
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
          font-family: var(--span_font);
          opacity: 0.4;
        }
      }
      .MsgOptions {
        position: absolute;
        top: 0px;
        right: 0px;
        opacity: 0;

        /* background: rgba(255, 255, 255, 0.1); */
        /* border: 1px solid rgba(255, 255, 255, 0.2); */
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
    }
    .MessageStatusIndicator {
      flex: 1;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-right: -10px;
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
interface msgInvitationData {
  coins: number;
  mode: "1vs1" | "tournament";

  OneVsOneInvitationStatus?: string;
  OneVsOneInvitationExpiration?: string;

  tournamentName?: string;
  tournamentStatus?: string;
  tournamentParticipants?: number;
  tournamentTotalParticipants?: number;
  tournamentOrganizer?: string;
}

const ChatMessaegeEl = (props: {
  message: ChatMessage;
  conversationId: string;
  setIsReplyingTo: (msg: ChatMessage) => void;
  setConversations: (
    value:
      | ConversationWithView[]
      | ((prev: ConversationWithView[]) => ConversationWithView[])
  ) => void;
  isUser: boolean;
  userId: string;
  key: number;
  id: string;
}) => {
  const [localMessage, setLocalMessage] = useState(props.message);
  const [showReactionsTooltip, setshowReactionsTooltip] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [onevsoneInvitation, setOnevsoneInvitation] =
    useState<GameInvitation | null>(null);
  const [msgInviteData, setmsgInviteData] = useState<msgInvitationData | null>(
    null
  );
  /**
   * Context
   */
  const { inviteModal, toasts, match } = useAppContext();
  const navigate = useNavigate();

  /**
   * Message
   */
  const handleEditMessage = async (newContent: string) => {
    try {
      setLocalMessage({
        ...localMessage,
        content: newContent,
        isEdited: true,
      });
      await editMessage(props.message.id, newContent || props.message.content);
    } catch (err) {
      console.error("Failed to edit message:", err);
    }
  };
  const handleDeleteMessage = async () => {
    try {
      const resp = await deleteMessage(props.message.id);
      if (resp.success) {
        props.setConversations((prevConversations) =>
          prevConversations.map((conv) => {
            if (conv.id === props.conversationId) {
              return {
                ...conv,
                messages: conv.messages.filter(
                  (msg) => msg.id !== props.message.id
                ),
              };
            }
            return conv;
          })
        );
      } else {
        console.error("Failed to delete message:", resp.message);
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };
  const onInviteClick = () => {
    if (localMessage.type === "INVITE_TOURNAMENT") {
    } else if (localMessage.type === "INVITE_MATCH") {
      inviteModal.setIsInviteModalOpen(true);
      inviteModal.setSelectedInvitation(onevsoneInvitation);
    }
  };

  /**
   * Reactions
   */
  const handleRemoveReaction = async (reactionName: string) => {
    try {
      if (!reactionName) return;

      const isUserReaction = localMessage.reactions.some(
        (r) =>
          r.emoji === reactionName && String(r.userId) === String(props.userId)
      );

      if (!isUserReaction) return;

      await removeReaction(props.message.id);

      setLocalMessage({
        ...localMessage,
        reactions: localMessage.reactions.filter(
          (r) =>
            !(
              r.emoji === reactionName &&
              String(r.userId) === String(props.userId)
            )
        ),
      });
    } catch (err) {
      console.error("Failed to remove reaction:", err);
    }
  };

  const handleAddReaction = async (reaction: string) => {
    try {
      const resp = await reactToMessage(props.message.id, reaction);
      console.log("Reaction added:", resp);
      setLocalMessage(resp.data as unknown as ChatMessage);
      // update local state

      setshowReactionsTooltip(false);
    } catch (err) {
      console.error("Failed to add reaction:", err);
    }
  };
  const countReactions = (reactionsArr: ChatReaction[]) => {
    return reactionsArr.reduce<Record<string, number>>((acc, reaction) => {
      if (!acc[reaction.emoji]) acc[reaction.emoji] = 0;
      acc[reaction.emoji]++;
      return acc;
    }, {});
  };
  const reactionCounts = countReactions(
    localMessage.reactions as unknown as ChatReaction[]
  );

  /**
   * ONE_VS_ONE INVITATION
   */
  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const resp = await cancelInvite(invitationId);

      if (resp) {
        toasts.addToastToQueue({
          type: "success",
          message: "Invitation cancelled successfully.",
        });
        inviteModal.setSelectedInvitation(null)
      }
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message: err.message || "Failed to cancel invitation.",
      });
    }
  };
  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const resp = await DeclineInvite(invitationId);

      if (resp) {
        toasts.addToastToQueue({
          type: "success",
          message: "Invitation declined successfully.",
        });
        inviteModal.setSelectedInvitation(null)
      }
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message: err.message || "Failed to decline invitation.",
      });
    }
  };
  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const resp = await AcceptInvite(invitationId);

      if (resp) {
        toasts.addToastToQueue({
          type: "success",
          message: resp.message || "Invitation accepted successfully.==",
        });
        inviteModal.setSelectedInvitation(null);
        match.setCurrentMatch(resp.data.match);
        inviteModal.setSelectedMode(resp.data.match.mode as GameMode);
      }
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message: err.message || "Failed to accept invitation.",
      });
    }
  };

  function scrollToMessage(messageId?: number) {
    if (!messageId) return;

    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      // Optional: flash/highlight the message
      el.classList.add("highlight");
      setTimeout(() => el.classList.remove("highlight"), 1500);
    }
  }

  useEffect(() => {
    setLocalMessage(props.message);
    const fetchTournamentData = async () => {
      try {
        const resp = await getTournament(props.message.tournamentId!);
        if (resp.success && resp.data) {
          setmsgInviteData({
            coins: resp.data.participationFee || 0,
            mode: "tournament",
            tournamentName: resp.data.name,
            tournamentStatus: resp.data.status,
            tournamentParticipants: resp.data.participants.length || 0,
            tournamentTotalParticipants: resp.data.maxPlayers,
            tournamentOrganizer: resp.data.organizerId,
          });
        } else {
          console.error("Failed to fetch tournament data:", resp.message);
        }
      } catch (err) {
        console.error("Error fetching tournament data:", err);
      }
    };
    const fetchInvitationData = async () => {
      try {
        const resp = await getInvitationByCode(props.message.invitationCode!);
        if (resp) {
          console.log("----resp:", resp)
          setOnevsoneInvitation(resp);
          setmsgInviteData({
            coins: resp.requiredCurrency,
            mode: "1vs1",
            OneVsOneInvitationStatus: resp.status,
            OneVsOneInvitationExpiration: new Date(
              resp.expiresAt
            ).toISOString(),
          });
        }
      } catch (err) {
        console.error("Error fetching invitation data:", err);
      }
    };

    if (props.message.type === "INVITE_TOURNAMENT") fetchTournamentData();
    else if (props.message.type === "INVITE_MATCH") fetchInvitationData();
  }, [props.message]);

  return (
    <StyledChatMessage
      avatar={localMessage.sender.avatar}
      isReplyTo={!!localMessage.replyTo}
      isMe={props.isUser}
      key={props.id}
      id={`message-${localMessage.id}`}
    >
      {localMessage.replyTo && (
        <div
          className="ReplyedToIndicator"
          onClick={() => {
            scrollToMessage(localMessage.replyTo!.id);
          }}
        >
          <div className="ReplyedToHeader">
            <BackIcon fill="rgba(255, 255, 255, 0.6)" size={15} />
            <span>Replied to:</span>
          </div>
          <div className="ReplyedToLine">
            <span>
              {localMessage.replyTo.sender.username}:
              {(localMessage.replyTo.content.length > 30
                ? localMessage.replyTo.content.slice(0, 30) + "..."
                : localMessage.replyTo.content) || "<deleted message>"}
            </span>
          </div>
        </div>
      )}
      <div className="MsgContent">
        <div className="ChatMessageFrom" onClick={() => navigate(`/user/${props.message.sender.username}`)} />
        <div className="ChatMsg">
          <div className="MsgOptions">
            <div className="OptsContainer">
              <div
                className="OptionEL"
                onClick={() => props.setIsReplyingTo(localMessage)}
              >
                <BackIcon fill="rgba(255, 255, 255, 0.6)" size={23} />
              </div>
              {props.isUser && (
                <div onClick={() => setIsEditing(true)} className="OptionEL">
                  <EditIcon2 fill="rgba(255, 255, 255, 0.6)" size={15} />
                </div>
              )}
              {props.isUser && (
                <div className="OptionEL" onClick={() => handleDeleteMessage()}>
                  <DeleteIcon fill="rgba(255, 255, 255, 0.6)" size={18} />
                </div>
              )}
            </div>
          </div>
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
            {localMessage.content}
          </span>
          {(localMessage.type === "INVITE_MATCH" ||
            localMessage.type === "INVITE_TOURNAMENT") &&
            !localMessage.isDeleted && (
              <div className="GameInvite" onClick={onInviteClick}>
                <div className="Host">
                  <div className="HostedBy" />
                  <h1>
                    {localMessage.type === "INVITE_MATCH"
                      ? "Game Invitation"
                      : "🏆 Tournament Invitation 🏆"}
                  </h1>
                  <span>{localMessage.sender.username}</span>
                </div>

                <div className="GameOptions">
                  <div className="GameOption">
                    <CoinIcon fill="gray" size={17} />
                    <span>{msgInviteData?.coins} coins</span>
                  </div>
                  <div className="GameOption">
                    <PingPongIcon fill="gray" size={18} stroke="red" />
                    <span>
                      {msgInviteData?.mode === "1vs1"
                        ? "1 vs 1 Match"
                        : "Tournament"}
                    </span>
                  </div>

                  {localMessage.type === "INVITE_TOURNAMENT" ? (
                    <div className="GameOption">
                      <GroupIcon fill="gray" size={17} />
                      <span>
                        {msgInviteData?.tournamentParticipants}/
                        {msgInviteData?.tournamentTotalParticipants} players
                      </span>
                    </div>
                  ) : (
                    <div className="GameOption">
                      <InfosIcon fill="gray" size={17} />
                      <span>
                        Expires in:
                        {timeUntil(
                          msgInviteData?.OneVsOneInvitationExpiration!
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {
                  !props.isUser ? (
                    <div className="ActionButtons">
                      <button className="DiclineButton" disabled={
                        msgInviteData?.tournamentStatus === "ONGOING" ||
                        msgInviteData?.OneVsOneInvitationStatus !== "PENDING"
                      } onClick={() => handleDeclineInvitation(onevsoneInvitation?.id!)}>X</button>
                      <button
                        className="AcceptButton"
                        disabled={
                          msgInviteData?.tournamentStatus === "ONGOING" ||
                          msgInviteData?.OneVsOneInvitationStatus !== "PENDING"
                        }
                        onClick={() => handleAcceptInvitation(onevsoneInvitation?.id!)}
                      >
                        Accept
                      </button>
                    </div>) : (<div className="ActionButtons">
                      <button className="CancelButton" disabled={
                        msgInviteData?.tournamentStatus === "ONGOING" ||
                        msgInviteData?.OneVsOneInvitationStatus !== "PENDING"
                      } onClick={() => handleCancelInvitation(onevsoneInvitation?.id!)}>Cancel</button>
                    </div>)
                }

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
                    onClick={() => handleRemoveReaction(key)}
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
                className={`ReactionsTooltip ${showReactionsTooltip ? "active" : ""
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
              {localMessage.isEdited ? "Edited - " : ""}
              {timeAgo(localMessage.timestamp)}
            </span>
          </div>
        </div>
        {props.isUser && (
          <div className="MessageStatusIndicator">
            <SeenIcon
              fill={
                localMessage.status === "READ"
                  ? "var(--green_color)"
                  : "rgba(255, 255, 255, 0.6)"
              }
              size={20}
            />
          </div>
        )}
      </div>
    </StyledChatMessage>
  );
};
export default ChatMessaegeEl;

import { db } from "@/db";
import Zeroact, { useEffect, useRef } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { NotificationEl } from "@/types/notification";
import {
  CheckIcon,
  CheckIcon2,
  CloseIcon,
  GiftIcon,
  GoalIcon,
  LiveIcon,
  PersonIcon,
  SeenIcon,
  TrophyIcon,
  WarningIcon,
} from "@/components/Svg/Svg";
import { acceptFriendRequest, rejectFriendRequest } from "@/api/user";
import { useAppContext } from "@/contexts/AppProviders";
import { markNotificationAsRead } from "@/api/notification";

const StyledModal = styled("div")`
  width: 350px;
  height: 500px;
  border-radius: 5px;
  position: fixed;
  top: 55px;
  right: 5px;
  overflow-y: scroll;
  background-color: var(--bg_color);
  box-shadow: rgba(0, 0, 0, 0.2) 0px 7px 29px 0px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding-left: 3px;
  padding-top: 3px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  .NotoficationHeader {
    width: 100%;
    min-height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0px 2px;
    h1 {
      font-size: 1.2rem;
      color: white;
      font-family: var(--main_font);
      font-weight: 600;
    }
    .NotificationHeaderActions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      cursor: pointer;
      span {
        font-size: 0.9rem;
        color: #ffffffaa;
        font-family: var(--main_font);
      }
      &:hover {
        span {
          color: #ffffffdd;
        }
        svg {
          fill: #ffffffdd;
        }
      }
    }
  }
  .NotificationFilterBar {
    width: 100%;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 5px;
    margin-bottom: 5px;
    .FilterOption {
      padding: 5px 10px;
      border-radius: 5px;
      background-color: transparent;
      border: 1px solid rgba(255, 255, 255, 0.04);
      cursor: pointer;
      transition: 0.1s ease-in-out;
      span {
        font-size: 0.9rem;
        color: #ffffffcc;
        font-family: var(--main_font);
      }
      &:hover {
        background-color: var(--bg_color_super_light);
        span {
          color: #ffffffee;
        }
      }
      &.ActiveFilter {
        background-color: var(--bg_color_super_light);
        span {
          color: white;
          font-weight: 400;
        }
      }
    }
  }
  .NotsEnd {
    width: 100%;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e7e7e7;
    font-size: 0.8rem;
    font-family: var(--main_font);
    opacity: 0.5;
  }
`;
interface NotificationProps {
  onClose: () => void;
  notifications: NotificationEl[];
  refetchNotifs: () => void;
}
const Notification = (props: NotificationProps) => {
  const ModalRef = useRef<HTMLDivElement>(null);

  console.log("mouuuuuuuuuuuunted notifications");

  const [currentFilter, setCurrentFilter] = Zeroact.useState<
    "All" | "freindRequests"
  >("All");

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

  return (
    <StyledModal className="scroll-y" ref={ModalRef}>
      <div className="NotoficationHeader">
        <h1>Notifications</h1>
        <div className="NotificationHeaderActions">
          <SeenIcon size={16} fill="rgba(255,255,255,0.7)" />
          <span>Mark all as read</span>
        </div>
      </div>
      <div className="NotificationFilterBar">
        <div
          className={`FilterOption ${
            currentFilter === "All" ? "ActiveFilter" : ""
          }`}
          onClick={() => setCurrentFilter("All")}
        >
          <span>All</span>
        </div>
        <div
          className={`FilterOption ${
            currentFilter === "freindRequests" ? "ActiveFilter" : ""
          }`}
          onClick={() => setCurrentFilter("freindRequests")}
        >
          <span>Friend Requests</span>
        </div>
      </div>
      {props.notifications.length > 0 ? (
        props.notifications.map((Notification: NotificationEl) => {
          return (
            <NotificationItem
              element={Notification}
              refetchNotifs={props.refetchNotifs}
            />
          );
        })
      ) : (
        <span>No notifications</span>
      )}
      <span className="NotsEnd">no more notifications</span>
    </StyledModal>
  );
};

interface NotificationItemProps {
  element: NotificationEl;
  refetchNotifs: () => void;
}
const NotificationItem = (props: NotificationItemProps) => {
  const { toasts } = useAppContext();
  const handleAcceptFriendRequest = async () => {
    try {
      const resp = await acceptFriendRequest(Number(props.element.by.userId));
      if (resp.success) {
        toasts.addToastToQueue({
          type: "success",
          message: "Friend request accepted.",
          duration: 3000,
        });
        props.refetchNotifs();
      } else
        toasts.addToastToQueue({
          type: "error",
          message: `Failed to accept friend request: ${resp.message}`,
          duration: 3000,
        });
    } catch (error) {
      toasts.addToastToQueue({
        type: "error",
        message: `Failed to accept friend request.`,
        duration: 3000,
      });
    }
  };
  const handleDeclineFriendRequest = async () => {
    try {
      const resp = await rejectFriendRequest(Number(props.element.by.userId));
      if (resp.success) {
        toasts.addToastToQueue({
          type: "success",
          message: "Friend request declined.",
          duration: 3000,
        });
        props.refetchNotifs();
      } else
        toasts.addToastToQueue({
          type: "error",
          message: `Failed to decline friend request: ${resp.message}`,
          duration: 3000,
        });
    } catch (error) {
      toasts.addToastToQueue({
        type: "error",
        message: `Failed to decline friend request.`,
        duration: 3000,
      });
    }
  };
  const markasRead = async () => {
    try {
      const resp = await markNotificationAsRead(props.element.id);
      if (resp.success) {
        props.refetchNotifs();
      } else
        toasts.addToastToQueue({
          type: "error",
          message: `Failed to mark notification as read: ${resp.message}`,
          duration: 3000,
        });
    } catch (error) {
      toasts.addToastToQueue({
        type: "error",
        message: `Failed to mark notification as read.`,
        duration: 3000,
      });
    }
  };
  return (
    <StyledNotificationItem
      avatar={props.element.by?.avatar || ""}
      isRead={props.element.isRead}
      onClick={markasRead}
    >
      <div className="NotificationBy">
        <div className="NotificationType">
          {props.element.type === "COIN_GIFT_RECEIVED" ? (
            <GiftIcon
              className="NotifTypeIcon"
              fill="rgba(255,255,255,0.7)"
              size={18}
            />
          ) : props.element.type === "SPECTATE_INVITE" ? (
            <LiveIcon
              className="NotifTypeIcon"
              fill="rgba(255,255,255,0.7)"
              size={18}
            />
          ) : props.element.type === "FRIEND_REQUEST" ? (
            <PersonIcon
              className="NotifTypeIcon"
              fill="rgba(255,255,255,0.7)"
              size={18}
            />
          ) : props.element.type === "FRIEND_REQUEST_ACCEPTED" ? (
            <PersonIcon
              className="NotifTypeIcon"
              fill="rgba(255,255,255,0.7)"
              size={18}
            />
          ) : props.element.type === "WARNING" ? (
            <WarningIcon
              className="NotifTypeIcon"
              fill="rgba(255,255,255,0.7)"
              size={18}
            />
          ) : props.element.type === "PREDICTION_WON" ? (
            <GoalIcon
              className="NotifTypeIcon"
              fill="rgba(255,255,255,0.7)"
              size={18}
            />
          ) : (
            <TrophyIcon
              className="NotifTypeIcon"
              fill="rgba(255,255,255,0.7)"
              size={18}
            />
          )}
        </div>
      </div>
      <div className="NotificationContent">
        <h1>
          {props.element.by?.username
            ? `${props.element.by.username} `
            : "unknown"}
          <span>
            {props.element.type === "INFO"
              ? props.element.payload?.info
              : props.element.type === "WARNING"
              ? props.element.payload?.warning
              : props.element.type === "FRIEND_REQUEST"
              ? props.element.payload?.friendRequest?.message ||
                "has sent you a friend request"
              : props.element.type === "FRIEND_REQUEST_ACCEPTED"
              ? "has accepted your friend request"
              : props.element.type === "GAME_INVITE"
              ? `invited you to play a game`
              : props.element.type === "TOURNAMENT_INVITE"
              ? `has invited you to join the tournament ${props.element.payload?.tournamentName}`
              : props.element.type === "TOURNAMENT_CANCELLED"
              ? `The tournament ${props.element.payload?.tournamentName} has been cancelled`
              : props.element.type === "COIN_GIFT_RECEIVED"
              ? `has sent you a coin gift of ${props.element.payload?.coinAmount} coins`
              : props.element.type === "ACHIEVEMENT_UNLOCKED"
              ? `Achievement Unlocked: ${props.element.payload?.achievementName}`
              : props.element.type === "SPECTATE_INVITE"
              ? `has invited you to spectate the game with ID ${props.element.payload?.spectateGameId}`
              : props.element.type === "PREDICTION_WON"
              ? `You won the prediction! Winnings: ${props.element.payload?.winningsAmount} coins`
              : "Notification"}{" "}
          </span>
        </h1>
        {props.element.type === "FRIEND_REQUEST" ? (
          <div className="ActionsBtns">
            <button
              className="ActionBtn AcceptBtn"
              disabled={
                props.element.payload?.friendRequest?.status !== "pending"
              }
              onClick={handleAcceptFriendRequest}
            >
              <CheckIcon2
                size={16}
                fill="white"
                className="ActionBtnIcon AcceptIcon"
              />
              {props.element.payload?.friendRequest?.status === "accepted"
                ? "Accepted"
                : "Accept"}
            </button>
            <button
              className="ActionBtn DeclineBtn"
              disabled={
                props.element.payload?.friendRequest?.status !== "pending"
              }
              onClick={handleDeclineFriendRequest}
            >
              <CloseIcon
                size={16}
                fill="white"
                className="ActionBtnIcon DeclineIcon"
              />
              {props.element.payload?.friendRequest?.status === "declined"
                ? "Declined"
                : "Decline"}
            </button>
          </div>
        ) : props.element.type === "TOURNAMENT_INVITE" ? (
          <div className="ActionsBtns">
            <button className="ActionBtn AcceptBtn">Join</button>
            <button className="ActionBtn DeclineBtn">
              <CloseIcon
                size={16}
                fill="white"
                className="ActionBtnIcon DeclineIcon"
              />
              Decline
            </button>
          </div>
        ) : props.element.type === "SPECTATE_INVITE" ? (
          <div className="ActionsBtns">
            <button className="ActionBtn AcceptBtn">Spectate</button>
            <button className="ActionBtn DeclineBtn">
              <CloseIcon
                size={16}
                fill="white"
                className="ActionBtnIcon DeclineIcon"
              />
              Decline
            </button>
          </div>
        ) : (
          ""
        )}
        <span className="NotificationTime">7d</span>
      </div>
    </StyledNotificationItem>
  );
};
const StyledNotificationItem = styled("div")`
  z-index: 997;
  width: 100%;
  padding: 3px;
  display: flex;
  background-color: ${(props: any) =>
    props.isRead ? "var(--bg_color)" : "var(--bg_color_light)"};
  cursor: pointer;
  align-items: flex-start;
  justify-content: space-between;
  transition: 0.1s ease-in-out;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  gap: 5px;
  height: auto !important;
  .NotificationBy {
    width: 40px;
    height: 40px;
    border-radius: 5px;
    background-image: url(${(props: { avatar: string }) => props.avatar});
    background-size: cover;
    background-position: center;
    position: relative;
    .NotificationType {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid lightgray;
      position: absolute;
      bottom: -2px;
      right: -2px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(27, 26, 31, 0.1);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(151, 147, 165, 0.1);

      .NotifTypeIcon {
        transition: 0.1s ease-in-out;
      }
      .NotifTypeIcon:hover {
        fill: rgba(255, 255, 255, 1);
      }
    }
  }
  .NotificationContent {
    flex: 1;
    font-family: var(--main_font);
    display: flex;
    flex-direction: column;
    gap: 3px;
    .NotificationTime {
      color: gray;
      font-size: 0.8rem;
      text-align: right;
    }
    h1 {
      font-size: 0.9rem;
      color: #ffffffcc;
      font-weight: 600;
      span {
        font-size: 0.9rem;
        color: #ffffff89;
        font-weight: 100;
      }
    }
    .ActionsBtns {
      min-height: 40px !important;
      width: 100%;
      display: flex;
      gap: 3px;

      .ActionBtn {
        padding: 3px 10px;
        border-radius: 5px;
        border: none;
        cursor: pointer;
        font-family: var(--main_font);
        font-size: 0.9rem;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        transition: 0.2s ease-in-out;
        background-color: transparent;
        border: 1px solid rgba(255, 255, 255, 0.1);
        &:disabled {
          cursor: not-allowed;
          opacity: 0.3;
        }
      }
      .ActionBtnIcon {
        transition: 0.2s ease-in-out;
      }
      .AcceptBtn {
        &:hover {
          color: var(--green_color);
          background-color: var(--light_green);
          border: 1px solid var(--green_color);
          .AcceptIcon {
            stroke: var(--green_color);
            fill: var(--green_color);
          }
        }
      }
      .DeclineBtn {
        &:hover {
          color: var(--red_color);
          background-color: var(--light_red);
          border: 1px solid var(--red_color);
          .DeclineIcon {
            stroke: var(--red_color);
            fill: var(--red_color);
          }
        }
      }
    }
  }
  &:hover {
    background-color: var(--bg_color_super_light);
    .NotificationBy .NotificationType .NotifTypeIcon {
      fill: rgba(255, 255, 255, 1);
    }
  }
`;

export default Notification;

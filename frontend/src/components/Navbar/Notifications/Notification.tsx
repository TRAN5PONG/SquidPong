import { db } from "@/db";
import Zeroact, { useEffect, useRef } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { NotificationEl } from "@/types/notification";
import {
  GiftIcon,
  GoalIcon,
  LiveIcon,
  PersonIcon,
  TrophyIcon,
  WarningIcon,
} from "@/components/Svg/Svg";

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
}
const Notification = (props: NotificationProps) => {
  const ModalRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    console.log("Notification component mounted");
    return () => {
      console.log("Notification component unmounted");
    };
  }, []);
  return (
    <StyledModal className="scroll-y" ref={ModalRef}>
      {db.fakeNotificationsForEachType.map((Notification: NotificationEl) => {
        return <NotificationItem {...Notification} />;
      })}
      <span className="NotsEnd">no more notifications</span>
    </StyledModal>
  );
};

const NotificationItem = (props: NotificationEl) => {
  return (
    <StyledNotificationItem
      avatar={props.by?.avatar || ""}
      isRead={props.isRead}
    >
      <div className="NotificationBy">
        <div className="NotificationType">
          {props.type === "CoinGiftReceived" ? (
            <GiftIcon
              className="NotifTypeIcon"
              fill="rgba(255,255,255,0.7)"
              size={18}
            />
          ) : props.type === "spectateInvite" ? (
            <LiveIcon
              className="NotifTypeIcon"
              fill="rgba(255,255,255,0.7)"
              size={18}
            />
          ) : props.type === "friendRequest" ? (
            <PersonIcon
              className="NotifTypeIcon"
              fill="rgba(255,255,255,0.7)"
              size={18}
            />
          ) : props.type === "friendRequestAccepted" ? (
            <PersonIcon
              className="NotifTypeIcon"
              fill="rgba(255,255,255,0.7)"
              size={18}
            />
          ) : props.type === "warning" ? (
            <WarningIcon
              className="NotifTypeIcon"
              fill="rgba(255,255,255,0.7)"
              size={18}
            />
          ) : props.type === "predictionWon" ? (
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
          {props.by?.username ? `${props.by.username} ` : ""}
          <span>
            {props.type === "info"
              ? props.payload?.info
              : props.type === "warning"
              ? props.payload?.warning
              : props.type === "friendRequest"
              ? props.payload?.friendRequest?.message ||
                "has sent you a friend request"
              : props.type === "friendRequestAccepted"
              ? "has accepted your friend request"
              : props.type === "gameInvite"
              ? `invited you to play a game`
              : props.type === "tournamentInvite"
              ? `has invited you to join the tournament ${props.payload?.tournamentName}`
              : props.type === "tournamentCancelled"
              ? `The tournament ${props.payload?.tournamentName} has been cancelled`
              : props.type === "CoinGiftReceived"
              ? `has sent you a coin gift of ${props.payload?.coinAmount} coins`
              : props.type === "AchievementUnlocked"
              ? `Achievement Unlocked: ${props.payload?.achievementName}`
              : props.type === "spectateInvite"
              ? `has invited you to spectate the game with ID ${props.payload?.spectateGameId}`
              : props.type === "predictionWon"
              ? `You won the prediction! Winnings: ${props.payload?.winningsAmount} coins`
              : "Notification"}{" "}
          </span>
        </h1>
        <span className="NotificationTime">7d</span>
      </div>
    </StyledNotificationItem>
  );
};
const StyledNotificationItem = styled("div")`
  width: 100%;
  z-index: 997;
  padding: 3px;
  display: flex;
  background-color: ${(props: any) =>
    props.isRead ? "var(--bg_color)" : "var(--bg_color_light)"};
  cursor: pointer;
  align-items: center;
  justify-content: space-between;
  transition: 0.1s ease-in-out;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  gap: 5px;
  min-height: 50px !important;
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
    height: 100%;
    font-family: var(--main_font);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 3px;
    padding: 5px 0px;
    .NotificationTime {
      color: gray;
      font-size: 0.8rem;
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
  }
  &:hover {
    background-color: var(--bg_color_super_light);
    .NotificationBy .NotificationType .NotifTypeIcon {
      fill: rgba(255, 255, 255, 1);
    }
  }
`;

export default Notification;

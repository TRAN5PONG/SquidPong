import Zeroact from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { GameInvitation as GameInvitationType } from "@/types/game/game";
import {
  BackIcon,
  CheckIcon,
  CloseIcon,
  CoinIcon,
  DateIcon,
  InviteIcon,
  PauseIcon,
  PersonIcon,
  PowerUpsIcon,
  ScoreIcon,
} from "../Svg/Svg";
import { timeUntil } from "@/utils/time";
import {
  AcceptInvite,
  cancelInvite,
  DeclineInvite,
} from "@/api/gameInvitation";
import { useAppContext } from "@/contexts/AppProviders";

const StyledGameInvitationCard = styled("div")`
  width: 100%;
  min-height: 70px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: ${(props: { isFromUser: boolean }) =>
    props.isFromUser ? "var(--bg_color_light)" : "var(--bg_color)"};
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0px 5px;
  gap: 5px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  &:hover {
    background-color: var(--bg_color_dark);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  }
  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    pointer-events: none;
    z-index: 1;
    background: ${(props: { isExpired: boolean }) =>
      props.isExpired
        ? "linear-gradient(-40deg, rgba(255,0,0,0.1) 0%, rgba(255,0,0,0) 50%)"
        : "none"};
  }

  .InviteAvatar {
    min-width: 60px;
    min-height: 60px;
    background-color: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    position: relative;
    .BackIcon {
      position: absolute;
      right: 5px;
      bottom: 8px;
      background-color: rgba(255, 255, 255, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(5px);
      border-radius: 5px;
      fill: ${(props: { isFromUser: boolean }) =>
        props.isFromUser
          ? "var(--light_green_hover)"
          : "rgba(255,255,255, 0.6)"};
      transform: scaleX(
        ${(props: { isFromUser: boolean }) => (props.isFromUser ? -1 : 1)}
      );
    }
    svg {
      margin-left: -1px;
    }
  }

  .MainInviteCardContainer {
    flex: 1;
    z-index: 2;
    .TopContainer {
      width: 100%;
      max-height: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      h1 {
        font-family: var(--span_font);
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
      }
      span {
        font-family: var(--main_font);
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.8rem;
      }
      .ExpiredAt {
        display: flex;
        align-items: center;
        gap: 3px;
        color: rgba(255, 255, 255, 0.3);
        font-family: var(--span_font);
        font-size: 0.75rem;
      }
    }
    .BottomContainer {
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      .GameSettings {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        span {
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border-radius: 5px;
          color: rgba(255, 255, 255, 0.5);
          font-family: var(--span_font);
          font-size: 0.9rem;
          padding: 0 5px;
          &.PowerUpsIcon {
            width: 40px;
          }
        }
      }
      .RightActions {
        .RecievedInviteActions {
          height: 100%;
          padding: 10px 0px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          button {
            background-color: transparent;
            height: 30px;
            width: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9px;
            cursor: pointer;
            transition: background-color 0.2s ease-in-out;
            &:nth-child(1) {
              border: 1px solid var(--red_color);
              &:hover {
                background-color: rgba(255, 0, 0, 0.1);
              }
            }
            &:nth-child(2) {
              border: 1px solid var(--green_color);
              &:hover {
                background-color: rgba(0, 255, 0, 0.1);
              }
            }
            &:disabled {
              cursor: not-allowed;
              opacity: 0.5;
              background-color: transparent !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
          }
        }
        .SentInviteAction {
          background-color: transparent;
          border: 1px solid var(--red_color);
          color: var(--red_color);
          height: 30px;
          padding: 0px 10px;
          border-radius: 9px;
          cursor: pointer;
          font-family: var(--main_font);
          font-size: 0.9rem;
          transition: background-color 0.2s ease-in-out;
          &:hover {
            background-color: rgba(255, 0, 0, 0.1);
          }
          &:disabled {
            cursor: not-allowed;
            opacity: 0.5;
            background-color: transparent !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
        }
      }
    }
  }
`;

interface GameInvitationCardProps {
  invitation: GameInvitationType;
  userId: string;
  onClick?: () => void;
  onAction?: () => void;
}
const GameInvitationCard = (props: GameInvitationCardProps) => {
  const isFromUser = props.invitation.sender.id === props.userId;
  const isExpired =
    props.invitation.expiresAt &&
    timeUntil(props.invitation.expiresAt) === "already passed";

  const { toasts } = useAppContext();

  const handleCancelInvite = async () => {
    try {
      const resp = await cancelInvite(props.invitation.id);

      if (resp) {
        toasts.addToastToQueue({
          type: "success",
          message: "Invite cancelled",
          duration: 3000,
        });
        props.onAction && props.onAction();
      }
    } catch (error: any) {
      toasts.addToastToQueue({
        type: "error",
        message: error.message || "Failed to cancel invite",
        duration: 5000,
      });
    }
  };
  const handleDeclineInvitation = async () => {
    try {
      const resp = await DeclineInvite(props.invitation.id);

      if (resp) {
        toasts.addToastToQueue({
          type: "success",
          message: "Invitation declined successfully.",
        });
        props.onAction && props.onAction();
      }
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message: err.message || "Failed to decline invitation.",
      });
    }
  };
  const handleAcceptInvitation = async () => {
    try {
      const resp = await AcceptInvite(props.invitation.id);
      if (resp) {
        toasts.addToastToQueue({
          type: "success",
          message: "Invitation accepted! Setting the game...",
        });
        props.onAction && props.onAction();
      }
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message: err.message || "Failed to accept invitation.",
      });
    }
  };

  return (
    <StyledGameInvitationCard isFromUser={isFromUser} isExpired={isExpired}>
      <div className="InviteAvatar">
        <InviteIcon fill="rgba(255,255,255, 0.4)" size={40} />
        <BackIcon
          fill="rgba(255,255,255, 0.4)"
          size={20}
          className="BackIcon"
        />
      </div>
      <div className="MainInviteCardContainer" onClick={props.onClick}>
        <div className="TopContainer">
          <h1>{props.invitation.inviteCode}</h1>

          <span className="ExpiredAt">
            {props.invitation.status === "ACCEPTED"
              ? "accepted"
              : props.invitation.status === "DECLINED"
              ? "declined"
              : props.invitation.status === "CANCELLED"
              ? "cancelled"
              : props.invitation.status === "EXPIRED"
              ? "expired"
              : props.invitation.expiresAt
              ? `expires in ${timeUntil(props.invitation.expiresAt)}`
              : "PENDING"}
          </span>
        </div>

        <div className="BottomContainer">
          <div className="GameSettings">
            <span>
              <PersonIcon size={16} fill="rgba(255,255,255,0.4)" />
              By {isFromUser ? "You" : props.invitation.sender.username}
            </span>
            <span>
              <ScoreIcon size={20} fill="rgba(255,255,255,0.4)" />
              {props.invitation.scoreLimit}
            </span>
            <span>
              <PauseIcon size={20} fill="rgba(255,255,255,0.4)" />
              {props.invitation.pauseTime}
            </span>
            <span>
              <CoinIcon size={20} />
              {props.invitation.requiredCurrency === 0
                ? "Free"
                : props.invitation.requiredCurrency}
            </span>
            <span className="PowerUpsIcon">
              <PowerUpsIcon
                size={20}
                fill={
                  props.invitation.allowPowerUps
                    ? "var(--green_color)"
                    : "var(--red_color)"
                }
              />
            </span>
          </div>
          <div className="RightActions">
            {isFromUser ? (
              <button
                className="SentInviteAction"
                disabled={isExpired || props.invitation.status !== "PENDING"}
                onClick={handleCancelInvite}
              >
                Cancel
              </button>
            ) : (
              <div className="RecievedInviteActions">
                <button
                  disabled={isExpired || props.invitation.status !== "PENDING"}
                  onClick={handleDeclineInvitation}
                >
                  <CloseIcon size={20} fill="var(--red_color)" />
                </button>
                <button
                  disabled={isExpired || props.invitation.status !== "PENDING"}
                  onClick={handleAcceptInvitation}
                >
                  <CheckIcon size={20} fill="var(--green_color)" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </StyledGameInvitationCard>
  );
};

export default GameInvitationCard;

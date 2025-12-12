import {
  AcceptInvite,
  cancelInvite,
  createInvite,
  DeclineInvite,
  getUserGameInvitations,
} from "@/api/gameInvitation";
import { getUserFriends, SearchUsers } from "@/api/user";
import { useAppContext } from "@/contexts/AppProviders";
import { useSounds } from "@/contexts/SoundProvider";
import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import {
  GameInvitation,
  GameMode,
  GameSettings,
  Match,
} from "@/types/game/game";
import { User } from "@/types/user";
import {
  BackIcon,
  CoinIcon,
  CopyIcon,
  InviteIcon,
  PauseIcon,
  PowerUpsIcon,
  ScoreIcon,
  VerifiedIcon,
} from "../Svg/Svg";
import { LoaderSpinner } from "../Loader/Loader";
import GameInvitationCard from "./GameInvitation";
import { getRankMetaData } from "@/utils/game";
import { sendMessage } from "@/api/chat";

const StyledInviteOponent = styled("div")`
  width: 600px;
  height: 400px;
  clip-path: path("M 0,0 L 580,0 L 600,20 L 600,400 L 30,400 L 0,370 L 0,0 Z");
  z-index: 9999999;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(27, 26, 31, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  padding: 0px 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  &:after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    background: linear-gradient(
      30deg,
      rgba(102, 122, 166, 0.3) 0%,
      rgba(255, 0, 0, 0) 50%
    );
  }

  .MyInvatationsBtn {
    height: 40px;
    width: 40px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .HeaderLine {
    font-family: var(--squid_font);
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.5rem;
    text-align: center;
  }
  .InviteOponentContent {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    flex: 1;
    z-index: 2;
    .InviteOponentContentContainer {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      .InviteGameSettings {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 60px;
        span {
          color: rgba(255, 255, 255, 0.5);
          font-family: var(--main_font);
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0px 10px;
          position: relative;
          &:last-child {
            &:after {
              display: none;
            }
          }
          &:after {
            width: 1px;
            height: 40px;
            position: absolute;
            right: 0;
            content: "";
            background: linear-gradient(
              0deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.3) 50%,
              rgba(255, 255, 255, 0) 100%
            );
          }
        }
      }
      .InviteSettings {
        width: 100%;
        .ExpireTime {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          gap: 10px;
          margin-bottom: 15px;
          span {
            color: rgba(255, 255, 255, 0.5);
            font-family: var(--main_font);
            font-size: 1rem;
          }
          .ExpireOptions {
            display: flex;
            align-items: center;
            gap: 10px;
            input[type="radio"] {
              accent-color: var(--main_color);
              cursor: pointer;
            }
            label {
              color: rgba(255, 255, 255, 0.3);
              font-family: var(--span_font);
              font-size: 0.9rem;
              cursor: pointer;
            }
          }
        }
        .InviteType {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          gap: 10px;
          margin-bottom: 15px;

          span {
            color: rgba(255, 255, 255, 0.5);
            font-family: var(--main_font);
            font-size: 1rem;
          }
          .InviteOptions {
            display: flex;
            align-items: center;
            gap: 10px;
            input[type="radio"] {
              accent-color: var(--main_color);
              cursor: pointer;
            }
            label {
              color: rgba(255, 255, 255, 0.3);
              font-family: var(--span_font);
              font-size: 0.9rem;
              cursor: pointer;
            }

            .SelectPlayerItemBtn {
              width: 160px;
              height: 35px;
              border-radius: 3px;
            }
          }
        }
      }
      .InviteOpponent {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: flex-start;
        gap: 10px;
        span {
          color: rgba(255, 255, 255, 0.5);
          font-family: var(--main_font);
          font-size: 1rem;
        }
        .SelectedOpponentContainer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          span {
            color: rgba(255, 255, 255, 0.3);
          }
        }
        .SelectedOpponent {
          width: auto;
          height: 35px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 30px;
          padding: 2px;
          padding-right: 10px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 5px;
          span {
            margin-bottom: 3px;
          }
          .SelectedOpponentAvatar {
            height: 33px;
            width: 33px;
            background-position: center;
            background-size: cover;
            background-color: var(--bg_color);
            border-radius: 28px;
          }
        }
      }
    }
    .BottomMenu {
      position: absolute;
      bottom: 5px;
      width: 100%;
      height: 40px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 5px;
      button {
        cursor: pointer;
        transition: background-color 0.3s ease-in-out;
      }
      .CreateInviteBtn {
        width: 150px;
        height: 100%;
        border-radius: 3px;
      }
      .JoinGameBtn {
        width: 150px;
        height: 100%;
        border-radius: 3px;
      }
    }
  }

  .JoinGameContent {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 20px;
    z-index: 2;
    span {
      color: rgba(255, 255, 255, 0.5);
      font-family: var(--main_font);
      font-size: 1rem;
      margin-top: 40px;
    }
    .JoinInput {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 10px;
      position: relative;
      .InviteLinkInput {
        width: 100%;
        padding: 10px;
        height: 50px;
        border-radius: 5px;
        border: none;
        background-color: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
        font-family: var(--main_font);
        outline: 1px solid rgba(255, 255, 255, 0.15);
      }
      .JoinBtn {
        width: 150px;
        height: 45px;
        border-radius: 5px;
        margin-left: auto;
        position: absolute;
        right: 2px;
        top: 3px;
      }
    }
    .BottomMenu {
      margin-top: auto;
      width: 100%;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      button {
        width: 150px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 5px;
      }
    }
  }

  .InvitationsList {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5px 0px;
    z-index: 2;
    gap: 7px;
    .InvitationListContainer {
      flex: 1;
      width: 100%;
      max-height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      overflow-y: auto;
      .NoInvitsFound {
        color: rgba(255, 255, 255, 0.5);
        font-family: var(--span_font);
        font-size: 1rem;
        margin-top: 20px;
      }
    }
    .SecBtn {
      width: 150px;
      height: 40px;
      border-radius: 5px;
      font-family: var(--main_font);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      z-index: 2;
    }
  }

  .SelectOponentMode {
    flex: 1;
    width: 100%;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    .SearchInput {
      width: 100%;
      height: 40px;
      border-radius: 5px;
      background-color: var(--bg_color_light);
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.8);
      padding: 0px 10px;
      font-family: var(--span_font);
      outline: none;
    }
    .SelectOponentModePlayersList {
      flex: 1;
      margin-top: 10px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      overflow-y: auto;
      max-height: 250px;
      .NoneSPN {
        color: rgba(255, 255, 255, 0.5);
        font-family: var(--span_font);
        font-size: 1rem;
        margin-top: 20px;
      }
      .SelectOponentModePlayersListItem {
        width: 100%;
        height: 50px;
        background-color: var(--bg_color);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 5px;
        .Avatar {
          width: 45px;
          height: 100%;
          background-color: var(--bg_color_light);
          border-radius: 2px;
          border: 1px solid rgba(255, 255, 255, 0.03);
          background-size: cover;
          background-position: center;
        }
        .ItemPlayerInfo {
          width: 200px;
          flex: 1;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          h2 {
            font-family: var(--main_font);
            color: rgba(255, 255, 255, 0.5);
            font-size: 1rem;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 5px;
          }
          .PlayerRanking {
            height: 20px;
            padding: 0px 5px;
            background-color: rgba(255, 255, 255, 0.01);
            border: 1px solid rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.3);
            font-family: var(--main_font);
            border-radius: 2px;
            display: flex;
            gap: 5px;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.5);
            .RankIcon {
              height: 16px;
            }
          }
        }
        .SelectPlayerItemBtn {
          margin-left: auto;
          width: 100px;
          height: 35px;
          border-radius: 3px;
        }
      }
    }
    .SecBtn {
      width: 150px;
      height: 40px;
      border-radius: 5px;
      margin-top: auto;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
  }

  .InviteDataContent {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    z-index: 2;
    .BackBtn {
      position: absolute;
      width: 40px;
      height: 40px;
      top: 5px;
      left: 5px;
      border-radius: 5px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s ease-in-out;
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }

    .InviteDataHeader {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      .InviteGameSettings {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        span {
          color: rgba(255, 255, 255, 0.5);
          font-family: var(--main_font);
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0px 10px;
          position: relative;
          &:last-child {
            &:after {
              display: none;
            }
          }
          &:after {
            width: 1px;
            height: 40px;
            position: absolute;
            right: 0;
            content: "";
            background: linear-gradient(
              0deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.3) 50%,
              rgba(255, 255, 255, 0) 100%
            );
          }
        }
      }
    }

    .CodeCard {
      width: 300px;
      height: 50px;
      border-radius: 5px;
      background-color: var(--bg_color);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(180, 180, 180, 0.1);
      gap: 10px;
      svg {
        transition: fill 0.2s ease-in-out;
        cursor: pointer;
      }
      svg:hover {
        fill: rgba(255, 255, 255, 0.8);
      }

      span {
        font-family: var(--main_font);
        color: rgba(255, 255, 255, 0.8);
        font-size: 1.2rem;
        letter-spacing: 2px;
      }
    }

    .InviteSettings {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 5px;
      .InviteSettingElement {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        .InviteSettingElName {
          color: rgba(255, 255, 255, 0.5);
          font-family: var(--main_font);
          font-size: 1rem;
          margin-bottom: 3px;
          width: 130px;
        }
        .InviteSettingElValue {
          color: rgba(255, 255, 255, 0.3);
          font-family: var(--span_font);
          font-size: 0.9rem;
        }
      }
    }

    .BottomMenu {
      margin-top: auto;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      .ForMeActions {
        width: 100%;
        display: flex;
        gap: 5px;
      }
      button {
        width: 150px;
        height: 40px;
        display: flex;
        font-family: var(--main_font);
        align-items: center;
        justify-content: center;
        border-radius: 5px;
      }
    }
  }
`;
interface InviteOponentProps {
  onClose: () => void;
  GameSettings: GameSettings;
  selectedInvitation: GameInvitation | null;
  setSelectedInvitation: (invitation: GameInvitation | null) => void;
  setSelectedMatch: (match: Match | null) => void;
  setSelectedMode: (mode: GameMode | null) => void;
  selectedOpponent: User | null;
  setSelectedOpponent: (opponent: User | null) => void;
}
export const InviteOponent = (props: InviteOponentProps) => {
  const ModalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setisLoading] = useState(false);
  const [ModalMode, setModalMode] = useState<
    "invite" | "join" | "InvitationsList" | "SelectOponent" | "inviteData"
  >("invite");

  //App Ctx
  const { toasts, user } = useAppContext();

  // for private invite
  const [code, setCode] = useState("");
  const [isPrivateInvite, setIsPrivateInvite] = useState(false);
  const [userFriends, setUserFriends] = useState<User[]>([]);
  const [opponentsList, setOpponentsList] = useState<User[]>([]);
  const [query, setQuery] = useState("");

  // for Invitation Data
  type ExpirationOption = "30min" | "1hr" | "4hr" | "24hr" | "never";
  const [selectedExpireOption, setSelectedExpireOption] =
    useState<ExpirationOption>("30min");
  const handleChange = (value: ExpirationOption) =>
    setSelectedExpireOption(value);

  const { popupSound } = useSounds();
  const [userInvitations, setUserInvitations] = useState<GameInvitation[]>([]);

  const getUserInvitations = async () => {
    try {
      const userIvitations = await getUserGameInvitations(user?.id!);
      const activeInvits = userIvitations.filter(
        (invite) => invite.status === "PENDING"
      );

      setUserInvitations(userIvitations);
    } catch (err) {
      console.error("Error fetching user invitations: ", err);
    }
  };
  useEffect(() => {
    if (!user) return;

    const getFriendsList = async () => {
      if (!user) return;
      try {
        const friends = await getUserFriends(user?.username);
        if (friends && friends.data) {
          setUserFriends(friends.data as unknown as User[]);
          const shuffled = friends.data
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
          setOpponentsList(shuffled as unknown as User[]);
        }
      } catch (err) {
        console.error("Error fetching friends list: ", err);
      }
    };

    getUserInvitations();
    if (ModalMode === "SelectOponent") {
      getFriendsList();
    }
    if (ModalMode === "invite") {
      setIsPrivateInvite(props.selectedOpponent ? true : false);
    }
  }, [ModalMode]);

  // Invitation preview
  useEffect(() => {
    popupSound.play();
    if (props.selectedInvitation) setModalMode("inviteData");
  }, [props.selectedInvitation]);

  // Invitation Handlers
  const handleCopyInvitationCode = () => {
    if (props.selectedInvitation?.inviteCode) {
      navigator.clipboard.writeText(
        "SQUIDPONG[" + props.selectedInvitation.inviteCode + "]"
      );
      toasts.addToastToQueue({
        type: "success",
        message: "Invitation code copied to clipboard!",
      });
    }
  };
  const handleInviteOpponentByMessage = async () => {
    if (!props.selectedInvitation) return;

    try {
      const resp = await sendMessage(
        undefined,
        props.selectedInvitation.inviteCode,
        props.selectedInvitation.receiver?.userId.toString(),
        props.selectedInvitation.inviteCode,
        undefined
      );

      if (resp.success) {
        toasts.addToastToQueue({
          type: "success",
          message: "Invitation code sent via message!",
        });
      } else throw new Error("Failed to send message");
    } catch (err) {
      toasts.addToastToQueue({
        type: "error",
        message: "Failed to send invitation message.",
      });
    }
  };
  const handleCreateInvitation = async () => {
    if (isPrivateInvite && !props.selectedOpponent)
      return toasts.addToastToQueue({
        type: "error",
        message: "Please select an opponent for private invite.",
      });

    try {
      const res = await createInvite(
        props.GameSettings,
        isPrivateInvite ? props.selectedOpponent?.userId! : null,
        selectedExpireOption === "never"
          ? null
          : new Date(
            Date.now() +
            { "30min": 30, "1hr": 60, "4hr": 240, "24hr": 1440 }[
            selectedExpireOption
            ] *
            60000
          ),
        "Join my game!"
      );
      if (res) {
        toasts.addToastToQueue({
          type: "success",
          message: "Invitation created successfully!",
        });
        props.setSelectedInvitation(res);
      }
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message: err.message || "Failed to create invitation.",
      });
    }
  };
  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const resp = await cancelInvite(invitationId);

      if (resp) {
        toasts.addToastToQueue({
          type: "success",
          message: "Invitation cancelled successfully.",
        });
        props.setSelectedInvitation(null);
        setModalMode("invite");
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
        props.setSelectedInvitation(null);
        setModalMode("invite");
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
        props.setSelectedInvitation(resp.data.invitation);
        props.setSelectedInvitation(null);
        props.setSelectedMatch(resp.data.match);
        props.setSelectedMode(resp.data.match.mode as GameMode);
        props.onClose();
      }
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message: err.message || "Failed to accept invitation.",
      });
    }
  };
  const Search = async (query: string) => {
    const Users = await SearchUsers(query);

    if (Users.data) {
      setOpponentsList(Users.data);
    }
  };
  // const handleJoinWithCode = async () => {
  //   try {
  //     const invite = await getInvitationByCode(code);
  //     if (invite) {
  //       toasts.addToastToQueue({
  //         type: "success",
  //         message: "Invitation found!",
  //       });
  //       console.log(invite);
  //       setSelectedInvitation(invite);
  //       setModalMode("inviteData");
  //     }
  //   } catch (err: any) {
  //     toasts.addToastToQueue({
  //       type: "error",
  //       message: err.message || "Failed to join with code.",
  //     });
  //   }
  // };

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
    if (query.trim() === "") {
      const shuffled = userFriends;
      console.log("shuf:", shuffled);
      return setOpponentsList(shuffled);
    }
    const delayDebounceFn = setTimeout(() => {
      Search(query.trim());
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // useCountDown
  // const { days, expired, hours, minutes, seconds } = useCountdown(
  //   SelectedInvitation?.expiresAt
  // );
  const { days, hours, minutes, seconds, expired } = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: true,
  };

  // Flags
  const isTheSelectedInvitationByMe =
    props.selectedInvitation?.sender.id === user?.id;

  const isTheSelectedInvitationExpired = props.selectedInvitation?.expiresAt
    ? new Date(props.selectedInvitation.expiresAt) < new Date()
    : false;
  const isTheSelectedInvitationValid =
    !isTheSelectedInvitationExpired &&
    props.selectedInvitation?.status === "PENDING";

  return (
    <StyledInviteOponent ref={ModalRef} key="invite-oponent-modal">
      <h1 className="HeaderLine">
        {ModalMode === "invite"
          ? "Invite Oponent"
          : ModalMode === "join"
            ? "Join Game"
            : ModalMode === "InvitationsList"
              ? "My Invitations"
              : ModalMode === "inviteData"
                ? "Invitation"
                : "Select Oponent"}
      </h1>

      {isLoading ? (
        <LoaderSpinner />
      ) : ModalMode === "invite" ? (
        <div className="InviteOponentContent" key="invite-content">
          <div className="InviteOponentContentContainer">
            <div className="InviteGameSettings">
              <span>
                <ScoreIcon fill="rgba(255,255,255,0.4)" size={20} />
                {props.GameSettings.rules.maxScore}
              </span>
              <span>
                <PauseIcon fill="rgba(255,255,255,0.4)" size={20} />
                {props.GameSettings.rules.pauseTime} seconds
              </span>
              <span>
                <PowerUpsIcon fill="rgba(255,255,255,0.4)" size={20} />
                {props.GameSettings.rules.allowPowerUps
                  ? "Enabled"
                  : "Disabled"}
              </span>
              <span>
                <CoinIcon fill="rgba(255,255,255,0.4)" size={20} />
                {props.GameSettings.requiredCurrency === 0
                  ? "Free"
                  : props.GameSettings.requiredCurrency}
              </span>
            </div>

            <div className="InviteSettings">
              <div className="ExpireTime">
                <span>Expires after:</span>
                <div className="ExpireOptions">
                  <input
                    type="radio"
                    name="expire"
                    id="30min"
                    checked={selectedExpireOption === "30min"}
                    onChange={() => handleChange("30min")}
                  />
                  <label htmlFor="30min">30 min</label>

                  <input
                    type="radio"
                    name="expire"
                    id="1hr"
                    checked={selectedExpireOption === "1hr"}
                    onChange={() => handleChange("1hr")}
                  />
                  <label htmlFor="1hr">1 hr</label>

                  <input
                    type="radio"
                    name="expire"
                    id="4hr"
                    checked={selectedExpireOption === "4hr"}
                    onChange={() => handleChange("4hr")}
                  />
                  <label htmlFor="4hr">4 hr</label>

                  <input
                    type="radio"
                    name="expire"
                    id="24hr"
                    checked={selectedExpireOption === "24hr"}
                    onChange={() => handleChange("24hr")}
                  />
                  <label htmlFor="24hr">24 hr</label>

                  <input
                    type="radio"
                    name="expire"
                    id="never"
                    checked={selectedExpireOption === "never"}
                    onChange={() => handleChange("never")}
                  />
                  <label htmlFor="never">Never</label>
                </div>
              </div>
              <div className="InviteType">
                <span>Invite Type :</span>
                <div className="InviteOptions">
                  <input
                    type="radio"
                    name="inviteType"
                    id="public"
                    checked={!isPrivateInvite}
                    onChange={() => setIsPrivateInvite(false)}
                  />
                  <label htmlFor="public">Public</label>
                  <input
                    type="radio"
                    name="inviteType"
                    id="private"
                    onChange={() => setIsPrivateInvite(true)}
                    checked={isPrivateInvite}
                  />
                  <label htmlFor="private">Private</label>

                  {isPrivateInvite && (
                    <button
                      className="SelectPlayerItemBtn BtnPrimary"
                      style={{ marginLeft: "auto" }}
                      onClick={() => setModalMode("SelectOponent")}
                    >
                      Select Oponent
                    </button>
                  )}
                </div>
              </div>
              <div className="InviteOpponent">
                <span>Opponent :</span>
                <div className="SelectedOpponentContainer">
                  {isPrivateInvite && props.selectedOpponent ? (
                    <div className="SelectedOpponent">
                      <div
                        className="SelectedOpponentAvatar"
                        style={{
                          backgroundImage: `url(${props.selectedOpponent.avatar})`,
                        }}
                      />
                      <span>{props.selectedOpponent.username}</span>
                    </div>
                  ) : !props.selectedOpponent && isPrivateInvite ? (
                    <span>No player selected.</span>
                  ) : (
                    <span>Anyone can join</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="BottomMenu">
            <button
              className="BtnPrimary CreateInviteBtn"
              onClick={handleCreateInvitation}
            >
              Create Invite
            </button>
            <button
              className="BtnSecondary JoinGameBtn"
              onClick={() => {
                setModalMode("join");
              }}
            >
              Join Game
            </button>
            <button
              className="BtnSecondary MyInvatationsBtn"
              onClick={() => setModalMode("InvitationsList")}
            >
              <InviteIcon fill="var(--main_color)" size={25} />
            </button>
          </div>
        </div>
      ) : ModalMode === "join" ? (
        <div className="JoinGameContent" key="join-content">
          <span>Enter Invite Code:</span>

          <div className="JoinInput">
            <input
              type="text"
              className="InviteLinkInput"
              placeholder="Code"
              value={code}
              onChange={(e: any) => setCode(e.target.value)}
            />
            <button
              className="BtnPrimary JoinBtn"
            // onClick={() => handleJoinWithCode()}
            >
              Join
            </button>
          </div>

          <div className="BottomMenu">
            <button
              className="BtnSecondary SecBtn"
              onClick={() => setModalMode("invite")}
            >
              <BackIcon fill="var(--main_color)" size={20} />
              Back to Invite
            </button>
          </div>
        </div>
      ) : ModalMode === "InvitationsList" ? (
        <div className="InvitationsList" key="invitations-list">
          <div className="InvitationListContainer scroll-y">
            {userInvitations.length > 0 ? (
              userInvitations.map((invitation) => {
                return (
                  <GameInvitationCard
                    invitation={invitation}
                    userId={user?.id!}
                    onClick={() => {
                      props.setSelectedInvitation(invitation);
                      setModalMode("inviteData");
                    }}
                    onAction={(invitation) => {
                      props.setSelectedInvitation(invitation);
                    }}
                  />
                );
              })
            ) : (
              <span className="NoInvitsFound">No invitations found.</span>
            )}
          </div>
          <button
            className="BtnSecondary SecBtn"
            onClick={() => setModalMode("invite")}
          >
            <BackIcon fill="var(--main_color)" size={20} />
            Back to Invite
          </button>
        </div>
      ) : ModalMode === "inviteData" && props.selectedInvitation ? (
        <div className="InviteDataContent" key="invite-data-content">
          <div
            className="BackBtn"
            onClick={() => setModalMode("InvitationsList")}
          >
            <BackIcon fill="rgba(255,255,255,0.5)" size={25} />
          </div>
          <div className="InviteDataHeader">
            <div className="InviteGameSettings">
              <span>
                <ScoreIcon fill="rgba(255,255,255,0.4)" size={20} />
                {props.selectedInvitation.scoreLimit}
              </span>
              <span>
                <PauseIcon fill="rgba(255,255,255,0.4)" size={20} />
                {props.selectedInvitation.pauseTime} seconds
              </span>
              <span>
                <PowerUpsIcon
                  fill={`${props.selectedInvitation.allowPowerUps
                      ? "var(--green_color)"
                      : "var(--red_color)"
                    }`}
                  size={20}
                />
                {props.selectedInvitation.allowPowerUps
                  ? "Enabled"
                  : "Disabled"}
              </span>
              <span>
                <CoinIcon fill="rgba(255,255,255,0.4)" size={20} />
                {props.selectedInvitation.requiredCurrency === 0
                  ? "Free"
                  : props.selectedInvitation.requiredCurrency}
              </span>
            </div>
          </div>

          <div className="CodeCard">
            <span>{props.selectedInvitation?.inviteCode}</span>
            <a onClick={handleCopyInvitationCode}>
              <CopyIcon
                className="CopyIcon"
                fill="rgba(255,255,255,0.4)"
                size={30}
              />
            </a>
            <a onClick={handleInviteOpponentByMessage}>
              <InviteIcon
                className="InviteIcon"
                fill="var(--main_color)"
                size={30}
              />
            </a>
          </div>

          <div className="InviteSettings">
            <div className="InviteSettingElement">
              <span className="InviteSettingElName">Status</span>
              <span className="InviteSettingElValue">
                {props.selectedInvitation?.status}
              </span>
            </div>
            <div className="InviteSettingElement">
              <span className="InviteSettingElName">Host</span>
              <span className="InviteSettingElValue">
                {props.selectedInvitation?.sender.username}
              </span>
            </div>

            <div className="InviteSettingElement">
              <span className="InviteSettingElName">Opponent</span>
              <span className="InviteSettingElValue">
                {props.selectedInvitation?.receiver
                  ? props.selectedInvitation.receiver.username
                  : "Anyone can join"}
              </span>
            </div>

            <div className="InviteSettingElement">
              <span className="InviteSettingElName">Type</span>
              <span className="InviteSettingElValue">
                {props.selectedInvitation?.type}
              </span>
            </div>

            <div className="InviteSettingElement">
              <span className="InviteSettingElName">Message</span>
              <span className="InviteSettingElValue">
                {props.selectedInvitation?.message || "No message provided."}
              </span>
            </div>
            {props.selectedInvitation.status === "PENDING" && (
              <div className="InviteSettingElement">
                <span className="InviteSettingElName">Expires At</span>
                <span className="InviteSettingElValue">
                  {!props.selectedInvitation.expiresAt
                    ? "Never"
                    : isTheSelectedInvitationExpired
                      ? "Expired"
                      : days > 0
                        ? `${days}d ${hours}h ${minutes}m`
                        : hours > 0
                          ? `${hours}h ${minutes}m ${seconds}s`
                          : minutes > 0
                            ? `${minutes}m ${seconds}s`
                            : `${seconds}s`}
                </span>
              </div>
            )}
          </div>

          <div className="BottomMenu">
            {isTheSelectedInvitationValid && !isTheSelectedInvitationByMe ? (
              <div className="ForMeActions">
                <button
                  className="BtnPrimary JoinGameBtn"
                  onClick={() =>
                    handleAcceptInvitation(props.selectedInvitation?.id!)
                  }
                >
                  Accept
                </button>
                <button
                  className="BtnSecondary SecBtn"
                  onClick={() =>
                    handleDeclineInvitation(props.selectedInvitation?.id!)
                  }
                >
                  Reject
                </button>
              </div>
            ) : isTheSelectedInvitationValid ? (
              <button
                className="BtnPrimary"
                onClick={() =>
                  handleCancelInvitation(props.selectedInvitation?.id!)
                }
              >
                Cancel
              </button>
            ) : (
              ""
            )}
          </div>
        </div>
      ) : (
        <div className="SelectOponentMode" key="select-oponent-mode">
          <input
            type="input"
            placeholder="Search players..."
            className="SearchInput"
            onChange={(e: any) => setQuery(e.target.value)}
          />

          <div className="SelectOponentModePlayersList scroll-y">
            {opponentsList && opponentsList.length > 0 ? (
              opponentsList.map((user) => (
                <div
                  className="SelectOponentModePlayersListItem"
                  key={user.id}
                  onClick={() => {
                    props.setSelectedOpponent(user);
                    setModalMode("invite");
                  }}
                >
                  <div
                    className="Avatar"
                    style={{ backgroundImage: `url(${user.avatar})` }}
                  />
                  <div className="ItemPlayerInfo">
                    <h2>
                      {user.firstName} {user.lastName}
                      {user.isVerified && (
                        <VerifiedIcon fill="var(--main_color)" size={14} />
                      )}
                      <div className="PlayerRanking">
                        <img
                          className="RankIcon"
                          src={
                            getRankMetaData(user.rankDivision, user.rankTier)
                              ?.image
                          }
                        />
                        {user.rankDivision} {user.rankTier}
                      </div>
                    </h2>
                  </div>
                  <button className="SelectPlayerItemBtn BtnPrimary">
                    Select
                  </button>
                </div>
              ))
            ) : (
              <span className="NoneSPN">No players found.</span>
            )}
          </div>

          <button
            className="SecBtn BtnSecondary"
            onClick={() => setModalMode("invite")}
          >
            <BackIcon fill="var(--main_color)" size={20} />
            Back
          </button>
        </div>
      )}
    </StyledInviteOponent>
  );
};

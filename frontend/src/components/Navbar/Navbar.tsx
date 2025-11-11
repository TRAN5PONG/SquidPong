import Zeroact, { useContext, useEffect, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import Notification from "./Notifications/Notification";
import {
  ChatIcon,
  CoinIcon,
  FriendsIcon,
  NotificationIcon,
  SearchIcon,
  SettingsIcon,
} from "../Svg/Svg";
import ChatModal from "./Messages/Messages";

import { User } from "@/types/user";
import { db } from "@/db";
import { RouterContext, useNavigate } from "@/contexts/RouterProvider";
import { useAppContext } from "@/contexts/AppProviders";
import UserBanner from "./UserBanner";
import SearchModal from "./search/Search";
import SettingsModal from "./SettingsModal/SettingsModal";
import TwoFAModal from "../Settings/twoFA";
import { getNotifications, markNotificationAsRead } from "@/api/notification";
import { NotificationEl } from "@/types/notification";
import { socketManager } from "@/utils/socket";
import Toast from "../Toast/Toast";
import { Conversation } from "@/types/chat";
import { getConversations } from "@/api/chat";

const StyledNav = styled("div")`
  width: 100%;
  height: 50px;
  z-index: 999;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  justify-content: space-between;
  background: linear-gradient(
    90deg,
    rgba(73, 91, 134, 0.4) 0%,
    rgba(73, 91, 134, 0) 70%
  );
  &:after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(
      90deg,
      rgba(73, 91, 134, 1) 0%,
      rgba(73, 91, 134, 0) 70%
    );
    background-position: bottom;
    background-size: 100% 1px;
    background-repeat: no-repeat;
    z-index: -1;
  }

  .SearchInput {
    width: 400px;
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .SearchIconSvg {
      position: absolute;
      left: 10px;
    }
    input {
      width: 100%;
      height: 100%;
      padding: 5px 30px;
      border: none;
      border-radius: 5px;
      font-family: var(--main_font);
      font-size: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.06);
      background-color: transparent;
      color: white;
      outline: none;
    }
  }

  .Right {
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;

    .RightEl {
      width: 40px;
      height: 40px;
      border-radius: 5px;
      padding: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: 0.2s ease-in-out;
      border: 1px solid rgba(255, 255, 255, 0.06);
      background-color: var(--bg_color_light);
      &:hover {
        background-color: var(--bg_color);
      }
      position: relative;

      .NotificationON {
      }
    }
    .RightEl.NotificationON {
      background: linear-gradient(
        222deg,
        rgba(73, 91, 134, 0.4) 0%,
        rgba(202, 47, 60, 0) 100%
      );
      border: 1px solid rgba(73, 91, 134, 0.4);
      .RightElIcon {
        fill: rgba(73, 91, 134, 0.9);
      }
      &:hover {
        background-color: var(--bg_color);
        .RightElIcon {
          fill: rgba(73, 91, 134, 1);
        }
      }
      &:after {
        position: absolute;
        content: "";
        width: 10px;
        height: 10px;
        background-color: rgba(95, 119, 177, 0.9);
        border-radius: 50%;
        position: absolute;
        top: -2px;
        right: -2px;
      }
    }
    .Wallet {
      width: 150px;
      height: 40px;
      background: linear-gradient(
        -90deg,
        rgba(255, 217, 68, 1) 0%,
        rgba(255, 156, 45, 1) 100%
      );
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 5px;
      color: white;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      img {
        height: 100%;
      }
      span {
        font-family: var(--main_font);
        color: #ffffff;
        font-size: 1.2rem;
        font-weight: 500;
        padding: 0 10px;
        flex: 1;
        text-align: center;
      }
    }
  }
`;

const Navbar = () => {
  // toggles
  const [ShowChatModal, setShowChatModal] = useState(false);
  const [ShowNotificationModal, setShowNotificationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [ShowSearchModal, setShowSearchModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  // stats
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState<NotificationEl[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // contexts
  const { currentPath } = useContext(RouterContext);
  const { user, toasts } = useAppContext();

  if (!user || currentPath === "/" || currentPath.startsWith("/game")) {
    return null;
  }

  // Toggles
  const toggleChatModal = () => {
    setShowChatModal(!ShowChatModal);
  };
  const toggleProfileModel = () => {
    setShowSettingsModal(!showSettingsModal);
  };
  const toggleNotificationModal = () => {
    setShowNotificationModal(!ShowNotificationModal);
  };

  // Fetchs
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };
  const fetchConversations = async () => {
    try {
      const resp = await getConversations();
      console.log("Fetched conversations:", resp);
      if (resp.success && resp.data) {
        setConversations(resp.data);
        // setIsLoadingConversations(false);
      }
    } catch (err: any) {}
  };

  useEffect(() => {
    socketManager.subscribe("notification", (data: any) => {
      toasts.addToastToQueue({
        type: "info",
        message: data.message,
        duration: 5000,
        onClick() {
          try {
            console.log("Notification clicked:", data); // TODO
            markNotificationAsRead(data.id);
          } catch (error) {}
        },
      });
      fetchNotifications();
    });
    return () => {
      socketManager.unsubscribe("notification", () => {});
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchConversations();
  }, [user]);

  return (
    <StyledNav className="GlassMorphism" avatar={user.avatar}>
      <UserBanner {...user} />

      <div className="SearchInput">
        <input
          type="text"
          className="GlassMorphism"
          placeholder="Search a player, tournament..."
          onFocus={() => setShowSearchModal(true)}
          value={query}
          onChange={(e: any) => {
            setQuery(e.target.value);
          }}
        />
        <SearchIcon size={20} stroke="white" className="SearchIconSvg" />
        {ShowSearchModal && (
          <SearchModal
            onClose={() => {
              setShowSearchModal(false);
            }}
            query={query}
          />
        )}
      </div>

      <div className="Right">
        <div
          className={`RightEl ${
            notifications.some((notif) => !notif.isRead) ? "NotificationON" : ""
          }`}
          onClick={toggleNotificationModal}
        >
          {/* <div className="NotificationON" /> */}
          <NotificationIcon
            size={20}
            fill="rgba(73, 91, 134, 0.9)"
            className="RightElIcon"
          />
        </div>
        <div
          className={`RightEl ${
            conversations.length > 0 ? "NotificationON" : ""
          }`}
          onClick={toggleChatModal}
        >
          <ChatIcon size={20} fill="rgba(73, 91, 134, 0.9)" />
        </div>
        <div className="RightEl" onClick={toggleProfileModel}>
          <SettingsIcon size={20} fill="rgba(73, 91, 134, 0.9)" />
        </div>
        <div className="Wallet">
          <CoinIcon size={25} fill="white" />
          <span>{user.walletBalance}</span>
        </div>
      </div>

      {ShowNotificationModal ? (
        <Notification
          onClose={() => {
            setShowNotificationModal(false);
          }}
          notifications={notifications}
          refetchNotifs={fetchNotifications}
        />
      ) : null}
      {showSettingsModal ? (
        <SettingsModal
          userStatus={user.status}
          showStatusModal={showStatusModal}
          setShowStatusModal={setShowStatusModal}
          onClose={() => {
            setShowSettingsModal(false);
            setShowStatusModal(false);
          }}
        />
      ) : null}
      {ShowChatModal ? (
        <ChatModal
          onClose={() => {
            setShowChatModal(false);
          }}
          conversations={conversations}
          refetch_conversations={fetchConversations}
        />
      ) : null}
    </StyledNav>
  );
};
export default Navbar;

import Zeroact, { useEffect, useState } from "@/lib/Zeroact";
import {
  defaultStats,
  PlayerStats,
  recommandedPlayers,
  User,
  UserStatus,
} from "@/types/user";
import { styled } from "@/lib/Zerostyle";
import {
  AddFriendIcon,
  BlockIcon,
  ChallengeIcon,
  CoinIcon,
  DateIcon,
  MessageIcon,
  PendingIcon,
  PersonIcon,
  SeenIcon,
  VerifiedIcon,
} from "../Svg/Svg";

import { useRouteParam } from "@/hooks/useParam";
import NotFound from "../NotFound/NotFound";
import Tournament from "../Tournament/Tournament";
import GameHistoryItem from "./GameHistoryItem";
import { Match, MatchPlayer } from "@/types/game/game";
import ConfirmationModal from "../ConfirmationModal/ConfirmationModal";
import { useAppContext } from "@/contexts/AppProviders";
import Toast from "../Toast/Toast";
import { useNavigate } from "@/contexts/RouterProvider";
import { getRankMetaData } from "@/utils/game";
import {
  blockUser,
  getUserById,
  getUserFriends,
  getUserStats,
  MiniUser,
  removeFriend,
  sendFriendRequest,
} from "@/api/user";
import Skeleton from "../Skeleton/Skeleton";
import { timeAgo } from "@/utils/time";
import { getPlayerLastMatches } from "@/api/match";
import { newConversation } from "@/api/chat";

const StyledProfileModal = styled("div")`
  height: 100%;
  width: 100%;
  overflow-y: scroll;
  background-color: var(--bg_color);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  z-index: 998;
  padding: 55px 5px;
  padding-bottom: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  .ProfileHeadline {
    font-family: var(--main_font);
    font-size: 1rem;
    margin-bottom: 5px;
    color: rgba(255,255,255, 0.8);
    text-align: left;
    opacity: 0.7;
    .ProfileHeadlineSpn {
      opacity: 0.5;
    }
  }

  .Banner {
    width: 1200px;
    background-color: var(--bg_color_light);
    border-radius: 5px;
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
    gap: 5px;
    background-image: url(${(props: { banner: string }) => props.banner});
    background-size: cover;
    background-position: center;
    padding: 3px;
    position: relative;
    margin-bottom: 50px;
    min-height: 300px;

    .ProfileDetails {
      color: white;
      z-index: 2;
      font-family: var(--main_font);
      display: flex;
      flex-direction: column;
      margin-bottom: -50px;
      gap: 5px;
      h1 {
        margin: 0;
        padding: 0;
        line-height: 0.8;
        font-size: 1.6rem;
        text-transform: uppercase;
        display: flex;
        gap: 10px;
      }
      .userName {
        color: rgba(255, 255, 255, 0.5);
      }
    }
    .Avatar {
      margin-bottom: -50px;
      margin-left: 15px;
      width: 110px;
      height: 110px;
      background-color: gray;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background-image: url(${(props: { avatar: string }) => props.avatar});
      background-size: cover;
      background-position: center;
      border-radius: 10px;
      z-index: 2;
      position: relative;
      &:after {
        content: "";
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 10px;
        height: 10px;
        background-color: ${(props: { userStatus: UserStatus }) =>
    props.userStatus === "ONLINE"
      ? "#4ade80"
      : props.userStatus === "OFFLINE"
        ? "#888888"
        : props.userStatus === "DONOTDISTURB"
          ? "#f04f4f"
          : props.userStatus === "IDLE"
            ? "#facc15"
            : "white"};

        border-radius: 10px;
      }
    }
    .ActionBtns {
      z-index: 2;
      display: flex;
      margin-left: auto;
      position: absolute;
      right: 5px;
      gap: 3px;
      .actionBtn {
        width: 45px;
        height: 45px;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        font-family: var(--main_font);
        font-weight: 400;
        color: rgba(255, 255, 255, 0.7);
        font-size: 1rem;
        cursor: pointer;
        background-color: var(--bg_color);
        border: none;
        outline: none;
        transition: 0.2s ease-in-out;
        clip-path: path("M 0,0 L 40,0 L 45,5 L 45,45 L 0,45 L 0,5 Z");
        &:not(:last-child) {
          clip-path: path("M 0,0 L 45,0 L 45,45 L 0,45 L 0,5 Z");
        }
        svg {
          transition: 0.2s ease-in-out;
        }
        &:hover {
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          svg {
            fill: white;
          }
        }
      }
      .actionBtn.AddFriendBtn {
        width: 200px;
        padding: 8px 15px;
        font-weight: 600;
        font-size: 1.1rem;
        gap: 10px;
        clip-path: path("M 0,0 L 200,0 L 200,200 L 15,45 L 0,35 L 0,0 Z");
      }
    }
    .BlockIcon {
      position: absolute;
      top: 10px;
      right: 10px;
      cursor: pointer;
      z-index: 2;
      transition: 0.2s ease-in-out;
      stroke: #f04f4fc1;
      opacity: 0.5;
      &:hover {
        opacity: 1;
      }
    }
  }

  .ProfileContainer {
    width: 1200px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
    .LeftContainer {
      width: 800px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .RightContainer {
      flex: 1;
      height: 100%;

      .Bio {
        width: 100%;
        height: 200px;
        background-color: var(--bg_color_light);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        padding: 5px;
        border: 1px solid rgba(255, 255, 255, 0.05);

        .Bio_txt {
          font-family: var(--span_font);
          font-weight: 400;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1rem;
          line-height: 1;
          margin-top: 5px;
          margin-bottom: 15px;
        }
        .BioItem {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.7);
          font-family: var(--main_font);
          font-weight: 400;
          font-size: 0.9rem;
          margin-top: 10px;
          .CoinsIcon {
            opacity: 0.5;
            filter: grayscale(1);
          }
          svg {
            fill: rgba(255, 255, 255, 0.3);
          }
        }
      }
      .Friends {
        width: 100%;
        height: 220px;
        background-color: var(--bg_color_light);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        padding: 5px;
        margin-top: 10px;
        border: 1px solid rgba(255, 255, 255, 0.05);

        .FriendsList {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          .FriendItem {
            width: 40px;
            height: 40px;
            background-color: gray;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            background-size: cover;
            background-position: center;
            position: relative;
            cursor: pointer;
            &:hover {
            }
          }
          .NoFriendsText {
            font-family: var(--span_font);
            font-weight: 400;
            color: rgba(255, 255, 255, 0.4);
            font-size: 1rem;
          }
        }
      }
    }
  }

  .BasicStats {
    width: 100%;
    display: flex;
    gap: 5px;
    font-family: var(--main_font);
    .StatEl {
      min-width: 80px;
      height: 50px;
      background-color: var(--bg_color_light);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 5px;
      gap: 5px;
      &.Rank {
        padding: 0px 20px;
        flex-direction: row;
        position: relative;
        overflow: hidden;
        flex: 1;
        &:after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            180deg,
            ${(props: any) => props.rankSecColor} 0%,
            ${(props: any) => props.rankColor} 100%
          );
          border: 2px solid ${(props: any) => props.rankSecColor};
          border-radius: 10px;
        }
        img {
          width: 30px;
          height: 30px;
          z-index: 1;
        }
        span {
          z-index: 1;
          font-family: var(--main_font);
          font-size: 1.2rem;
          white-space: nowrap;
        }
      }
      .StatElValue {
        font-size: 1.2rem;
        opacity: 0.7;
      }
    }
  }
  .MainStats {
    width: 100%;
    height: 200px;
    display: flex;
    gap: 5px;
    .MainStatsEl {
      flex: 1;
      border-radius: 10px;
      background-color: var(--bg_color_light);
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 10px;
      position: relative;
      .MainStatsElDesc {
        position: absolute;
        left: 20px;
        bottom: 5px;
        span {
          font-family: var(--main_font);
          font-weight: 600;
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.7);
          position: relative;
          display: flex;
          align-items: center;

          &:after {
            content: "";
            position: absolute;
            left: -10px;
            width: 5px;
            height: 5px;
            background-color: rgba(74, 222, 128, 0.5);
          }
        }
      }

      h2 {
        font-family: var(--main_font);
        font-weight: 600;
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.7);
        text-align: center;
      }
    }
  }
  .LastGames {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 5px;

    .NoMatchHistory {
      text-align: center;
      padding: 30px;
      color: rgba(255, 255, 255, 0.5);
      font-family: var(--span_font);
      font-size: 1rem;
    }
  }
`;
interface UserWithRelations extends User {
  relationshipStatus:
  | "NO_RELATIONSHIP"
  | "FRIENDS"
  | "REQUEST_SENT"
  | "REQUEST_RECEIVED"
  | "YOU_BLOCKED"
  | "BLOCKED_YOU";
}


const Profile = () => {
  const [profileData, setProfileData] =
    Zeroact.useState<UserWithRelations | null>(null);
  const [profileStats, setProfileStats] =
    Zeroact.useState<PlayerStats>(defaultStats);
  const [profileFriends, setProfileFriends] = Zeroact.useState<MiniUser[]>([]);
  const [matchHistory, setMatchHistory] = Zeroact.useState<Match[]>([]);
  const [isUserNotFound, setIsUserNotFound] = Zeroact.useState(false);
  const [showConfirmationModal, setShowConfirmationModal] =
    Zeroact.useState(false);
  const userId = useRouteParam("/user/:id", "id");
  const { modal, toasts, user, inviteModal, chat } = useAppContext();
  const navigate = useNavigate();

  const handleFriendAddUnfriend = async (receiverId: string) => {
    if (profileFriends.find((f) => f.username === user?.username)) {
      try {
        const resp = await removeFriend(Number(receiverId));
        if (resp.success) {
          toasts.addToastToQueue({
            type: "info",
            message: "Unfriended successfully.",
            duration: 3000,
          });
          getFriends(profileData!.username);
        } else {
          toasts.addToastToQueue({
            type: "warning",
            message: resp.message || "Failed to unfriend.",
            duration: 3000,
          });
        }
      } catch (err: any) {
        toasts.addToastToQueue({
          type: "error",
          message: err.message || "An unexpected error occurred.",
          duration: 3000,
        });
      }
    } else {
      try {
        const resp = await sendFriendRequest(Number(receiverId));

        if (resp.success) {
          toasts.addToastToQueue({
            type: "info",
            message: "Friend request sent successfully.",
            duration: 3000,
          });
        } else {
          toasts.addToastToQueue({
            type: "warning",
            message: resp.message || "Failed to send friend request.",
            duration: 3000,
          });
        }
      } catch (err: any) {
        toasts.addToastToQueue({
          type: "error",
          message: err.message || "An unexpected error occurred.",
          duration: 3000,
        });
      }
    }
  };
  const handleChallengeUser = async () => {
    if (!profileData) return;

    inviteModal.setSelectedOpponent(profileData);
    inviteModal.setIsInviteModalOpen(true);
  };
  const handleContactUser = async () => {
    if (!profileData) return
    try {
      const resp = await newConversation(profileData.userId);
      if (resp.success) {
        const conversationId = resp.data.chatId;
        if (chat.activeConversations?.includes(conversationId)) {
          return;
        }
        chat.setActiveConversations([
          ...(chat.activeConversations || []),
          conversationId,
        ]);
      }
    } catch (err) {
      console.error("Error starting new conversation:", err);
    }
  }
  const handleBlockUser = () => {
    if (!profileData) return;

    modal
      .showConfirmationModal(
        "Are you sure you want to block this user?",
        "Block User"
      )
      .then(async (confirmed) => {
        if (confirmed) {
          try {
            const resp = await blockUser(Number(profileData.userId));
            if (!resp.success) {
              throw new Error("Failed to block user");
            }
            toasts.addToastToQueue({
              message: "User has been blocked",
              type: "success",
              duration: 3000,
              key: 12344,
            });
          } catch (error) {
            toasts.addToastToQueue({
              message: "Failed to block user. Please try again later.",
              type: "error",
              duration: 3000,
              key: 12345,
            });
          }
        } else {
          toasts.addToastToQueue({
            message: "User block cancelled",
            type: "info",
            duration: 3000,
            key: 12345,
          });
        }
      });
  };
  const setUser = async (id: string) => {
    setProfileData(null);
    setTimeout(async () => {
      console.log("fetching user=>");
      const user = await getUserById(id);
      if (user.success && user.data) {
        setIsUserNotFound(false);
        setProfileData(user.data as UserWithRelations);
      } else {
        setIsUserNotFound(true);
      }
    }, 1000);
  };
  const getStats = async (id: string) => {
    try {
      const resp = await getUserStats(id);
      if (resp.success && resp.data) {
        setProfileStats(resp.data);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };
  const getFriends = async (userId: string) => {
    const resp = await getUserFriends(userId);
    if (resp.success && resp.data) {
      setProfileFriends(resp.data);
    }
  };
  const getMatchHistory = async (userId: string) => {
    try {
      const resp = await getPlayerLastMatches(userId);
      if (resp.success && resp.data) {
        setMatchHistory(resp.data);
      }
    } catch (error) {
      console.error("Error fetching match history:", error);
    }
  };
  Zeroact.useEffect(() => {
    if (userId != null) {
      setUser(userId);
      getFriends(userId);
    }
  }, [userId]);
  Zeroact.useEffect(() => {
    if (profileData) {
      getStats(profileData.userId.toString());
      getMatchHistory(profileData.userId.toString());
    }
  }, [profileData]);

  if (isUserNotFound) {
    return <NotFound />;
  }
  if (!profileData || !profileStats)
    return (
      <ProfileSkeleton>
        <Skeleton
          width="1200px"
          height="300px"
          borderRadius={5}
          animation="Shine"
        />
        <div className="Container">
          <Skeleton
            width="100%"
            height="100%"
            borderRadius={10}
            animation="Wave"
          />
          <Skeleton
            width="800px"
            height="100%"
            borderRadius={10}
            animation="hybrid"
          />
        </div>
      </ProfileSkeleton>
    );

  const rankMetadata = getRankMetaData(
    profileData.rankDivision,
    profileData.rankTier
  );

  return (
    <StyledProfileModal
      avatar={profileData.avatar}
      banner={profileData.banner}
      className="scroll-y"
      rankColor={rankMetadata?.primaryColor}
      rankSecColor={rankMetadata?.secondaryColor}
      userStatus={profileData.status}
    >
      <div className="Banner">
        <div className="BlockIcon" onClick={handleBlockUser}>
          <BlockIcon size={25} stroke="white" />
        </div>
        <div className="Avatar" />
        <div className="ProfileDetails">
          <h1 className="ProfileDetailsUserName">
            {profileData.firstName + " " + profileData.lastName}
            {profileData.isVerified && (
              <VerifiedIcon fill="var(--main_color)" size={20} />
            )}
          </h1>
          <p className="userName">@{profileData.username}</p>
        </div>

        {user?.username === profileData.username ? (
          <div className="ActionBtns">
            <button className="actionBtn AddFriendBtn"
              onClick={() => navigate("/settings/account")}
            >Settings</button>
          </div>
        ) : (
          <div className="ActionBtns">
            <button
              className="actionBtn AddFriendBtn"
              onClick={() =>
                handleFriendAddUnfriend(profileData.userId.toString())
              }
              disabled={profileData.relationshipStatus === "BLOCKED_YOU"}
            >
              {profileData.relationshipStatus === "FRIENDS"
                ? "Unfriend"
                : profileData.relationshipStatus === "REQUEST_SENT"
                  ? "Request Sent"
                  : "Add Friend"}
              {profileData.relationshipStatus === "REQUEST_SENT" ? (
                <PendingIcon size={23} fill="rgba(255, 255, 255, 0.7)" />
              ) : (
                <AddFriendIcon size={23} fill="rgba(255, 255, 255, 0.7)" />
              )}
            </button>
            <button
              className="actionBtn"
              disabled={profileData.relationshipStatus === "BLOCKED_YOU"}
              onClick={() => handleContactUser()}
            >
              <MessageIcon size={23} fill="rgba(255, 255, 255, 0.7)" />
            </button>
            <button
              className="actionBtn"
              onClick={() => handleChallengeUser()}
              disabled={profileData.relationshipStatus === "BLOCKED_YOU"}
            >
              <ChallengeIcon size={23} fill="rgba(255, 255, 255, 0.7)" />
            </button>
          </div>
        )}
      </div>

      <div className="ProfileContainer">
        <div className="LeftContainer">
          <h1 className="ProfileHeadline">stats</h1>
          <div className="BasicStats">
            <div className="StatEl Rank">
              <img
                src={rankMetadata?.image}
                alt={`${profileData.rankDivision} ${profileData.rankTier}`}
              />
              <span className="RankTier">
                {profileData.rankDivision} {profileData.rankTier}
              </span>
            </div>

            <div className="StatEl BorderBottomEffect">
              <span className="StatElName">Games</span>
              <span className="StatElValue">{profileStats.gamesPlayed}</span>
            </div>

            <div className="StatEl BorderBottomEffect">
              <span className="StatElName">won</span>
              <span className="StatElValue">{profileStats.gamesWon}</span>
            </div>

            <div className="StatEl BorderBottomEffect">
              <span className="StatElName">lost</span>
              <span className="StatElValue">{profileStats.gamesLost}</span>
            </div>

            <div className="StatEl BorderBottomEffect">
              <span className="StatElName">Win rates</span>
              <span className="StatElValue">
                {profileStats.gamesWon > 0
                  ? (
                    (profileStats.gamesWon /
                      (profileStats.gamesWon + profileStats.gamesLost)) *
                    100
                  ).toFixed(2) + "%"
                  : "0%"}
              </span>
            </div>

            <div className="StatEl BorderBottomEffect">
              <span className="StatElName">streak</span>
              <span className="StatElValue">
                {profileStats.winStreak}
              </span>
            </div>

            <div className="StatEl BorderBottomEffect">
              <span className="StatElName">Level</span>
              <span className="StatElValue">{profileData.level}</span>
            </div>

            <div className="StatEl BorderBottomEffect">
              <span className="StatElName">Rank</span>
              <span className="StatElValue">#{profileStats.rank}</span>
            </div>
          </div>

          <h1 className="ProfileHeadline">Performance</h1>

          <div className="MainStats">
            <div className="MainStatsEl BorderBottomEffect">
              <h2>1 vs 1</h2>
              {profileStats && (
                <WinLossDonut
                  winRate={
                    profileStats.played1v1 > 0
                      ? (profileStats.won1v1 / profileStats.played1v1) * 100
                      : 0
                  }
                />
              )}
              <div className="MainStatsElDesc">
                <span>win rate</span>
              </div>
            </div>

            <div className="MainStatsEl BorderBottomEffect">
              <h2>Tournament</h2>
              <WinLossDonut
                winRate={
                  profileStats.playedTournament > 0
                    ? (profileStats.wonTournament /
                      profileStats.playedTournament) *
                    100
                    : 0
                }
              />
              <div className="MainStatsElDesc">
                <span>win rate</span>
              </div>
            </div>

            <div className="MainStatsEl BorderBottomEffect">
              <h2>vs AI</h2>
              <WinLossDonut
                winRate={
                  profileStats.playedVsAI > 0
                    ? ((profileStats.easyWins +
                      profileStats.mediumWins +
                      profileStats.hardWins) /
                      profileStats.playedVsAI) *
                    100
                    : 0
                }
              />
              <div className="MainStatsElDesc">
                <span>win rate</span>
              </div>
            </div>
          </div>

          <h1 className="ProfileHeadline">Recent Games</h1>

          <div className="LastGames">
            {matchHistory.length > 0 ? (
              matchHistory.map((match) => {
                return (
                  <GameHistoryItem
                    // key={match.id}
                    match={match}
                    userId={profileData.userId}
                  />
                );
              })
            ) : (
              <div className="NoMatchHistory">No recent matches found</div>
            )}
          </div>
        </div>
        <div className="RightContainer">
          <div className="Bio">
            <h1 className="ProfileHeadline">About me</h1>
            <span className="Bio_txt">{profileData.bio}</span>

            <div className="BioItem">
              <SeenIcon fill="rgba(255,255,255,0.3)" size={25} />
              <span>
                {profileData.status === "OFFLINE"
                  ? `last seen: ${timeAgo(profileData.lastSeen)}`
                  : profileData.status}
              </span>
            </div>
            <div className="BioItem">
              <DateIcon fill="rgba(255,255,255,0.3)" size={25} />
              <span>
                Joined : {new Date(profileData.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="BioItem">
              <CoinIcon
                className="CoinsIcon"
                fill="rgba(255,255,255,0.3)"
                size={25}
              />
              <span>Coins : {profileData.walletBalance}</span>
            </div>
          </div>
          <div className="Friends">
            <h1 className="ProfileHeadline">
              Friends -{" "}
              <span className="ProfileHeadlineSpn">
                {profileFriends.length}
              </span>
            </h1>
            <div className="FriendsList">
              {profileFriends.length > 0 ? (
                profileFriends.map((friend) => {
                  return (
                    <div
                      className="FriendItem"
                      style={{ backgroundImage: `url(${friend.avatar})` }}
                      key={friend.id}
                      onClick={() => navigate(`/user/${friend.username}`)}
                      title={friend.username}
                    ></div>
                  );
                })
              ) : (
                <span className="NoFriendsText">No friends to show</span>
              )}
            </div>
          </div>

          <div className="Friends">
            <h1 className="ProfileHeadline">
              Recommended Players -{" "}
              <span className="ProfileHeadlineSpn">
                {recommandedPlayers.length}
              </span>
            </h1>
            <div className="FriendsList">
              {recommandedPlayers.map((p) => (
                <div
                  className="FriendItem"
                  style={{ backgroundImage: `url(${p.avatar})` }}
                  key={p.id}
                  onClick={() => navigate(`/user/${p.nickname}`)}
                  title={p.nickname}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StyledProfileModal>
  );
};

const StyledDonutChart = styled("div")`
  width: 135px;
  height: 135px;
  border-radius: 50%;
  background: ${(props: any) =>
    `conic-gradient(
      var(--color-win, rgba(74, 222, 128, 0.9)) ${props.winRate * 2.6}deg,
      var(--bg_color) ${props.winRate * 3.6}deg 360deg
    )`};
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: "";
    position: absolute;
    width: 130px;
    height: 130px;
    background: var(--bg_color_light);
    border-radius: 50%;
    z-index: 1;
  }

  &::after {
    content: "${(props: any) => props.winRate.toFixed(0)}%";
    position: absolute;
    color: white;
    z-index: 2;
    font-size: 1.3rem;
    font-family: var(--main_font);
  }
`;

export function WinLossDonut(props: { winRate: number }) {
  const [winRT, setWinRate] = useState(props.winRate || 0);
  useEffect(() => {
    if (props.winRate) {
      console.log(winRT);
      setWinRate(winRT);
    }
  }, [props]);
  return <StyledDonutChart winRate={winRT} />;
}

const ProfileSkeleton = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 55px;
  gap: 10px;
  .Container {
    width: 1200px;
    height: 100%;
    display: flex;
    gap: 20px;
  }
`;

export default Profile;

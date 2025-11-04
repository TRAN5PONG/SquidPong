import Zeroact, { useEffect } from "@/lib/Zeroact";
import { User, UserStatus } from "@/types/user";
import { styled } from "@/lib/Zerostyle";
import {
  AddFriendIcon,
  BlockIcon,
  ChallengeIcon,
  CoinIcon,
  DateIcon,
  MessageIcon,
  SeenIcon,
  VerifiedIcon,
} from "../Svg/Svg";

import { db } from "@/db";
import { useRouteParam } from "@/hooks/useParam";
import NotFound from "../NotFound/NotFound";
import Tournament from "../Tournament/Tournament";
import GameHistoryItem from "./GameHistoryItem";
import { Match } from "@/types/game/game";
import ConfirmationModal from "../ConfirmationModal/ConfirmationModal";
import { useAppContext } from "@/contexts/AppProviders";
import Toast from "../Toast/Toast";
import { useNavigate } from "@/contexts/RouterProvider";
import { getRankMetaData } from "@/utils/game";
import { getUserById, getUserFriends, MiniUser } from "@/api/user";
import Skeleton from "../Skeleton/Skeleton";

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
    font-family: var(--span_font);
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 5px;
    color: white;
    text-align: left;
    opacity: 0.7;
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
        color: rgba(255, 255, 255, 0.8);
      }
      .Bio {
        color: rgba(255, 255, 255, 0.6);
        margin-top: 10px;
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
          props.userStatus === "online"
            ? "#4ade80"
            : props.userStatus === "offline"
            ? "#888888"
            : props.userStatus === "doNotDisturb"
            ? "#f04f4f"
            : props.userStatus === "idle"
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
        background-color: #505e7f;
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
          background-color: #7086bb;
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
        background-color: #505e7f;
        gap: 10px;
        clip-path: path("M 0,0 L 200,0 L 200,200 L 15,45 L 0,35 L 0,0 Z");
        &:hover {
          background-color: #7086bb;
        }
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
          font-family: var(--main_font);
          font-weight: 400;
          color: rgba(255, 255, 255, 0.8);
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
            font-family: var(--main_font);
            font-weight: 400;
            color: rgba(255, 255, 255, 0.6);
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
          font-family: var(--span_font);
          font-weight: 600;
          font-size: 1.2rem;
        }
      }
      .StatElValue {
        font-weight: 600;
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
          font-family: var(--span_font);
          font-weight: 600;
          font-size: 0.8rem;
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
        font-family: var(--span_font);
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
  }
`;
const Profile = () => {
  const [profileData, setProfileData] = Zeroact.useState<User | null>(null);
  const [profileStats, setProfileStats] = Zeroact.useState<any>(null);
  const [profileFriends, setProfileFriends] = Zeroact.useState<MiniUser[]>([]);
  const [isUserNotFound, setIsUserNotFound] = Zeroact.useState(false);
  const [showConfirmationModal, setShowConfirmationModal] =
    Zeroact.useState(false);
  const userId = useRouteParam("/user/:id", "id");
  const { modal, toasts } = useAppContext();
  const navigate = useNavigate();

  const handleBlockUser = () => {
    console.log("Block user clicked");

    modal
      .showConfirmationModal(
        "Are you sure you want to block this user?",
        "Block User"
      )
      .then((confirmed) => {
        if (confirmed) {
          toasts.addToastToQueue({
            message: "User has been blocked",
            type: "success",
            duration: 3000,
            key: 12344,
          });
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
    console.log("reachs");
    const user = await getUserById(id);
    if (user.success && user.data) {
      setProfileData(user.data);
    } else {
      setIsUserNotFound(true);
    }
  };
  const getStats = async (id: string) => {
    const fakeUserStats = {
      gamesPlayed: 120,
      gamesWon: 75,
      gamesLost: 45,
      winStreak: 5,
      loseStreak: 0,
      rank: 250,
      tournamentsPlayed: 20,
      tournamentsWon: 12,
    };
    setProfileStats(fakeUserStats);
  };
  const getFriends = async () => {
    const resp = await getUserFriends();
    if (resp.success && resp.data) {
      setProfileFriends(resp.data);
    }
  };
  Zeroact.useEffect(() => {
    if (userId != null) {
      setUser(userId);
      getStats(userId);
      getFriends();
    }
  }, [userId]);

  if (isUserNotFound) {
    console.log("User not found");
    return <NotFound />;
  }
  if (!profileData)
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

        <div className="ActionBtns">
          <button className="actionBtn AddFriendBtn">
            Add friend
            <AddFriendIcon size={23} fill="rgba(255, 255, 255, 0.7)" />
          </button>
          <button className="actionBtn">
            <MessageIcon size={23} fill="rgba(255, 255, 255, 0.7)" />
          </button>
          <button className="actionBtn">
            <ChallengeIcon size={23} fill="rgba(255, 255, 255, 0.7)" />
          </button>
        </div>
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
                {profileStats.winStreak > 0
                  ? profileStats.winStreak + " wins"
                  : profileStats.loseStreak + " losses"}
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
              <WinLossDonut
                winRate={
                  (profileStats.gamesWon / (profileStats.gamesPlayed || 1)) *
                  100
                }
              />

              <div className="MainStatsElDesc">
                <span>win rate</span>
              </div>
            </div>

            <div className="MainStatsEl BorderBottomEffect">
              <h2>Tournament</h2>
              <WinLossDonut
                winRate={
                  (profileStats.tournamentsWon /
                    (profileStats.tournamentsPlayed || 1)) *
                  100
                }
              />
              <div className="MainStatsElDesc">
                <span>win rate</span>
              </div>
            </div>

            <div className="MainStatsEl BorderBottomEffect">
              <h2>vs AI</h2>
              <WinLossDonut winRate={50} />
              <div className="MainStatsElDesc">
                <span>win rate</span>
              </div>
            </div>
          </div>

          <h1 className="ProfileHeadline">Recent Games</h1>

          <div className="LastGames">
            {db.MatchHistoryItems.map((Match: Match) => {
              return <GameHistoryItem match={Match} userId={userId!} />;
            })}
          </div>
        </div>
        <div className="RightContainer">
          <div className="Bio">
            <h1 className="ProfileHeadline">About me</h1>
            <span className="Bio_txt">{profileData.bio}</span>

            <div className="BioItem">
              <SeenIcon fill="rgba(255,255,255,0.3)" size={25} />
              <span>Last seen : 3H ago</span>
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
            <h1 className="ProfileHeadline">Friends</h1>
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
    font-weight: bold;
    z-index: 2;
    font-size: 1.2rem;
    font-family: var(--span_font);
  }
`;

export function WinLossDonut({ winRate }: { winRate: number }) {
  return <StyledDonutChart winRate={winRate} />;
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

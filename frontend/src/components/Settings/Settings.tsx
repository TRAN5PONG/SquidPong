import { db } from "@/db";
import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { User, UserPreferences } from "@/types/user";
import {
  BackIcon,
  DeleteIcon,
  EditIcon,
  FriendsIcon,
  PasswordIcon,
  PersonIcon,
  PreferencesIcon,
  SaveIcon,
  VerifiedIcon,
} from "../Svg/Svg";
import { useRouteParam } from "@/hooks/useParam";
import NotFound from "../NotFound/NotFound";
import { LoaderSpinner } from "../Loader/Loader";
import { useNavigate } from "@/contexts/RouterProvider";
import { useAppContext } from "@/contexts/AppProviders";
import TwoFAModal from "./twoFA";
import {
  acceptFriendRequest,
  MiniUser,
  getPendingFriendRequests,
  rejectFriendRequest,
  changeAvatar,
  updateProfile,
  getBlockedUsers,
  unblockUser,
} from "@/api/user";

const StyledSettings = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 70px 20%;
  overflow-y: scroll;
  .Banner {
    width: 100%;
    min-height: 250px;
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
    .ProfileDetails {
      color: white;
      z-index: 2;
      font-family: var(--main_font);
      display: flex;
      flex-direction: column;
      margin-bottom: -55px;
      h1 {
        margin: 0;
        padding: 0;
        line-height: 0.8;
        font-size: 1.6rem;
        text-transform: uppercase;
        display: flex;
        gap: 10px;
      }
    }
    .EditIcon {
      position: absolute;
      bottom: 5px;
      right: 5px;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      &:hover {
        stroke: rgba(255, 255, 255, 0.8);
      }
    }
    .Avatar {
      margin-bottom: -55px;
      margin-left: 15px;
      width: 110px;
      height: 110px;
      background-color: gray;
      background-image: url(${(props: { avatar: string }) => props.avatar});
      background-size: cover;
      background-position: center;
      border-radius: 10px;
      z-index: 2;
      position: relative;
    }
  }
  .Container {
    min-height: 100vh;
    width: 100%;
    padding-top: 20px;
    display: flex;
    gap: 10px;
    flex-direction: row;
    .LeftSide {
      width: 300px;
      height: 100%;
      padding: 5px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      background-color: var(--bg_color_light);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 5px;
      .Item {
        width: 100%;
        height: 40px;
        background-color: var(--bg_color_super_light);
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 10px;
        padding: 0 10px;
        border-radius: 3px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        cursor: pointer;
        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          svg {
            fill: white;
          }
          span {
            color: white;
          }
        }
        &.active {
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.11);
          svg {
            fill: white;
          }
          span {
            color: white;
          }
        }
        span {
          color: rgba(255, 255, 255, 0.5);
          font-family: var(--main_font);
          font-size: 1.1rem;
        }
      }
    }
    .RightSide {
      flex: 1;
      background-color: var(--bg_color_light);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 5px;
      .Spliter {
        width: 100%;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding: 0 20px;
        font-family: var(--span_font);
        font-size: 1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 10px;
        text-transform: uppercase;
        background: linear-gradient(
          to right,
          rgba(255, 255, 255, 0.03) 0%,
          rgba(255, 255, 255, 0) 50%,
          rgba(255, 255, 255, 0) 100%
        );
      }
    }
  }

  .ProfileData {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    padding: 10px;

    .ProfileDataItem {
      display: flex;
      justify-content: flex-start;
      align-items: center;

      .textInput {
        width: 100%;
        height: 38px;
        border: none;
        border-radius: 5px;
        font-family: var(--main_font);
        background-color: var(--bg_color_super_light);
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.3);
        font-size: 1rem;
        padding: 5px;
        outline: none;
        transition: all 0.2s ease-in-out;
        &:valid {
          &:focus {
            border: 1px solid var(--green_color);
          }
        }
        &:invalid {
          border: 1px solid var(--red_color);
          &:focus {
            border: 1px solid var(--red_color);
          }
        }
      }

      .ProfileDataItemText {
        color: rgba(255, 255, 255, 0.8);
        font-family: var(--main_font);
        font-size: 1rem;
        margin-right: 10px;
        font-weight: 100;
        width: 180px;
      }
    }
    .ProfileDataActions {
      display: flex;
      justify-content: flex-end;
      margin-top: auto;
      gap: 5px;
      button {
        padding: 10px 15px;
        border-radius: 5px;
        border: none;
        outline: none;
        font-family: var(--main_font);
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        display: flex;
        gap: 5px;
        align-items: center;
        justify-content: center;
      }

      .SaveChangesBtn {
        height: 40px;
        background-color: transparent;
        color: rgba(116, 218, 116, 0.5);
        border: 1px solid rgba(116, 218, 116, 0.3);
        &:hover {
          background-color: rgba(116, 218, 116, 0.05);
        }
      }
    }
    .ErrorSpn {
      color: var(--red_color);
      font-family: var(--main_font);
      font-size: 1rem;
      margin-top: 5px;
    }
  }
  .Preferences_Container {
    .PrefElement {
      width: 100%;
      height: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: var(--main_font);
      font-size: 1rem;
      font-weight: 100;
      padding: 0 20px;
      color: rgba(255, 255, 255, 0.6);
    }
  }
  .Privacy_Container {
    .ChangePassword {
      width: 200px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: var(--main_font);
      font-size: 1rem;
      font-weight: 100;
      padding: 0 20px;
      color: rgba(255, 255, 255, 0.6);
      background-color: var(--bg_color_super_light);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 5px;
      outline: none;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      margin-bottom: 10px;
      margin-left: 20px;

      &:hover {
        background-color: rgba(255, 255, 255, 0.05);
        color: white;
      }
    }
    .DeleteBtn {
      width: 200px;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: var(--main_font);
      font-size: 1rem;
      font-weight: 100;
      padding: 0 20px;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      margin-left: 20px;
      background-color: rgba(202, 47, 60, 0.2);
      border: 1px solid rgba(202, 47, 60, 0.3);
      color: rgba(202, 47, 60, 0.6);
      border-radius: 5px;
      gap: 5px;
      svg {
        transition: all 0.2s ease-in-out;
      }

      &:hover {
        background-color: rgba(202, 47, 60, 0.3);
        svg {
          fill: rgba(202, 47, 60, 0.8);
        }
      }
    }
  }
  .BlockedUsers_container {
    display: flex;
    flex-direction: column;

    .blockedUsersList {
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 20px;
      .blockedUserItem {
        width: 100%;
        height: 50px;
        background-color: var(--bg_color_super_light);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 5px;
        display: flex;
        align-items: center;
        padding-left: 2px;
        justify-content: flex-start;
        .userAvatar {
          width: 45px;
          height: 45px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          background-position: center;
          background-size: cover;
        }
        span {
          color: rgba(255, 255, 255, 0.8);
          font-family: var(--main_font);
          font-size: 1rem;
          margin-left: 10px;
        }
        .unblockBtn {
          width: 120px;
          height: 40px;
          background-color: rgba(255, 255, 255, 0.1);
          border: none;
          outline: none;
          color: rgba(255, 255, 255, 0.6);
          font-family: var(--main_font);
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          display: flex;
          margin-left: auto;
          margin-right: 5px;
          gap: 5px;
          border-radius: 4px;

          &:hover {
            color: white;
            svg {
              fill: white;
            }
          }
        }
      }
      .NoneSPN {
        color: rgba(255, 255, 255, 0.6);
        font-family: var(--main_font);
        font-size: 1rem;
      }
    }
  }
  .FriendRequests_container {
    display: flex;
    flex-direction: column;

    .RequestsFilter {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
      padding: 0 10px;
      .FilterItem {
        padding: 10px 15px;
        border-radius: 5px;
        background-color: var(--bg_color_super_light);
        color: rgba(255, 255, 255, 0.6);
        font-family: var(--main_font);
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;

        svg {
        }

        &.active {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
        }

        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: white;
        }
      }
      .FilterItem:nth-child(1) {
        svg {
          transform: rotate(180deg);
          transform: scaleX(-1);
        }
      }
    }
    .friendRequestsList {
      .list {
        display: flex;
        flex-direction: column;
        gap: 5px;
        padding: 10px;
        .NoElsSpan {
          color: rgba(255, 255, 255, 0.6);
          font-family: var(--main_font);
          font-size: 1rem;
        }

        .friendRequestItem {
          width: 100%;
          height: 50px;
          background-color: var(--bg_color_super_light);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 5px;
          display: flex;
          align-items: center;
          padding-left: 2px;
          justify-content: flex-start;
          .userAvatar {
            width: 45px;
            height: 45px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            background-position: center;
            background-size: cover;
          }
          span {
            color: rgba(255, 255, 255, 0.8);
            font-family: var(--main_font);
            font-size: 1rem;
            margin-left: 10px;
          }
          .cancelRequestBtn {
            margin-left: auto;
            margin-right: 5px;
            width: 140px;
            height: 40px;
            background-color: rgba(255, 255, 255, 0.1);
            border: none;
            outline: none;
            color: rgba(255, 255, 255, 0.6);
            font-family: var(--main_font);
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            border-radius: 4px;

            &:hover {
              color: white;
            }
          }
          .rejectRequestBtn {
            margin-left: auto;
            width: 100px;
            height: 40px;
            background-color: rgba(255, 255, 255, 0.1);
            border: none;
            outline: none;
            color: rgba(255, 255, 255, 0.6);
            font-family: var(--main_font);
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            border-radius: 4px;
            margin-right: 5px;

            &:hover {
              color: white;
            }
          }
          .acceptRequestBtn {
            width: 100px;
            height: 40px;
            background-color: rgba(116, 218, 116, 0.2);
            border: none;
            outline: none;
            color: rgba(116, 218, 116, 0.6);
            font-family: var(--main_font);
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            border-radius: 4px;
            margin-right: 5px;

            &:hover {
              background-color: rgba(116, 218, 116, 0.3);
              color: white;
            }
          }
        }
      }
    }
  }
`;

type SettingsMod =
  | "account"
  | "preferences"
  | "friendRequests"
  | "privacy"
  | "BlockedUsers"
  | "404";
const Settings = () => {
  const [profileData, setProfileData] = Zeroact.useState<User | null>(null);
  const [Error, setError] = Zeroact.useState<string>("");
  const [currentMod, setCurrentMod] = Zeroact.useState<SettingsMod | null>(
    null
  );
  const [currentCurrentFRMod, setCurrentFRMod] = Zeroact.useState<
    "sent" | "received"
  >("sent");
  const [sentFriendRequests, setSentFriendRequests] = Zeroact.useState<
    MiniUser[]
  >([]);
  const [receivedFriendRequests, setReceivedFriendRequests] = Zeroact.useState<
    MiniUser[]
  >([]);
  const [blockedUsers, setBlockedUsers] = Zeroact.useState<MiniUser[]>([]);
  const [Preferences, setPreferences] = Zeroact.useState<UserPreferences>(
    db.FakeUserPreferences
  );
  const [showTwoFAModal, setShowTwoFAModal] = Zeroact.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modName = useRouteParam("/settings/:key", "key");
  const navigate = useNavigate();
  const { modal, toasts, user } = useAppContext();

  useEffect(() => {
    if (modName === undefined) return;
    if (modName === "account") {
      setCurrentMod("account");
    } else if (modName === "preferences") {
      setCurrentMod("preferences");
    } else if (modName === "privacy") {
      setCurrentMod("privacy");
    } else if (modName === "friendRequests") {
      setCurrentMod("friendRequests");
      fetchFriendRequests();
    } else if (modName === "blocked_users") {
      setCurrentMod("BlockedUsers");
      fetchBlockedUsers();
    } else {
      setCurrentMod("404");
    }
  }, [modName]);

  const onProfileDataChange = (data: User) => {
    modal
      .showConfirmationModal(
        "Are you sure you want to save changes?",
        "Save Changes"
      )
      .then(async (confirmed) => {
        if (confirmed) {
          try {
            const resp = await updateProfile({
              firstName: data.firstName,
              lastName: data.lastName,
              username: data.username,
              bio: data.bio,
              banner: data.banner,
            });
            if (resp.success) {
              toasts.addToastToQueue({
                type: "success",
                message: "Profile data updated successfully!",
              });
            } else {
              toasts.addToastToQueue({
                type: "error",
                message:
                  resp.message ||
                  "An error occurred while updating profile data.",
              });
            }
          } catch (err: any) {
            toasts.addToastToQueue({
              type: "error",
              message:
                err.message || "An error occurred while updating profile data.",
            });
            return;
          }
        } else
          toasts.addToastToQueue({
            type: "info",
            message: "Profile data update cancelled.",
          });
      });
  };
  const onInputChange = (field: string, value: string) => {
    if (!user) return;
    const updatedUser = { ...user, [field]: value };
    setProfileData(updatedUser);
  };
  const onDeleteAccount = () => {
    modal
      .showConfirmationModal(
        "Are you sure you want to delete your account? This action cannot be undone.",
        "Delete Account"
      )
      .then((confirmed) => {
        if (confirmed) {
          // Logic to delete account goes here
          toasts.addToastToQueue({
            type: "success",
            message: "Account deleted successfully!",
          });
          navigate("/"); // Redirect to home or login page after deletion
        } else {
          toasts.addToastToQueue({
            type: "error",
            message: "Account deletion cancelled.",
          });
        }
      });
  };
  const onTwoFAToggle = () => {
    if (Preferences.twoFactorEnabled) {
      toasts.addToastToQueue({
        type: "success",
        message: "Two-factor already enabled.",
      });
    } else {
      setShowTwoFAModal(true);
    }
  };

  // Fetches
  const fetchFriendRequests = async () => {
    const resp = await getPendingFriendRequests();

    if (resp.success && resp.data) {
      if (resp.data.received.length > 0) {
        setReceivedFriendRequests(resp.data.received);
      } else setReceivedFriendRequests([]);
      if (resp.data.sent.length > 0) {
        setSentFriendRequests(resp.data.sent);
      } else setSentFriendRequests([]);
    }
  };
  const fetchBlockedUsers = async () => {
    try {
      const resp = await getBlockedUsers();
      if (resp.success && resp.data) {
        setBlockedUsers(resp.data);
      } else {
        setBlockedUsers([]);
      }
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message:
          err.message || "An error occurred while fetching blocked users.",
      });
    }
  };
  const handleAcceptFriendRequest = async (friendId: number) => {
    const resp = await acceptFriendRequest(friendId);

    if (resp.success) {
      toasts.addToastToQueue({
        type: "success",
        message: "Friend request accepted!",
      });
      fetchFriendRequests();
    } else {
      toasts.addToastToQueue({
        type: "error",
        message: resp.message || "Failed to accept friend request.",
      });
    }
  };
  const handleRejectFriendRequest = async (friendId: number) => {
    const resp = await rejectFriendRequest(friendId);

    if (resp.success) {
      toasts.addToastToQueue({
        type: "success",
        message: "Friend request rejected!",
      });
      fetchFriendRequests();
    } else {
      toasts.addToastToQueue({
        type: "error",
        message: resp.message || "Failed to reject friend request.",
      });
    }
  };
  const handleUnblockUser = async (userId: number) => {
    try {
      const resp = await unblockUser(userId);
      if (resp.success) {
        toasts.addToastToQueue({
          type: "success",
          message: "User unblocked successfully!",
        });
        fetchBlockedUsers();
      } else {
        toasts.addToastToQueue({
          type: "error",
          message: resp.message || "Failed to unblock user.",
        });
      }
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message: err.message || "An error occurred while unblocking user.",
      });
    }
  };
  // Avatar upload handler
  const handleAvatarUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setProfileData((prevData) =>
          prevData ? { ...prevData, avatar: base64data } : prevData
        );
      };
      reader.readAsDataURL(file);

      const upAvatar = await changeAvatar(file);
      if (upAvatar.success) {
        toasts.addToastToQueue({
          type: "success",
          message: "Avatar updated successfully!",
        });
      } else {
        toasts.addToastToQueue({
          type: "error",
          message: upAvatar.message || "Failed to update avatar.",
        });
      }
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message: err.message || "An error occurred while uploading avatar.",
      });
    }
  };

  useEffect(() => {
    setProfileData(user);
  }, [user]);

  if (currentMod === "404") return <NotFound />;
  if (!currentMod || !profileData) return <LoaderSpinner />;

  return (
    <StyledSettings
      avatar={profileData.avatar}
      banner={profileData.banner}
      className="scroll-y"
    >
      <div className="Banner">
        <div className="Avatar">
          <a onClick={() => fileInputRef.current?.click()}>
            <EditIcon stroke="white" size={20} className="EditIcon" />
          </a>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                handleAvatarUpload(file);
              }
            }}
          />
        </div>
        <div className="ProfileDetails">
          <h1 className="ProfileDetailsUserName">
            {profileData.firstName + " " + profileData.lastName}
            {profileData.isVerified && (
              <VerifiedIcon fill="var(--main_color)" size={20} />
            )}
          </h1>
          <p>@{profileData.username}</p>
        </div>
      </div>

      <div className="Container">
        <div className="LeftSide">
          <div
            className={`Item ${currentMod === "account" ? "active" : ""}`}
            onClick={() => navigate("/settings/account")}
          >
            <PersonIcon size={20} fill="rgba(255, 255, 255, 0.5)" />
            <span>Account</span>
          </div>
          <div
            className={`Item ${currentMod === "BlockedUsers" ? "active" : ""}`}
            onClick={() => navigate("/settings/blocked_users")}
          >
            <PersonIcon size={20} fill="rgba(255, 255, 255, 0.5)" />
            <span>Blocked users</span>
          </div>
          <div
            className={`Item ${
              currentMod === "friendRequests" ? "active" : ""
            }`}
            onClick={() => navigate("/settings/friendRequests")}
          >
            <FriendsIcon size={20} fill="rgba(255, 255, 255, 0.5)" />
            <span>Friend Requests</span>
          </div>
          <div
            className={`Item ${currentMod === "preferences" ? "active" : ""}`}
            onClick={() => navigate("/settings/preferences")}
          >
            <PreferencesIcon
              size={20}
              fill="rgba(255, 255, 255, 0.5)"
              stroke="rgba(255, 255, 255, 0.5)"
            />
            <span>Preferences</span>
          </div>
          <div
            className={`Item ${currentMod === "privacy" ? "active" : ""}`}
            onClick={() => navigate("/settings/privacy")}
          >
            <PasswordIcon size={20} stroke="rgba(255, 255, 255, 0.5)" />
            <span>Privacy</span>
          </div>
        </div>
        <div className="RightSide">
          {currentMod === "account" ? (
            <div className="ProfileData" key="profileData">
              <div className="ProfileDataItem">
                <h2 className="ProfileDataItemText">First name :</h2>
                <input
                  className="textInput"
                  type="text"
                  value={profileData.firstName}
                  onChange={(e: any) => {
                    onInputChange("firstName", e.currentTarget.value);
                    setError(
                      e.currentTarget.validity.valid
                        ? ""
                        : "First name: " + e.currentTarget.validationMessage
                    );
                  }}
                  maxLength={15}
                  minLength={2}
                />
              </div>
              <div className="ProfileDataItem">
                <h2 className="ProfileDataItemText">Last name :</h2>
                <input
                  className="textInput"
                  type="text"
                  value={profileData.lastName}
                  onChange={(e: any) => {
                    onInputChange("lastName", e.currentTarget.value);
                    setError(
                      e.currentTarget.validity.valid
                        ? ""
                        : "Last name: " + e.currentTarget.validationMessage
                    );
                  }}
                  maxLength={15}
                  minLength={2}
                />
              </div>
              <div className="ProfileDataItem">
                <h2 className="ProfileDataItemText">username :</h2>
                <input
                  className="textInput"
                  type="text"
                  value={profileData.username}
                  onChange={(e: any) => {
                    onInputChange("username", e.currentTarget.value);
                    setError(
                      e.currentTarget.validity.valid
                        ? ""
                        : "Username: " + e.currentTarget.validationMessage
                    );
                  }}
                  maxLength={15}
                  minLength={3}
                />
              </div>
              <div className="ProfileDataItem">
                <h2 className="ProfileDataItemText">Banner URL :</h2>
                <input
                  className="textInput"
                  type="text"
                  value={profileData.banner}
                  onChange={(e: any) => {
                    onInputChange("banner", e.currentTarget.value);
                    setError(
                      e.currentTarget.validity.valid
                        ? ""
                        : "Banner URL: " + e.currentTarget.validationMessage
                    );
                  }}
                  maxLength={200}
                  pattern="https?:\/\/.*\.(jpg|jpeg|png|webp|gif)$"
                />
              </div>
              <div className="ProfileDataItem">
                <h2 className="ProfileDataItemText">Bio :</h2>
                <textarea
                  className="textInput"
                  style={{ height: "100px", resize: "vertical" }}
                  value={profileData.bio}
                  onChange={(e: any) => {
                    onInputChange("bio", e.currentTarget.value);
                    setError(
                      e.currentTarget.validity.valid
                        ? ""
                        : "Bio: " + e.currentTarget.validationMessage
                    );
                  }}
                  maxLength={160}
                >
                  {profileData.bio}
                </textarea>
              </div>
              <span className="ErrorSpn">{Error}</span>

              <div className="ProfileDataActions">
                <button
                  className="SaveChangesBtn"
                  onClick={() => onProfileDataChange(profileData)}
                >
                  <SaveIcon fill="rgba(116, 218, 116, 0.2)" size={20} />
                  Save Changes
                </button>
              </div>
            </div>
          ) : currentMod === "preferences" ? (
            <div className="Preferences_Container" key="preferences">
              <span className="Spliter">sound</span>
              <div className="PrefElement">
                <span>Enable Game Sounds</span>
                <PrefToggle
                  enabled={Preferences.soundEnabled}
                  onClick={() => {}}
                />
              </div>
              <div className="PrefElement">
                <span>Enable Background Music</span>
                <PrefToggle
                  enabled={Preferences.musicEnabled}
                  onClick={() => {
                    // Implement background music toggle logic here
                  }}
                />
              </div>

              <span className="Spliter">notifications</span>
              <div className="PrefElement">
                <span>Enable Notifications</span>
                <PrefToggle
                  enabled={Preferences.notifications.friendRequests}
                  onClick={() => {}}
                />
              </div>
              <div className="PrefElement">
                <span>Chat Messages</span>
                <PrefToggle
                  enabled={Preferences.notifications.chatMessages}
                  onClick={() => {}}
                />
              </div>
              <div className="PrefElement">
                <span>Game Invites</span>
                <PrefToggle
                  enabled={Preferences.notifications.gameInvites}
                  onClick={() => {}}
                />
              </div>
              <div className="PrefElement">
                <span>Tournament Updates</span>
                <PrefToggle
                  enabled={Preferences.notifications.tournamentUpdates}
                  onClick={() => {}}
                />
              </div>

              <span className="Spliter">security</span>
              <div className="PrefElement" onClick={() => {}}>
                <span>Enable two factor authentication</span>
                <PrefToggle
                  enabled={false}
                  onClick={() => {
                    onTwoFAToggle();
                  }}
                />
              </div>
            </div>
          ) : currentMod === "privacy" ? (
            <div className="Privacy_Container" key="privacy">
              <span className="Spliter">Password Management</span>
              <button className="ChangePassword">
                <span>change password</span>
              </button>

              <span className="Spliter">Account Management</span>
              <button className="DeleteBtn" onClick={onDeleteAccount}>
                <DeleteIcon size={20} fill="rgba(202, 47, 60, 0.5)" />
                Delete Account
              </button>
            </div>
          ) : currentMod === "BlockedUsers" ? (
            <div className="BlockedUsers_container" key="blockedUsers">
              <span className="Spliter">Blocked users :</span>
              <div className="blockedUsersList">
                {blockedUsers.length > 0 ? (
                  blockedUsers.map((user) => (
                    <div className="blockedUserItem" key={user.id}>
                      <div
                        className="userAvatar"
                        style={{ backgroundImage: `url(${user.avatar})` }}
                      />
                      <span>{user.username}</span>

                      <buttn
                        className="unblockBtn"
                        onClick={() => handleUnblockUser(user.userId)}
                      >
                        unblock
                        <DeleteIcon size={16} fill="rgba(255, 255, 255, 0.5)" />
                      </buttn>
                    </div>
                  ))
                ) : (
                  <span className="NoneSPN">No blocked users.</span>
                )}
              </div>
            </div>
          ) : currentMod === "friendRequests" ? (
            <div className="FriendRequests_container" key="friendRequests">
              <span className="Spliter">Friend Requests :</span>
              <div className="RequestsFilter">
                <div
                  className={`FilterItem ${
                    currentCurrentFRMod === "sent" ? "active" : ""
                  }`}
                  onClick={() => setCurrentFRMod("sent")}
                >
                  <BackIcon size={25} fill="rgba(255, 255, 255, 0.5)" />
                  Sent requests
                </div>
                <div
                  className={`FilterItem ${
                    currentCurrentFRMod === "received" ? "active" : ""
                  }`}
                  onClick={() => setCurrentFRMod("received")}
                >
                  <BackIcon size={25} fill="rgba(255, 255, 255, 0.5)" />
                  Received requests
                </div>
              </div>
              <div className="friendRequestsList">
                {currentCurrentFRMod === "sent" ? (
                  <div className="sentRequests list">
                    {sentFriendRequests.length > 0 ? (
                      sentFriendRequests.map((user) => (
                        <div className="friendRequestItem" key={user.id}>
                          <div
                            className="userAvatar"
                            style={{ backgroundImage: `url(${user.avatar})` }}
                          />
                          <span>{user.username}</span>
                          <button
                            className="cancelRequestBtn"
                            onClick={() => {}}
                          >
                            Cancel Request
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="NoElsSpan">No sent friend requests</span>
                    )}
                  </div>
                ) : (
                  <div className="receivedRequests list">
                    {receivedFriendRequests.length > 0 ? (
                      receivedFriendRequests.map((user) => (
                        <div className="friendRequestItem" key={user.id}>
                          <div
                            className="userAvatar"
                            style={{ backgroundImage: `url(${user.avatar})` }}
                          />
                          <span>{user.username}</span>
                          <button
                            className="rejectRequestBtn"
                            onClick={() => {
                              handleRejectFriendRequest(user.userId);
                            }}
                          >
                            Reject
                          </button>
                          <button
                            className="acceptRequestBtn"
                            onClick={() => {
                              handleAcceptFriendRequest(user.userId);
                            }}
                          >
                            Accept
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="NoElsSpan">
                        No received friend requests
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>

      {showTwoFAModal && (
        <TwoFAModal
          onClose={() => {
            setShowTwoFAModal(false);
          }}
        />
      )}
    </StyledSettings>
  );
};

const StyledPrefToggle = styled("div")`
  width: 45px;
  height: 24px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  background-color: var(--bg_color_super_light);
  border: 1px solid rgba(255, 255, 255, 0.1);

  .slider {
    position: absolute;
    width: 20px;
    height: 20px;
    top: 1px;
    background-color: ${(props: { isEnabled: boolean }) =>
      props.isEnabled ? "rgb(116, 218, 116)" : "rgba(255,255,255, 0.1)"};
    border-radius: 50%;
    transition: transform 0.3s ease-in-out;
    transform: ${(props: { isEnabled: boolean }) =>
      props.isEnabled ? "translateX(22px)" : "translateX(1px)"};
  }
`;
interface PrefToggleProps {
  enabled: boolean;
  onClick: () => void;
}
const PrefToggle = (props: PrefToggleProps) => {
  const [enabled, setEnabled] = useState(props.enabled);

  return (
    <StyledPrefToggle isEnabled={enabled} onClick={() => props.onClick()}>
      <span className="slider"></span>
    </StyledPrefToggle>
  );
};

export default Settings;

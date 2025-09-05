import {
  PersonIcon,
  PreferencesIcon,
  SettingsIcon,
  SignOutIcon,
} from "@/components/Svg/Svg";
import { useNavigate } from "@/contexts/RouterProvider";
import Zeroact, { useEffect, useRef } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { UserPreferences, UserStatus } from "@/types/user";
import Status from "../Status";

const StyledSettingsModal = styled("div")`
  width: 200px;
  height: 250px;
  position: absolute;
  background-color: var(--bg_color);
  top: 55px;
  right: 80px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  .ProfileElement {
    width: 100%;
    height: 40px;
    display: flex;
    color: white;
    align-items: center;
    justify-content: flex-start;
    gap: 5px;
    font-family: var(--main_font);
    padding: 5px;
    cursor: pointer;
    .ProfileElementIcon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
    }
    .ProfileStatus {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: ${(props: { userStatus: UserStatus }) =>
        props.userStatus === "online"
          ? "var(--green_color)"
          : props.userStatus === "doNotDisturb"
          ? "var(--red_color)"
          : props.userStatus === "idle"
          ? "var(--yellow_color)"
          : "var(--gray_color)"};
    }

    &:hover {
      background-color: var(--bg_color_super_light);
    }
  }
  .ProfileElement.SignOutElement {
    margin-top: auto;
  }
`;
interface SettingsModalProps {
  userStatus?: UserStatus;
  onClose: () => void;
  setShowStatusModal: (value: boolean) => void;
  showStatusModal: boolean;
}
const SettingsModal = (props: SettingsModalProps) => {
  const ModalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const toggleStatusModal = () => {
    props.setShowStatusModal(!props.showStatusModal);
  };

  return (
    <StyledSettingsModal
      className="GlassMorphism"
      userStatus={props.userStatus}
      ref={ModalRef}
    >
      <div
        className="ProfileElement BorderBottomEffect"
        onClick={() => {
          navigate("/user/0");
          props.onClose();
        }}
      >
        <PersonIcon
          size={20}
          fill="rgba(73, 91, 134, 0.9)"
          className="ProfileElementIcon"
        />
        <span>Profile</span>
      </div>

      <div
        className="ProfileElement BorderBottomEffect"
        onClick={() => {
          navigate("/settings/account");
          props.onClose();
        }}
      >
        <SettingsIcon
          size={20}
          fill="rgba(73, 91, 134, 0.9)"
          className="ProfileElementIcon"
        />
        <span>Settings</span>
      </div>

      <div
        className="ProfileElement BorderBottomEffect"
        onClick={() => {
          navigate("/settings/preferences");
          props.onClose();
        }}
      >
        <PreferencesIcon
          size={20}
          fill="rgba(73, 91, 134, 0.9)"
          stroke="rgba(73, 91, 134, 0.9)"
          className="ProfileElementIcon"
        />
        <span>Preferences</span>
      </div>

      <div
        className="ProfileElement BorderBottomEffect"
        onClick={toggleStatusModal}
      >
        <div className="ProfileElementIcon">
          <div className="ProfileStatus"></div>
        </div>
        <span>{props.userStatus}</span>
        <Status isVisible={props.showStatusModal} />
      </div>

      <div className="ProfileElement SignOutElement">
        <SignOutIcon
          size={20}
          fill="rgba(73, 91, 134, 0.9)"
          className="ProfileElementIcon"
        />
        <span>Sign Out</span>
      </div>
    </StyledSettingsModal>
  );
};

export default SettingsModal;

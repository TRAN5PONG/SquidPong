import { updateProfile } from "@/api/user";
import Zeroact, { useEffect } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";

const StyledStatus = styled("div")`
  width: 200px;
  background-color: var(--bg_color);
  border-radius: 4px;
  border: 1px solid rgba(256, 256, 256, 0.1);
  position: absolute;
  left: -103%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  padding: 2px;
  display: ${(props: any) => (props.isVisible ? "flex" : "none")};

  span {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    transition: 0.2s ease-in-out;
    border-radius: 2px;
    cursor: pointer;
    background-image: linear-gradient(
      90deg,
      rgba(142, 45, 226, 0) 15%,
      rgba(73, 91, 134, 0.4) 50%,
      rgba(142, 45, 226, 0) 85%
    );
    background-position: bottom;
    background-size: 100% 1px;
    background-repeat: no-repeat;
    &:hover {
      background-color: var(--bg_color_light);
    }
    &:after {
      content: "";
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #15e215;
      position: absolute;
      left: 5px;
    }
    &:nth-child(2) {
      &:after {
        background-color: gray;
      }
    }
    &:nth-child(3) {
      &:after {
        background-color: #f7d315;
      }
    }
    &:nth-child(4) {
      &:after {
        background-color: #f71515;
      }
    }
  }
`;

interface StatusProps {
  isVisible?: boolean;
}
const Status = (props: StatusProps) => {
  const onStatusClick = async (status: string) => {
    try {
      const resp = await updateProfile({ status: status.toUpperCase() });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };
  return (
    <StyledStatus isVisible={props.isVisible}>
      {["ONLINE", "OFFLINE", "IDLE", "DONOTDISTURB"].map((s) => (
        <span key={s} onClick={() => onStatusClick(s)}>
          {s}
        </span>
      ))}
    </StyledStatus>
  );
};

export default Status;

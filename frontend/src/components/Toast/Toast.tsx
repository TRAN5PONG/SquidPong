import { useAppContext } from "@/contexts/AppProviders";
import Zeroact, { useEffect, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { CheckIcon, ErrorIcon, InfosIcon, WarningIcon } from "../Svg/Svg";

const StyledToastContainer = styled("div")`
  position: fixed;
  top: 55px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
  .Toast {
    width: 350px;
    height: 50px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    color: white;
    font-family: var(--main_font);
    font-weight: 500;
    background-color: rgba(45, 56, 82, 0.5);
    border: 1px solid rgba(45, 56, 82, 1);
    overflow: hidden;
    opacity: 0;
    transform: translateX(100%);
    clip-path: path("M 0,0 L 340,0 L 350,10 L 350,50 L 15,50 L 0,35 L 0,0 Z");

    &.Toast--success {
      background-color: var(--light_green_hover);
      border-color: var(--green_color);
      .ToastAvatar {
        background-color: var(--green_color);
        svg {
          fill: rgba(255, 255, 255, 0.8);
        }
      }
      .ToastInfo {
        color: var(--green_color);
      }
    }
    &.Toast--error {
      background-color: rgb(241, 66, 66);
      border-color: var(--red_color);
      .ToastAvatar {
        background-color: var(--red_color);
        svg {
          fill: rgba(255, 255, 255, 0.8);
        }
      }
      .ToastInfo {
        color: rgba(255, 255, 255, 0.8);
      }
    }
    &.Toast--warning {
      background-color: var(--light_red_hover);
      border-color: var(--red_color);
      .ToastAvatar {
        background-color: var(--light_red);
        svg {
          fill: white;
          stroke: white;
        }
      }
      .ToastInfo {
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .ToastAvatar {
      width: 50px;
      height: 50px;
      background-color: rgba(45, 56, 82, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ToastInfo {
      font-size: 14px;
      color: rgb(107, 134, 196);
      font-family: var(--span_font);
    }

    &.Toast--animateIn {
      animation: Toast--animateIn 0.18s cubic-bezier(0.22, 0.61, 0.36, 1)
        forwards;
    }
    &.Toast--animateOut {
      animation: Toast--animateOut 0.18s cubic-bezier(0.55, 0.06, 0.68, 0.19)
        forwards;
    }
  }
`;

export type toastType = "success" | "error" | "info" | "warning";
export interface ToastEl {
  message: string;
  type: toastType;
  duration?: number;
  key?: number;
}
const Toast = ({ message, duration = 3000, type, key }: ToastEl) => {
  const [animClass, setAnimClass] = useState("Toast--animateIn");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setAnimClass("Toast--animateOut");

      setTimeout(() => setVisible(false), 180);
    }, duration);

    return () => clearTimeout(hideTimer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div
      className={`${animClass} Toast BorderBottomEffect Toast--${type}`}
      key={key}
    >
      <div className="ToastAvatar">
        {type === "success" ? (
          <CheckIcon fill="rgb(107, 134, 196)" size={20} />
        ) : type === "error" ? (
          <ErrorIcon fill="rgb(107, 134, 196)" size={20} />
        ) : type === "warning" ? (
          <WarningIcon size={20} />
        ) : (
          <InfosIcon fill="rgb(107, 134, 196)" size={20} />
        )}
      </div>
      <div className="ToastInfo">{message}</div>
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useAppContext();

  return (
    <StyledToastContainer>
      {toasts.toastsQueue.map((toast: ToastEl, index: number) => {
        return <Toast {...toast} key={toast.key} />;
      })}
    </StyledToastContainer>
  );
};

export default Toast;

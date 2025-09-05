import Zeroact, { useEffect, useRef } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { CloseIcon } from "../Svg/Svg";

const StyledConfirmationModal = styled("div")`
  width: 500px;
  height: 170px;
  background-color: var(--bg_color_super_light);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  padding: 10px;
  h2 {
    font-size: 24px;
    color: rgba(255, 255, 255, 0.9);
    font-family: var(--main_font);
    text-transform: uppercase;
	margin-bottom: 10px;
	margin-top: 10px;
  }
  p {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    font-family: var(--main_font);
  }
  div {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    padding: 0 10px;
	margin-top: auto;
    .ConfirmBtn {
      background-color: rgba(106, 243, 106, 0.3);
      color: rgba(106, 243, 106, 0.6);
	  border: 1px solid rgba(106, 243, 106, 0.3);
      flex: 1;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 10px;
      font-family: var(--main_font);
      font-size: 16px;
	  transition: background-color 0.3s ease;
	  &:hover {
		background-color: rgba(106, 243, 106, 0.2);
	  }
    }
    .CancelBtn {
      color: rgb(243, 106, 106);
      background-color: transparent;
      border: 1px solid rgb(243, 106, 106);
      width: 150px;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-family: var(--main_font);
      font-size: 16px;
	  &:hover{
		background-color: rgba(243, 106, 106, 0.1);
	  }
    }
  }
  .CloseIcon {
    position: absolute;
    top: 10px;
    right: 0px;
    cursor: pointer;
    svg {
		transition: fill 0.3s ease;
      &:hover {
        fill: rgba(255, 255, 255, 0.5);
      }
    }
  }
`;

interface ConfirmationModalProps {
  onConfirm: () => void;
  onClose: () => void;
  message: string;
  title?: string;
  show: boolean;
}
const ConfirmationModal = (props: ConfirmationModalProps) => {
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

  return (
    <StyledConfirmationModal ref={ModalRef}>
      <div className="CloseIcon" onClick={props.onClose}>
        <CloseIcon size={25} fill="rgba(255,255,255, 0.3)" />
      </div>
      <h2>{props.title || "Confirmation"}</h2>
      <p>{props.message}</p>
      <div>
        <button className="ConfirmBtn" onClick={props.onConfirm}>
          Confirm
        </button>
        <button className="CancelBtn" onClick={props.onClose}>
          Cancel
        </button>
      </div>
    </StyledConfirmationModal>
  );
};

export default ConfirmationModal;

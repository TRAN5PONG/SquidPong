import Zeroact, { useEffect, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { CopyIcon, ScanIcon } from "../Svg/Svg";
import { useAppContext } from "@/contexts/AppProviders";
import { TwoFA_enable, TwoFA_setup } from "@/api/auth";

const StyledTwoFAModal = styled("div")`
  width: 500px;
  height: 700px;
  background-color: var(--bg_color);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  .QRCodeHeader {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 20px;
    flex-direction: column;
    h2 {
      font-size: 1.5rem;
      color: rgba(255, 255, 255, 0.8);
      font-family: var(--main_font);
    }
  }
  .Main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    width: 100%;
    display: flex;
    flex-direction: column;

    .ScanQRCode {
      width: 100%;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex-direction: column;
      .QRCode {
        width: 300px;
        height: 300px;
        background-color: rgba(255, 255, 255, 1);
        border: 1px solid rgba(255, 255, 255, 1);
        border-radius: 10px;
        background-image: url(${(props: any) => props.qrImgUrl});
        background-size: cover;
        background-position: center;
        position: relative;
        overflow: hidden;
        &:after {
          content: "";
          position: absolute;
          border-radius: 50px;
          top: 100%;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 0px;
          border-top: 5px solid #46ff46;
          background-color: rgba(147, 239, 147, 0.5);
          transition: top 0.3s cubic-bezier(0.785, 0.135, 0.15, 0.86);
        }
      }
      .QRCode.active:after {
        top: 0;
      }
      .spliter {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        span {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          font-family: var(--main_font);
        }
      }
      .QRCodeManualInput {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 100%;
        .QRCodeInput {
          width: 100%;
          height: 40px;
          padding: 5px;
          border: none;
          border-radius: 5px;
          font-family: var(--main_font);
          font-size: 1rem;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          outline: none;
        }
        .CopyIcon {
          cursor: pointer;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          height: 40px;
          width: 40px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
      .ProgBtn {
        width: 100%;
        height: 50px;
        background-color: rgba(73, 91, 134, 0.9);
        color: white;
        border: none;
        border-radius: 5px;
        font-family: var(--main_font);
        font-size: 1rem;
        cursor: pointer;
        margin-top: auto;
        &:hover {
          background-color: rgba(90, 114, 170, 0.9);
        }
      }
    }
    .VerificationCode {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      input {
        width: 100%;
        height: 40px;
        padding: 5px;
        border: none;
        border-radius: 5px;
        font-family: var(--main_font);
        font-size: 1rem;
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        outline: none;
      }
      .ProgBtn {
        width: 100%;
        height: 50px;
        background-color: rgba(73, 91, 134, 0.9);
        color: white;
        border: none;
        border-radius: 5px;
        font-family: var(--main_font);
        font-size: 1rem;
        cursor: pointer;
        margin-top: 20px;
        &:hover {
          background-color: rgba(90, 114, 170, 0.9);
        }
      }
    }
  }
`;

interface TwoFAModalProps {
  onClose: () => void;
  onEnabled: () => void;
}
const TwoFAModal = (props: TwoFAModalProps) => {
  const modalRef = Zeroact.useRef<HTMLDivElement>(null);
  const [isScanned, setIsScanned] = useState(false);
  const [showScanEffect, setShowScanEffect] = useState(false);
  const [twoFAData, setTwoFAData] = useState<{
    twoFAQRCode: string;
    twoFAKey: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>("");

  const { user, toasts } = useAppContext();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        props.onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalRef, props]);

  useEffect(() => {
    const handleSetupTwoFA = async () => {
      try {
        const resp = await TwoFA_setup();
        if (resp.success && resp.data) {
          setTwoFAData(resp.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    handleSetupTwoFA();
  }, []);

  const onVerify = async () => {
    if (verificationCode === "") return;
    try {
      const resp = await TwoFA_enable(verificationCode);
      if (resp.success) props.onEnabled();
      else
        toasts.addToastToQueue({
          type: "error",
          message: "error enabling two fa!",
        });
    } catch (err) {
      console.error(err);
    }
  };
  const onContinue = () => {
    setShowScanEffect(true);

    setTimeout(() => {
      setIsScanned(true);
    }, 2000); // Simulate scan effect for 3 seconds
    // setIsScanned(true);
  };

  return (
    <StyledTwoFAModal ref={modalRef} qrImgUrl={twoFAData?.twoFAQRCode}>
      <div className="QRCodeHeader">
        <ScanIcon fill="rgba(255, 255, 255, 0.8)" size={40} />
        <h2>Turn on Two-Factor Authentication</h2>
      </div>

      <div className="Main">
        {isScanned ? (
          <div className="VerificationCode">
            <input
              placeholder="put your verification code"
              value={verificationCode}
              onChange={(e: any) => {
                setVerificationCode(e.target.value);
              }}
            />
            <button className="ProgBtn" onClick={onVerify}>
              Verify
            </button>
          </div>
        ) : (
          <div className="ScanQRCode">
            <div className={`QRCode ${showScanEffect ? "active" : ""}`} />
            <div className="spliter">
              <span>or enter the code manually</span>
            </div>
            <div className="QRCodeManualInput">
              <input
                type="text"
                placeholder="Enter your 2FA code"
                className="QRCodeInput"
                value={twoFAData?.twoFAKey}
              />
              <div className="CopyIcon">
                <CopyIcon fill="rgba(255, 255, 255, 0.8)" size={25} />
              </div>
            </div>
            <button className="ProgBtn" onClick={onContinue}>
              Continue
            </button>
          </div>
        )}
      </div>
    </StyledTwoFAModal>
  );
};

export default TwoFAModal;

import Zeroact, { useEffect, useRef } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import {
  _42Icon,
  EmailIcon,
  GoogleIcon,
  PasswordIcon,
  PersonIcon,
  SquidIcon,
  UpRightArrowIcon,
} from "../Svg/Svg";

// Redux
import { store } from "@/store";
import { userActions } from "@/store/user/actions";
import { AnimateHeight, FloatBounce } from "@/utils/gsap";
import { useNavigate } from "@/contexts/RouterProvider";
import { useAppContext } from "@/contexts/AppProviders";
import {
  API_BASE_URL,
  googleAuth,
  login,
  requestPasswordReset,
  resetPassword,
  signUp,
  verifyEmail,
} from "@/api/auth";
import { LoaderSpinner } from "../Loader/Loader";
import { getUserProfile } from "@/api/user";
import { useSounds } from "@/contexts/SoundProvider";

const StyledHome = styled("div")`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  font-family: var(--main_font);
  color: white;
  background-color: var(--bg_color);
  gap: 5px;
  position: relative;

  .CTAButton {
    width: 200px;
    height: 60px;
    clip-path: path("M 0,0 L 180,0 L 200,20 L 200,60 L 10,60 L 0,50 L 0,0 Z");
    padding: 10px 20px;
    font-size: 1.4rem;
    border: none;
    cursor: pointer;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    right: 2%;
    bottom: 5%;
    gap: 10px;
    z-index: 999;
    background-color: var(--main_color);
    font-family: var(--squid_font);
    /* border: 1px solid rgba(255, 255, 255, 0.1); */
    z-index: 99;
    transition: 0.3s cubic-bezier(0.87, -1.38, 0.03, 1.54);

    &:hover {
      background-color: #a5212c;
    }
  }
  .MainContainer {
    height: 100%;
    width: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    overflow: hidden;
    z-index: 2;
    clip-path: polygon(
      0% 0%,
      100% 0%,
      100% 80%,
      98% 85%,
      90% 85%,
      89.5% 86%,
      65% 86%,
      64.5% 85%,
      50% 85%,
      46% 94%,
      5% 94%,
      4.5% 93%,
      2% 93%,
      0% 88%,
      0% 0%
    );
    .MainContainerBg {
      position: absolute;
      top: -100px;
      z-index: 3;
      transition: 0.3s cubic-bezier(0.87, -1.38, 0.03, 1.54);
    }
    &:after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--bg_color);
      background-image: radial-gradient(
          ellipse at 40% 95%,
          rgb(222, 53, 67) 0%,
          transparent 55%
        ),
        radial-gradient(
          ellipse at 70% 90%,
          rgb(176, 40, 51) 0%,
          transparent 55%
        ),
        radial-gradient(ellipse at 90% 10%, var(--bg_color) 0%, transparent 55%),
        radial-gradient(ellipse at 10% 10%, var(--bg_color) 0%, transparent 55%);
      z-index: 1;
      border-radius: 0px 10px 10px 0px;
    }
    .MainText {
      position: absolute;
      font-size: 9rem;
      font-weight: 100;
      font-family: var(--squid_font);
      bottom: 15%;
      z-index: 2;
      .HeaderText {
        font-family: var(--main_font);
        position: absolute;
        bottom: 30px;
        font-size: 1.5rem;
        z-index: 2;
        opacity: 0.8;
      }
    }
    .top {
      color: transparent;
      -webkit-text-stroke: 1px white;
      z-index: 4;
    }
    .HeroImg {
      left: 50%;
      transform: translateX(-50%);
      bottom: 0;
      height: 80%;
      position: absolute;
      z-index: 3;
    }
  }
`;
const Home = () => {
  const ImgRef = useRef<HTMLImageElement>(null);
  const MainContainerRef = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = Zeroact.useState(true);
  const [isHoveredOnBtn, setIsHoveredOnBtn] = Zeroact.useState(false);

  const { backgroundSound } = useSounds();

  useEffect(() => {
    // FloatBounce(ImgRef);
    setTimeout(() => {
      // AnimateHeight(MainContainerRef, "90%"); // could be cool :)
    }, 500);
  }, [ImgRef]);

  const onStartClick = () => {
    backgroundSound.play();
    setShowModal(true);
  };

  useEffect(() => {
    console.log("Home component mounted");
  }, []);
  return (
    <StyledHome>
      <button
        className="CTAButton"
        onClick={onStartClick}
        onMouseEnter={() => setIsHoveredOnBtn(true)}
        onMouseLeave={() => setIsHoveredOnBtn(false)}
      >
        PLay{" "}
        <UpRightArrowIcon size={30} stroke="white" className="BTNSvgIcon" />
      </button>
      <div className="MainContainer" ref={MainContainerRef}>
        <SquidIcon
          size={1000}
          fill={`${isHoveredOnBtn ? "var(--main_color)" : "white"}`}
          className="MainContainerBg"
        />
        <h1 className="MainText">
          SQUID PONG
          <h3 className="HeaderText">Real-Time 3D Multiplayer Ping Pong</h3>
        </h1>
        <h1 className="MainText top">SQUID PONG</h1>

        <img ref={ImgRef} src="/assets/Hero.png" className="HeroImg" />
      </div>

      {showModal && <CTAModal onClose={() => setShowModal(false)} />}
    </StyledHome>
  );
};

const StyledCTAModal = styled("div")`
  width: 500px;
  height: 700px;
  clip-path: path("M 0,0 L 480,0 L 500,20 L 500,700 L 30,700 L 0,670 L 0,0 Z");
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(
    130deg,
    rgba(12, 12, 12, 1) 20%,
    rgba(12, 12, 12, 0.8) 50%,
    rgba(12, 12, 12, 1) 80%
  );
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: hidden;
  z-index: 1000;

  button {
    margin-top: 20px;
    height: 45px;
    width: 100%;
    background-color: var(--main_color);
    border-radius: 4px;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    font-family: var(--main_font);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    transition: 0.2s ease-in-out;
    &:hover {
      background-color: #a5212c;
    }
  }

  .HeaderLine {
    font-size: 1.2rem;
    margin-bottom: 16px;
    font-family: var(--span_font);
    color: rgba(255, 255, 255, 0.7);
  }
  .LoginContainer {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .ResetPassContainer {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .BTLSpan {
      margin-top: auto;
      text-decoration: underline;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.7);
      transition: 0.2s ease-in-out;
      &:hover {
        color: white;
      }
    }
  }
  .SignupContainer {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .VerifyemailContainer {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .FormContainer {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
    padding: 20px;
    flex: 1;

    .FormGroup {
      width: 100%;
      display: flex;
      align-items: center;
      position: relative;

      &:has(input:focus) {
        .FormGroupIcon {
          fill: var(--main_color);
        }
        .PasswordIcon {
          fill: none;
          stroke: var(--main_color);
        }
      }

      .FormGroupIcon {
        left: 10px;
        position: absolute;
      }

      input {
        width: 100%;
        height: 45px;
        border: none;
        border-radius: 5px;
        background-color: rgba(32, 31, 36, 0.6);
        border: 1px solid rgba(32, 31, 36, 1);
        color: white;
        padding-left: 45px;
        font-size: 1.1rem;
        font-family: var(--main_font);
        outline: none;
        &:focus {
          border-color: #424246;
        }
      }
    }
    .ChangeModeText {
      color: rgba(255, 255, 255, 0.8);
    }
    .ForgotPassSpan {
      cursor: pointer;
      text-decoration: underline;
      color: rgba(255, 255, 255, 0.7);
      &:hover {
        color: white;
      }
    }
    .ToggleMode {
      color: var(--main_color);
      cursor: pointer;
      font-weight: bold;
      text-decoration: underline;
      margin-left: 5px;
      &:hover {
        color: var(--main_color_hover);
      }
    }
  }
  .AlternativeLogin {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-top: auto;

    .OrSep {
      margin: 10px 0;
      font-size: 1.2rem;
      color: rgba(255, 255, 255, 0.8);
      font-weight: bold;
      position: relative;
      display: flex;
      align-items: center;

      &::before {
        content: "";
        position: absolute;
        background: linear-gradient(
          -90deg,
          rgba(255, 255, 255, 0.6) 0%,
          rgba(255, 255, 255, 0) 100%
        );
        width: 50px;
        height: 1px;
        left: -55px;
      }
      &::after {
        content: "";
        position: absolute;
        width: 50px;
        height: 1px;
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.6) 0%,
          rgba(255, 255, 255, 0) 100%
        );
        right: -55px;
      }
    }

    .AlternativeLoginButtons {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 5px;
      .AlternativeLoginButton.hovered {
        &:hover {
          fill: var(--main_color);
        }
      }
    }
    button {
      height: 45px;
      width: 45px;
      background-color: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 5px;
      cursor: pointer;
      transition: 0.2s ease-in-out;
      &:hover {
        border: 1px solid var(--main_color_hover);
        background: linear-gradient(
          0deg,
          rgba(202, 47, 60, 0.4) 0%,
          rgba(202, 47, 60, 0) 100%
        );
        .AlternativeLoginButton {
          fill: var(--main_color_hover);
        }
      }
    }
  }
  .verify_email {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;

    input {
      width: 100%;
      height: 50px;
      text-align: center;
      font-size: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 5px;
    }
    input:focus {
      border-color: #007bff;
      outline: none;
      box-shadow: 0 0 3px #007bff;
    }
  }
`;

type CTAModalType =
  | "login"
  | "signup"
  | "resetPassword"
  | "verifyEmail"
  | "changePassword";

const CTAModal = ({ onClose }: { onClose: () => void }) => {
  const [currentMode, setCurrentMode] = Zeroact.useState<CTAModalType>("login");
  const [isLoading, setIsLoading] = Zeroact.useState(false);

  const OnModalModeChange = (mode: CTAModalType) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentMode(mode);
    }, 1000);
    // Reset input fields when switching modes
    setEmail("");
    setPassword("");
    setUserName("");
    setFirstName("");
    setLastName("");
  };

  // Shared input states
  const [email, setEmail] = Zeroact.useState("");
  const [password, setPassword] = Zeroact.useState("");
  const [userName, setUserName] = Zeroact.useState("");
  const [firstName, setFirstName] = Zeroact.useState("");
  const [lastName, setLastName] = Zeroact.useState("");
  const [tmpEmail, setTmpEmail] = Zeroact.useState("");
  // Email verification input
  const [verificationCode, setVerificationCode] = Zeroact.useState("");

  const modalRef = useRef<HTMLDivElement>(null);

  // CTX
  const { toasts, setUser } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleChangePassword = async (e: any) => {
    e.preventDefault();
    const resp = await resetPassword(email, verificationCode, password);
    if (resp.success) {
      toasts.addToastToQueue({
        type: "success",
        message: "Password changed successfully!",
      });
      OnModalModeChange("login");
    } else {
      toasts.addToastToQueue({
        type: "error",
        message: resp.message,
      });
    }
  };
  const handleLogin = async (e: any) => {
    e.preventDefault();
    try {
      const resp = await login(email, password);
      if (resp.success) {
        toasts.addToastToQueue({
          type: "success",
          message: "Login successful!",
        });
        const userData = await getUserProfile();
        if (userData.success)
          setTimeout(() => {
            setUser(userData.data!);
            navigate("/lobby");
          }, 500);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toasts.addToastToQueue({ type: "error", message: error.message });
    }
  };
  const handleSignup = async (e: any) => {
    e.preventDefault();
    try {
      const resp = await signUp(firstName, lastName, userName, email, password);
      console.log("Signup response:", resp);
      toasts.addToastToQueue({
        type: resp.success ? "success" : "error",
        message: resp.message,
      });
      setIsLoading(true);
      setTmpEmail(email);
      setTimeout(() => {
        setIsLoading(false);
        setCurrentMode("verifyEmail");
      }, 3000);
    } catch (error: any) {
      toasts.addToastToQueue({ type: "error", message: error.message });
    }
  };
  const handleEmailVerification = async (e: any) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      toasts.addToastToQueue({
        type: "error",
        message: "Please enter a valid 6-digit code.",
      });
      return;
    }

    try {
      const resp = await verifyEmail(tmpEmail, verificationCode);
      if (resp.success) {
        toasts.addToastToQueue({
          type: "success",
          message: "Email verified successfully!",
        });
      } else {
        toasts.addToastToQueue({
          type: "error",
          message: resp.message || "Email verification failed.",
        });
        return;
      }
      OnModalModeChange("login");
    } catch (error: any) {
      toasts.addToastToQueue({ type: "error", message: error.message });
    }
  };
  const handleResetPassword = async (e: any) => {
    e.preventDefault();
    const resp = await requestPasswordReset(email);
    if (resp.success) {
      toasts.addToastToQueue({
        type: "success",
        message: "change pass",
      });
      setCurrentMode("changePassword");
    }
  };
  const handleGoogleAuth = async () => {
    const popup = window.open(
      `${API_BASE_URL}/auth/google`,
      "Google Auth",
      "width=600,height=700,scrollbars=yes"
    );

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== new URL(API_BASE_URL).origin) return;

      if (event.data.type === "google-auth-success") {
        toasts.addToastToQueue({
          type: "success",
          message: "Google authentication successful!",
        });

        popup?.close();
        window.removeEventListener("message", handleMessage);

        setIsLoading(true);

        setTimeout(async () => {
          try {
            const userData = await getUserProfile();
            setUser(userData.data!);

            // Navigate after success
            navigate("/lobby");
          } catch (err) {
            console.error("Failed to fetch user profile:", err);
            toasts.addToastToQueue({
              type: "error",
              message: "Could not fetch profile after login.",
            });
          } finally {
            setIsLoading(false);
          }
        }, 1000);
      }

      if (event.data.type === "google-auth-error") {
        toasts.addToastToQueue({
          type: "error",
          message: event.data.message || "Google authentication failed.",
        });
        popup?.close();
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage);
  };

  return (
    <StyledCTAModal ref={modalRef}>
      {isLoading ? (
        <LoaderSpinner />
      ) : currentMode === "login" ? (
        <div className="LoginContainer">
          <h2 className="HeaderLine">Login to your account</h2>
          <form className="FormContainer" onSubmit={handleLogin}>
            <div className="FormGroup" key="email">
              <EmailIcon
                size={25}
                fill="rgba(255,255,255, 0.5)"
                className="FormGroupIcon EmailIcon"
              />
              <input
                type="email"
                placeholder="Email Address or Username"
                required
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
              />
            </div>

            <div className="FormGroup" key="password">
              <PasswordIcon
                size={25}
                stroke="rgba(255,255,255, 0.5)"
                className="FormGroupIcon PasswordIcon"
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
              />
            </div>

            <span
              onClick={() => OnModalModeChange("resetPassword")}
              className="ForgotPassSpan"
            >
              Forgot password?
            </span>

            <button type="submit">Login</button>

            <p className="ChangeModeText">
              Don't have an account?{" "}
              <span
                className="ToggleMode"
                onClick={() => OnModalModeChange("signup")}
              >
                Sign Up
              </span>
            </p>
          </form>
          <div className="AlternativeLogin">
            <p className="OrSep">Or</p>
            <div className="AlternativeLoginButtons">
              <button onClick={handleGoogleAuth}>
                <GoogleIcon
                  size={20}
                  fill="rgba(255, 255, 255, 0.3)"
                  className="AlternativeLoginButton"
                />
              </button>
              <button>
                <_42Icon
                  size={20}
                  fill="rgba(255, 255, 255, 0.3)"
                  className="AlternativeLoginButton"
                />
              </button>
            </div>
          </div>
        </div>
      ) : currentMode === "signup" ? (
        <div className="SignupContainer">
          <h2 className="HeaderLine">signuuuuuup</h2>
          <form className="FormContainer" onSubmit={handleSignup}>
            <div className="FormGroup" key="firstName">
              <PersonIcon
                size={20}
                fill="rgba(255,255,255, 0.5)"
                className="FormGroupIcon"
              />
              <input
                type="text"
                placeholder="First Name"
                required
                value={firstName}
                onChange={(e: any) => setFirstName(e.target.value)}
              />
            </div>

            <div className="FormGroup">
              <PersonIcon
                size={20}
                fill="rgba(255,255,255, 0.5)"
                className="FormGroupIcon"
              />
              <input
                type="text"
                placeholder="Last Name"
                required
                value={lastName}
                onChange={(e: any) => setLastName(e.target.value)}
              />
            </div>

            <div className="FormGroup" key="userName">
              <PersonIcon
                size={20}
                fill="rgba(255,255,255, 0.5)"
                className="FormGroupIcon"
              />
              <input
                type="text"
                placeholder="Username"
                required
                value={userName}
                onChange={(e: any) => setUserName(e.target.value)}
              />
            </div>

            <div className="FormGroup" key="email">
              <EmailIcon
                size={25}
                fill="rgba(255,255,255, 0.5)"
                className="FormGroupIcon EmailIcon"
              />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
              />
            </div>

            <div className="FormGroup" key="password">
              <PasswordIcon
                size={25}
                stroke="rgba(255,255,255, 0.5)"
                className="FormGroupIcon PasswordIcon"
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit">Sign Up</button>

            <p className="ChangeModeText">
              Already have an account?
              <span
                className="ToggleMode"
                onClick={() => OnModalModeChange("login")}
              >
                Login
              </span>
            </p>
          </form>
          <div className="AlternativeLogin">
            <p className="OrSep">Or</p>
            <div className="AlternativeLoginButtons">
              <button onClick={handleGoogleAuth}>
                <GoogleIcon
                  size={20}
                  fill="rgba(255, 255, 255, 0.3)"
                  className="AlternativeLoginButton"
                />
              </button>
              <button>
                <_42Icon
                  size={20}
                  fill="rgba(255, 255, 255, 0.3)"
                  className="AlternativeLoginButton"
                />
              </button>
            </div>
          </div>
        </div>
      ) : currentMode === "resetPassword" ? (
        <div className="ResetPassContainer">
          <h2 className="HeaderLine">Reset password</h2>

          <form className="FormContainer" onSubmit={handleResetPassword}>
            <div className="FormGroup" key="email">
              <EmailIcon
                size={20}
                fill="rgba(255,255,255, 0.5)"
                className="FormGroupIcon"
              />
              <input
                type="text"
                placeholder="Email"
                required
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
              />
            </div>
            <button>Reset</button>
          </form>

          <span className="BTLSpan" onClick={() => OnModalModeChange("login")}>
            back to login
          </span>
        </div>
      ) : currentMode === "verifyEmail" ? (
        <div className="VerifyemailContainer">
          <h2 className="HeaderLine">verify email</h2>

          <div className="verify_email">
            <input
              type="text"
              maxLength={6}
              placeholder="XXXXXX"
              value={verificationCode}
              onChange={(e: any) => setVerificationCode(e.target.value)}
              required
              key="verificationCode"
            />
            <button onClick={handleEmailVerification}>Verify</button>
          </div>
        </div>
      ) : (
        <div>
          <h1>CHANGE PASS</h1>

          <div className="FormGroup" key="email">
            <input
              type="text"
              maxLength={6}
              placeholder="XXXXXX"
              value={verificationCode}
              onChange={(e: any) => setVerificationCode(e.target.value)}
              required
              key="verificationCode"
            />
          </div>
          <div className="FormGroup" key="password">
            <PasswordIcon
              size={25}
              stroke="rgba(255,255,255, 0.5)"
              className="FormGroupIcon PasswordIcon"
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
            />
          </div>

          <button onClick={handleChangePassword}>Change Password</button>
        </div>
      )}
    </StyledCTAModal>
  );
};

export default Home;

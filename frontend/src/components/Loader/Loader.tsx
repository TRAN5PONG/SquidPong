import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { AnimateTo } from "@/utils/gsap";

const StyledLoader = styled("div")`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  transform: translateY(-100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(19, 18, 23, 1);
  backdrop-filter: blur(10px);

  z-index: 999999999;
  pointer-events: none;

  h1 {
    font-family: var(--squid_font);
    font-size: 1.2rem;
    text-align: center;
    margin-top: 90px;
    color: white;
    font-weight: 100;
  }
`;

interface LoaderProps {
  show: boolean; // Add this prop
  onFinish: () => void; // Callback when animation completes
  nextRoute: string;
}

const Loader = ({
  onFinish,
  show, // Default to true, can be controlled externally
  nextRoute,
}: LoaderProps) => {
  const loaderRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (show) AnimateTo(loaderRef, "0%", "0%");
    else AnimateTo(loaderRef, "0%", "-100%");
  }, [show]);

  return (
    <StyledLoader ref={loaderRef}>
      <LoaderSpinner />
      <h1>
        {nextRoute === "/"
          ? "Loading..."
          : nextRoute === "/lobby"
          ? "Gathering the challengers..."
          : nextRoute === "/select-character"
          ? "Choose wisely. Your future depends on it."
          : nextRoute === "/select-paddle"
          ? "Customize your weapon."
          : nextRoute === "/game"
          ? "The match is about to begin..."
          : nextRoute === "/tournament"
          ? "Preparing the tournament arena..."
          : nextRoute === "/tournaments"
          ? "Loading tournaments..."
          : nextRoute === "/spectate"
          ? "Grabbing front row seats..."
          : nextRoute === "/settings"
          ? "Tuning your destiny..."
          : nextRoute === "/leaderboard"
          ? "Fetching the best of the best..."
          : "Loading..."}
      </h1>
    </StyledLoader>
  );
};

const StyledLoaderSpinner = styled("div")`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999999999;
`;
export const LoaderSpinner = () => {
  return (
    <StyledLoaderSpinner>
      <div className="loader">
        <svg viewBox="0 0 80 80">
          <circle id="test" cx="40" cy="40" r="32"></circle>
        </svg>
      </div>

      <div className="loader triangle">
        <svg viewBox="0 0 86 80">
          <polygon points="43 8 79 72 7 72"></polygon>
        </svg>
      </div>

      <div className="loader">
        <svg viewBox="0 0 80 80">
          <rect x="8" y="8" width="64" height="64"></rect>
        </svg>
      </div>
    </StyledLoaderSpinner>
  );
};
export default Loader;

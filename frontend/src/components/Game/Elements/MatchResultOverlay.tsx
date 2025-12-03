import { useSounds } from "@/contexts/SoundProvider";
import { useSound } from "@/hooks/useSound";
import Zeroact, { useEffect } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";

const StyledMatchResultOverlay = styled("div")`
  width: 800px;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  z-index: 999;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  .match-result-overlay {
    width: 100%;
    height: 70px;
    background: linear-gradient(
      -90deg,
      rgba(255, 217, 68, 0) 0%,
      ${(props: any) =>
          props.isWinner ? "rgba(255, 217, 68, 1)" : "var(--light_red)"}
        50%,
      rgba(255, 217, 68, 0) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    &:after {
      width: 100%;
      height: 1px;
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      background: linear-gradient(
        90deg,
        rgba(255, 217, 68, 0) 0%,
        ${(props: any) =>
            props.isWinner ? "rgba(255, 217, 68, 1)" : "var(--red_color)"}
          50%,
        rgba(255, 217, 68, 0) 100%
      );
    }
    &:before {
      width: 100%;
      height: 1px;
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      background: linear-gradient(
        90deg,
        rgba(255, 217, 68, 0) 0%,
        ${(props: any) => (props.isWinner ? "#997b01" : "var(--red_color)")} 50%,
        rgba(255, 217, 68, 0) 100%
      );
    }
    .match-result-text {
      width: 300px;
      height: 75px;
      clip-path: path("M 0,0 L 300,0 L 270,75 L 30,75 L 0,0 Z");
      background: linear-gradient(
        90deg,
        ${(props: any) =>
            props.isWinner ? "rgba(255, 217, 68, 1)" : "#fc5353"}
          0%,
        ${(props: any) => (props.isWinner ? "#f0c92d" : "#e44040")} 50%,
        ${(props: any) =>
            props.isWinner ? "rgba(255, 217, 68, 1)" : "#fc5353"}
          100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 2;
      .mainText {
        font-family: var(--squid_font);
        font-size: 2.5rem;
        color: ${(props: any) => (props.isWinner ? "#997b01" : "white")};
        /* text-shadow: 0px 0px 5px #be741f; */
        user-select: none;
      }
    }
    .match-result-text-bottom {
      width: 220px;
      height: 40px;
      position: absolute;
      top: calc(100% + 2px);
      clip-path: path("M 0,0 L 220,0 L 200,40 L 20,40 L 0,0 Z");
      background: ${(props: any) =>
        props.isWinner ? "rgba(255, 217, 68, 1)" : "#e44040"};
      display: flex;
      align-items: center;
      justify-content: center;
      span {
        font-family: var(--main_font);
        font-size: 1rem;
        color: ${(props: any) => (props.isWinner ? "#997b01" : "white")};
        user-select: none;
      }
    }
  }
`;

interface MatchResultOverlayProps {
  isWinner: boolean | null;
}

export const MatchResultOverlay = (props: MatchResultOverlayProps) => {
  const { wonSound, lostSound } = useSounds();

  useEffect(() => {
    if (props.isWinner === null || props.isWinner === undefined) return;

    if (props.isWinner) {
      wonSound.play();
    } else {
      lostSound.play();
    }
  }, [props.isWinner]);

  if (props.isWinner === null || props.isWinner === undefined) return null;

  return (
    <StyledMatchResultOverlay isWinner={props.isWinner}>
      <div className="match-result-overlay">
        <div className="match-result-text">
          <h1 className="mainText">
            {props.isWinner ? "You Win!" : `You Lose!`}
          </h1>
        </div>
        <div className="match-result-text-bottom">
          <span></span>
        </div>
      </div>
    </StyledMatchResultOverlay>
  );
};

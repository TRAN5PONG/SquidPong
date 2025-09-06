import { useSound } from "@/hooks/useSound";
import Zeroact from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { AnimateIn } from "@/utils/gsap";

const StyledCountDown = styled("div")`
  width: auto;
  height: 100px;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 6%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.7rem;
  h1 {
    font-family: var(--game_font);
  }
`;

const CountDown = (props: { value: number; onComplete?: () => void }) => {
  const CountDownRef = Zeroact.useRef<HTMLElement>(null);

  // Sounds
  const countDownSound = useSound("/sounds/countdown.mp3");
  const countDownEndSound = useSound("/sounds/countdown_done.mp3");

  Zeroact.useEffect(() => {
    if (props.value === 1) {
      countDownEndSound.play();
      if (props.onComplete) props.onComplete();
    } else {
      countDownSound.play();
    }
    AnimateIn(CountDownRef);
  }, [props.value]); // animate on each countdown update

  return (
    <StyledCountDown>
      <h1 ref={CountDownRef}>{props.value != 0 ? props.value : "GO!"}</h1>
    </StyledCountDown>
  );
};

export default CountDown;

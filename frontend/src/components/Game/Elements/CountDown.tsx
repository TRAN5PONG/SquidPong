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

const CountDown = () => {
  const CountDownRef = Zeroact.useRef<HTMLElement>(null);
  const [countDown, setCountDown] = Zeroact.useState(9);

  // Sounds
  const countDownSound = useSound("/sounds/countdown.mp3");
  const countDownEndSound = useSound("/sounds/countdown_done.mp3");

  Zeroact.useEffect(() => {

    const timer = setInterval(() => {
      setCountDown((prev) => {
        if (prev === 1) {
          countDownEndSound.play();
        } else {
          countDownSound.play();
        }
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 900);

    return () => {
      clearInterval(timer);
    };
  }, []); // only once on mount for timer setup

  Zeroact.useEffect(() => {
    AnimateIn(CountDownRef);
  }, [countDown]); // animate on each countdown update

  return (
    <StyledCountDown>
      <h1 ref={CountDownRef}>{countDown != 0 ? countDown : "GO!"}</h1>
    </StyledCountDown>
  );
};

export default CountDown;

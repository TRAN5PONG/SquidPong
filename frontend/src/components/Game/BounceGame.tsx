import Zeroact, { useEffect, useRef } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { BounceGameScene } from "./Scenes/BounceGameScene";

const StyledBounceGame = styled("div")`
  width: 100%;
  height: 100%;
  background-color: white;
  color: black;
  display: flex;
  align-items: center;
  justify-content: center;
  h1 {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

const BounceGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<BounceGameScene | null>(null);
  const [mouse, setMouse] = Zeroact.useState({ x: 0, y: 0 });

  // Start game once
  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      gameRef.current = new BounceGameScene(canvasRef.current);
      gameRef.current.start();
    }
  }, []); // runs only once

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMouse({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []); // no dependency → register listener once

  
  return (
    <StyledBounceGame>
      <h1>Bounce Game</h1>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </StyledBounceGame>
  );
};

export default BounceGame;

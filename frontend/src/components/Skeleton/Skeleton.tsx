import Zeroact from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";

interface SkeletonProps {
  dark?: boolean;
  width?: string;
  height?: string;
  index?: number;
  borderRadius?: number;
  gap?: number;
  bgColor?: string;
  animation?: "Shine" | "Wave" | "hybrid";
}
const StyledSkeleton = styled("div")`
  display: flex;
  flex-direction: column;
  gap: ${(props: SkeletonProps) => props.gap}px;
  width: ${(props: SkeletonProps) => props.width};
  .Skeleton {
    border-radius: ${(props: SkeletonProps) => props.borderRadius}px;
    height: ${(props: SkeletonProps) => props.height};
    background-color: ${(props: SkeletonProps) =>
      props.bgColor
        ? props.bgColor
        : props.dark
        ? "var(--bg_color_light)"
        : "gray"};
    position: relative;
    overflow: hidden;
  }
  .Skeleton.Wave {
    animation: Wave 1.5s infinite ease-in-out;
  }
  .Skeleton.Shine:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1) 20%,
      rgba(255, 255, 255, 0.2) 60%,
      transparent
    );
    transform: translateX(-100%);
    animation: Shine 2.5s infinite ease-in-out;
  }
`;
const Skeleton = (props: SkeletonProps) => {
  const {
    dark = true,
    width = "100%",
    height = "20px",
    borderRadius = 0,
    gap = 3,
    animation,
  } = props;

  return (
    <StyledSkeleton
      width={width}
      height={height}
      borderRadius={borderRadius}
      dark={dark}
      gap={gap}
      animation={animation}
      bgColor={props.bgColor}
    >
      <div
        className={`Skeleton ${
          props.animation === "Shine"
            ? "Shine"
            : props.animation === "Wave"
            ? "Wave"
            : props.animation === "hybrid"
            ? props.index
              ? props.index % 2 === 0
                ? "Shine"
                : "Wave"
              : "Wave"
            : "Wave"
        }`}
      ></div>
    </StyledSkeleton>
  );
};

export default Skeleton;

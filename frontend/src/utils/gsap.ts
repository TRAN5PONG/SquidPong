import { RefObject } from "@/lib/Zeroact";
import { TransformNode } from "@babylonjs/core";
import gsap, { Power4, Power2 } from "gsap";

export const AnimateTo = (
  ref: RefObject<HTMLElement>,
  toX?: string,
  toY?: string
) => {
  if (ref.current) {
    gsap.to(ref.current, {
      duration: 1,
      ease: Power4.easeInOut,
      ...(toX && { x: toX }),
      ...(toY && { y: toY }),
    });
  }
};

export function FloatBounce(ref: RefObject<HTMLElement>) {
  if (!ref.current) return;

  gsap.to(ref.current, {
    y: "20px",
    yoyo: true,
    repeat: -1,
    ease: Power2.easeInOut, //,
    duration: 1.2,
  });
}

export const AnimateHeight = (
  ref: RefObject<HTMLElement>,
  toHeight: string | number,
  duration = 1
) => {
  if (!ref.current) return;

  gsap.to(ref.current, {
    height: toHeight,
    duration,
    ease: Power4.easeInOut,
  });
};

export const AnimateIn = (
  ref: RefObject<HTMLElement>,
  duration = 0.3,
  delay = 0
) => {
  if (!ref.current) return;

  gsap.from(ref.current, {
    opacity: 0,
    y: -20,
    duration,
    delay,
    ease: Power4.easeInOut,
  });
};

export const AnimateRotation = (
  mesh: TransformNode,
  targetRotationY: number,
  onComplete?: () => void
) => {
  if (!mesh) return;

  // Kill ongoing rotation tweens to avoid lag and jumps
  gsap.killTweensOf(mesh.rotation);

  gsap.to(mesh.rotation, {
    y: targetRotationY,
    duration: 0.5, // Reduced duration for more responsive feel
    ease: "power2.out",
    onComplete: () => {
      if (onComplete) onComplete();
    },
  });
};

export function AnimateAutoRotate(
  mesh: TransformNode,
  speed = 1 // radians per second
) {
  let tween: gsap.core.Tween | null = null;
  let isPaused = false;

  // Start infinite rotation tween
  function start() {
    if (!mesh) return;

    tween = gsap.to(mesh.rotation, {
      y: "+=" + Math.PI * 2,
      duration: 10,
      ease: "linear",
      repeat: -1,
      paused: false,
    });
  }

  function pause() {
    if (tween && !isPaused) {
      tween.pause();
      isPaused = true;
    }
  }

  function resume() {
    if (tween && isPaused) {
      // Kill any existing rotation tweens first
      gsap.killTweensOf(mesh.rotation);
      
      // Get current rotation and continue from there
      const currentRotation = mesh.rotation.y;
      
      // Restart the infinite rotation from current position
      tween = gsap.to(mesh.rotation, {
        y: currentRotation + Math.PI * 2,
        duration: (Math.PI * 2) / speed,
        ease: "linear",
        repeat: -1,
        paused: false,
      });
      
      isPaused = false;
    }
  }

  function stop() {
    tween?.kill();
    tween = null;
    isPaused = false;
  }


  start();

  return {
    pause,
    resume,
    stop,
  };
}
import { useEffect, useRef } from "@/lib/Zeroact";
import { Scene, Vector3, FreeCamera } from "@babylonjs/core";
import gsap from "gsap";

const PauseCinematic = [
  {
    start: new Vector3(2, 4, 0),
    end: new Vector3(-3, 4, 2),
    lookAt: new Vector3(4, 3, 3),
    duration: 10,
  },
  {
    start: new Vector3(3, 4, 0),
    end: new Vector3(9, 5, 2),
    lookAt: new Vector3(0, 0, 0),
    duration: 10,
  },
  {
    start: new Vector3(5, 5, 10),
    end: new Vector3(3, 9, 12),
    lookAt: new Vector3(2, 1, 0),
    duration: 10,
  },
];

export function useCinematicCamera(scene: Scene, canvas?: HTMLCanvasElement) {
  const cameraRef = useRef<FreeCamera | null>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!scene || !canvas) return;

    // Create FreeCamera
    const camera = new FreeCamera(
      "cinematicCamera",
      new Vector3(0, 5, -10),
      scene
    );
    camera.setTarget(Vector3.Zero()); // initial look at center
    camera.attachControl(canvas, false); // optional, usually false for cinematic
    scene.activeCamera = camera;

    cameraRef.current = camera;

    return () => {
      // Clean up
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
      camera.dispose();
      cameraRef.current = null;
    };
  }, [scene, canvas]);

  function playCinematic(cinematicData = PauseCinematic) {
    if (!cameraRef.current) return;
    scene.activeCamera = cameraRef.current;

    if (animationRef.current) {
      animationRef.current.kill();
      animationRef.current = null;
    }

    const tl = gsap.timeline({ paused: false });

    cinematicData.forEach((step) => {
      // 1️⃣ Jump instantly to start
      tl.set(cameraRef.current!.position, {
        x: step.start.x,
        y: step.start.y,
        z: step.start.z,
      });

      // 2️⃣ Animate to end position while updating lookAt
      tl.to(cameraRef.current!.position, {
        x: step.end.x,
        y: step.end.y,
        z: step.end.z,
        duration: step.duration,
        ease: "power1.inOut",
        onUpdate: () => {
          cameraRef.current!.setTarget(step.lookAt);
        },
      });
    });

    animationRef.current = tl;
  }

  function stopCinematic() {
    if (animationRef.current) {
      animationRef.current.kill();
      animationRef.current = null;
    }
  }

  return {
    camera: cameraRef.current,
    playCinematic,
    stopCinematic,
  };
}

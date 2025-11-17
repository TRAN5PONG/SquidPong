import { Scene, Vector3, FreeCamera } from "@babylonjs/core";
import { Camera } from "./Camera";
import gsap from "gsap";

interface CameraAnimation {
  startPos: Vector3;
  target: Vector3;
  duration: number;
  ease?: string;
}

export class GameCamera extends Camera {
  private playerSide: number;
  private isPlayingAnimations = false;
  private animations: CameraAnimation[] = [
    {
      startPos: new Vector3(0, 8.2, 40),
      target: new Vector3(0, 8.2, 30),
      duration: 5,
      ease: "power1.inOut",
    },
    {
      startPos: new Vector3(0, 8.2, 30),
      target: new Vector3(5, 8.2, 20),
      duration: 4,
      ease: "power1.inOut",
    },
    {
      startPos: new Vector3(5, 8.2, 20),
      target: new Vector3(0, 8.2, 10),
      duration: 6,
      ease: "power1.inOut",
    },
    // add as many as you want
  ];

  constructor(scene: Scene, playerSide: number) {
    super(scene);
    // this.camera.onViewMatrixChangedObservable.add(() => {
    //   console.log("alpha:", this.camera.alpha);
    //   console.log("beta:", this.camera.beta);
    //   console.log("radius:", this.camera.radius);
    //   console.log("position:", this.camera.position);
    //   console.log("target:", this.camera.target);
    // });

    this.playerSide = playerSide;
    this.setupPosition();
  }

  public setupPosition(): void {
    this.scene.activeCamera = this.camera;
    // Position the camera based on player side
    if (this.playerSide === 1) {
      this.camera.setPosition(new Vector3(0, 5.6, 11.8));
      this.camera.setTarget(new Vector3(0, 3, 0));
    } else {
      this.camera.setPosition(new Vector3(0, 5.6, -11.8));
      this.camera.setTarget(new Vector3(0, 3, 0));
    }

    this.camera.radius = 12;
  }
  // Animations
  public playCameraAnimations() {
    if (this.isPlayingAnimations) return;

    this.isPlayingAnimations = true;
    let index = 0;

    const playNext = () => {
      if (index >= this.animations.length) {
        this.isPlayingAnimations = false;
        this.scene.activeCamera = this.camera; // restore main camera
        return;
      }

      const anim = this.animations[index];
      const cam = new FreeCamera("camera", anim.startPos.clone(), this.scene);
      cam.setTarget(anim.target.clone());
      this.scene.activeCamera = cam;

      gsap.to(cam.position, {
        duration: anim.duration,
        x: anim.target.x,
        y: anim.target.y,
        z: anim.target.z,
        ease: anim.ease || "linear",
        onComplete: () => {
          cam.dispose();
          index++;
          playNext();
        },
      });
    };

    playNext();
  }

  public GameIntroAnimation() {
    const cam = new FreeCamera("camera", new Vector3(0, 8.2, 40), this.scene);
    cam.setTarget(Vector3.Zero());
    this.scene.activeCamera = cam;

    gsap.to(cam.position, {
      duration: 40,
      x: 0,
      y: 8.2,
      z: 10,
      ease: "power1.inOut",
      onComplete: () => {
        this.scene.activeCamera = this.camera;
        cam.dispose();
      },
    });
  }
}

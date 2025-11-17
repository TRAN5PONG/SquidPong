import { Scene, Vector3, FreeCamera } from "@babylonjs/core";
import { Camera } from "./Camera";
import gsap from "gsap";

type CameraAnimation = {
  startPos: Vector3;
  endPos: Vector3; // <- NEW
  target: Vector3;
  duration: number;
  ease?: string;
};

export class GameCamera extends Camera {
  private playerSide: number;
  private isPlayingAnimations = false;
  private animations: CameraAnimation[] = [
    {
      startPos: new Vector3(-0.5, 2.6, -3.1),
      endPos: new Vector3(-0.5, 2.6, -4),
      target: new Vector3(0, 3, 0),
      duration: 5,
      ease: "power1.inOut",
    },
    {
      startPos: new Vector3(-21, 2, -24),
      endPos: new Vector3(-20, 2, -23),
      duration: 4,
      target: new Vector3(0, 0, 0),
      ease: "power1.in",
    },
    {
      startPos: new Vector3(-1.9, 30, 1.2),
      endPos: new Vector3(-1.9, 50, 1.2),
      duration: 5,
      target: new Vector3(0, 0, 0),
      ease: "power1.in",
    },
    {
      startPos: new Vector3(
        -6.564118082458705,
        7.90837185281528,
        -8.852126855077001
      ),
      endPos: new Vector3(-3.564118082458705, 12, -4),
      target: new Vector3(0, 0, 0),
      duration: 6,
    },
    {
      startPos: new Vector3(-15.535476125713268, 12.658969478023767, 19),
      endPos: new Vector3(-13, 13, 19),
      target: new Vector3(
        -5.307733094892585,
        8.2854711601153,
        24.419874230007448
      ),
      duration: 7,
      ease: "power1.inOut",
    },
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
      if (!this.isPlayingAnimations) return;

      if (index >= this.animations.length) {
        index = 0;
      }

      const anim = this.animations[index];
      const cam = new FreeCamera("camera", anim.startPos.clone(), this.scene);
      cam.setTarget(anim.target.clone());
      this.scene.activeCamera = cam;

      gsap.to(cam.position, {
        duration: anim.duration,
        x: anim.endPos.x,
        y: anim.endPos.y,
        z: anim.endPos.z,
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
  public stopCameraAnimations() {
    this.isPlayingAnimations = false;
    this.scene.activeCamera = this.camera; // restore your main camera
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

import { Scene, Vector3 } from "@babylonjs/core";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";

export class BounceGameCamera {
  camera: UniversalCamera;
  scene: Scene;

  constructor(scene: Scene) {
	this.scene = scene;

	this.camera = new UniversalCamera(
      "camera",
      new Vector3(0, 5, -12), 
      scene
    );

    this.camera.setTarget(Vector3.Zero());

    this.camera.fov = (50 * Math.PI) / 180;
    
  }
}

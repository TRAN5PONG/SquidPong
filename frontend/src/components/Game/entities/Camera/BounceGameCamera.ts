import { Scene, Vector3 } from "@babylonjs/core";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";

export class BounceGameCamera {
  camera: ArcRotateCamera;
  scene: Scene;

  constructor(scene: Scene) {
	this.scene = scene;

	this.camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      16,
      Vector3.Zero(),
      scene
    );

	// fov to 50rad
    this.camera.fov = 0.5; 
  }
}

import { Scene, Vector3 } from "@babylonjs/core";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";

export class BounceGameCamera {
  camera: ArcRotateCamera;
  scene: Scene;

  constructor(scene: Scene) {
	this.scene = scene;

	this.camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,      // Alpha: looking from the side
      Math.PI / 2.5,     // Beta: angle from top
      16,                // Radius: distance from target
      Vector3.Zero(),    // Target: center of scene
      scene
    );

	// FOV: 50 degrees (like original Bounce-pong-3D)
    this.camera.fov = (50 * Math.PI) / 180; // Convert degrees to radians
    
    // Attach camera controls to canvas
    this.camera.attachControl(true);
  }
}

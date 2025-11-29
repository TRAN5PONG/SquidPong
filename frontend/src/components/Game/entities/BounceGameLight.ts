import { useEffect } from "@/lib/Zeroact";
import { Scene } from "@babylonjs/core/scene";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import {
  AbstractMesh,
  DirectionalLight,
  HemisphericLight,
  ShadowGenerator,
  SpotLight,
} from "@babylonjs/core";

export class BounceGameLight {
  ambient: HemisphericLight;
  point: PointLight
  spot: SpotLight;


  constructor(scene: Scene) {
    // Lights to mirror R3F setup
    this.ambient = new HemisphericLight(
      "ambientLight",
      new Vector3(0, 1, 0),
      scene
    );
    this.ambient.intensity = 0.5;

    this.point = new PointLight(
      "pointLight",
      new Vector3(-10, -10, -10),
      scene
    );
    this.point.intensity = 0.5;

    this.spot = new SpotLight(
      "spotLight",
      new Vector3(10, 10, 10),
      new Vector3(-1, -1, -1),
      0.3,
      1,
      scene
    );
    this.spot.intensity = 1;
    this.spot.shadowEnabled = true;
  }
}

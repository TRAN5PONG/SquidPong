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
    this.ambient = new HemisphericLight(
      "ambientLight",
      new Vector3(0, 1, 0),
      scene
    );
    this.ambient.intensity = 0.8;
    this.point = new PointLight(
      "pointLight",
      new Vector3(-18, -10, 10),
      scene
    );
    this.point.intensity = 0.6;

    this.spot = new SpotLight(
      "spotLight",
      new Vector3(10, 10, -10), 
      new Vector3(-1, -1, 1),  
      0.4,
      2, 
      scene
    );
    this.spot.intensity = 0.2;
    
    this.spot.shadowMinZ = 0;
    this.spot.shadowMaxZ = 250;
  }
}
